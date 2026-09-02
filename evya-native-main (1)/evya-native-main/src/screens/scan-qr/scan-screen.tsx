import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Camera, CameraApi } from 'react-native-camera-kit';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { h, w } from '../../constants/dimensions';
import { pallette, regular, bold, medium } from '../../utils/pallette';
import strings from '../../utils/strings';
import Header from '../../components/header-with-skip';
import AlertMessage from '../../extra/alertmessage';
import ErrorMessage from '../../extra/errormessages';
import StationsService from '../../axios/Apis';

const Scan = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraApi>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(true);

  const [alertMessage, setAlertMessage] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isFocused) {
      setIsScanning(true);
      setIsProcessing(false);
      setScannedData('');
      setErrorMessage('');
      setCameraActive(true);
    } else {
      setCameraActive(false);
      setIsScanning(false);
    }
  }, [isFocused]);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs camera access to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const hasCameraPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(hasCameraPermission);
      } catch (err) {
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  const handleQRScan = async (event: any) => {
    if (!isScanning || !hasPermission || isProcessing || !cameraActive) return;

    const qrData = event?.nativeEvent?.codeStringValue;

    if (!qrData) {
      return;
    }

    setIsScanning(false);
    setIsProcessing(true);
    setScannedData(qrData);

    try {
      await processQRCode(qrData);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to process QR code');
    } finally {
      setTimeout(() => {
        if (isFocused && cameraActive) {
          setIsScanning(true);
          setIsProcessing(false);
        }
      }, 2000);
    }
  };

  const transformStationData = (stationData: any) => {
    if (!stationData) return null;
    
    const transformedData = {
      siteId: stationData.site?.id || stationData.id,
      siteName: stationData.site?.siteName || "Charging Station",
      totalPorts: stationData.number_of_ports || 0,
      availablePorts: 0,
      totalStations: 1,
      ownerOrgId: stationData.site?.ownerOrg || 0,
      ownerId: stationData.site?.ownerId || 0,
      locations: [
        {
          address: "--",
          latitude: "--", 
          longitude: "--"
        }
      ],
      stations: [
        {
          "stationId": stationData.id,
          "stationName": stationData.stationName,
          "status": stationData.stationStatus || "---",
          "serial number": stationData.serialNo || "",
          "current Type": stationData.current_type || "---",
          "last heartbeat": stationData.lastHeartBeat || 0,
          "ports": (stationData.port || []).map((port: any) => ({
            "portId": port.id,
            "connectorId": port.connectorId,
            "connectorName": port.connectorName,
            "connectorType": port.connector_type,
            "powerType": port.power_type,
            "power capacity": port.max_power_kW,
            "billingAmount": port.billingAmount,
            "billing units": port.billingUnits,
            "statusNotifications": port.statusNotifcation || []
          }))
        }
      ]
    };
    
    return transformedData;
  };
 const processQRCode = async (qrData: string) => {
  let siteId, stationId, portId;
  
  console.log('QR Data received:', qrData); // Add this for debugging
  
  if (qrData.includes('siteId') && qrData.includes('stationId') && qrData.includes('portId')) {
    try {
      let paramsString = qrData;
      
      // Extract query parameters if URL contains '?'
      if (qrData.includes('?')) {
        // FIX: Use qrData, not scannedData
        paramsString = qrData.split('?')[1];
      }
      
      console.log('Params string to parse:', paramsString); // Add this
      
      const params = new URLSearchParams(paramsString);
      siteId = params.get('siteId');
      stationId = params.get('stationId');
      portId = params.get('portId');
      
      console.log('Extracted values:', { siteId, stationId, portId }); // Add this
      
    } catch (error) {
      console.log('URLSearchParams failed, trying regex:', error);
      const siteMatch = qrData.match(/siteId=([^&]+)/);
      const stationMatch = qrData.match(/stationId=([^&]+)/);
      const portMatch = qrData.match(/portId=([^&]+)/);
      
      siteId = siteMatch ? siteMatch[1] : null;
      stationId = stationMatch ? stationMatch[1] : null;
      portId = portMatch ? portMatch[1] : null;
      
      console.log('Regex extracted:', { siteId, stationId, portId }); // Add this
    }
  }

  console.log('Final values before validation:', { siteId, stationId, portId }); // Add this
  
  if (!siteId || !stationId || !portId) {
    throw new Error(
      `Invalid QR code format.\n\nExpected: https://backend.chargeevya.com/?siteId=0&stationId=9&portId=0 \n\nReceived: ${qrData}`
    );
  }

  await callStationAPI(stationId, siteId, portId);
};


// In your Scan screen's callStationAPI function
const callStationAPI = async (stationId: string) => {
  try {
    console.log("Calling API with stationId:", stationId);

    const response = await StationsService.getstationById(stationId);

    console.log("FULL API RESPONSE:", JSON.stringify(response?.data, null, 2));

    if (!response || !response.data) {
      throw new Error("Invalid API response");
    }

    const stationData = response.data;

    // Transform the data to match what station details expects
    const transformedData = {
      siteId: stationData.site?.id || stationData.id,
      siteName: stationData.site?.siteName || stationData.stationName || "Charging Station",
      totalPorts: stationData.number_of_ports || 0,
      availablePorts: 0,
      totalStations: 1,
      ownerOrgId: stationData.site?.ownerOrg || 0,
      ownerId: stationData.site?.ownerId || 0,
      locations: [
        {
          address: "--",
          latitude: "--", 
          longitude: "--"
        }
      ],
      stations: [
        {
          stationId: stationData.id,
          stationName: stationData.stationName,
          status: stationData.stationStatus || "---",
          "serial number": stationData.serialNo || "",
          "current Type": stationData.current_type || "---",
          "last heartbeat": stationData.lastHeartBeat || 0,
          ports: (stationData.port || []).map((port: any) => ({
            portId: port.id,
            connectorId: port.connectorId,
            connectorName: port.connectorName,
            connectorType: port.connector_type,
            powerType: port.power_type,
            "power capacity": port.max_power_kW,
            billingAmount: port.billingAmount,
            "billing units": port.billingUnits,
            statusNotifications: port.statusNotifcation || []
          }))
        }
      ]
    };

    console.log("FINAL DATA SENT TO DETAILS:", transformedData);

    // Navigate with the transformed data and screen parameter
    navigation.navigate(strings.hometab as never, {
      screen: strings.stationdetails,
      params: { 
        station: transformedData,
        screen: "scan" // This indicates it came from scan
      },
    } as never);

  } catch (error: any) {
    console.error("API Error:", error);
    setErrorMessage(error?.message || "Failed to fetch station details");
  }
};


  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to scan QR codes
          </Text>
          <Text style={styles.permissionSubText}>
            Please grant camera permission in your device settings
          </Text>
        </View>

        <ErrorMessage message={errorMessage} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isProcessing ? 'Processing...' : isScanning ? 'Ready to scan' : 'Scan complete'}
        </Text>
        {scannedData ? (
          <Text style={styles.scannedDataText} numberOfLines={1}>
            Scanned: {scannedData}
          </Text>
        ) : null}
        
        {isProcessing && (
          <ActivityIndicator size="small" color={pallette.white} style={styles.loadingIndicator} />
        )}
      </View>

      {cameraActive && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          scanBarcode={true}
          onReadCode={handleQRScan}
          showFrame={true}
          laserColor={pallette.primary}
          frameColor={pallette.white}
          cameraType={'back'}
          flashMode={'on'}
          readQRCode={true}
          scanInterval={1000}
          focusMode={'on'}
        />
      )}

      <AlertMessage
        message={alertMessage}
        showConfirm={showConfirm}
        onClose={confirmed => {
          setAlertMessage('');
          setShowConfirm(false);
        }}
      />

      <ErrorMessage message={errorMessage} />
    </SafeAreaView>
  );
};

export default Scan;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  permissionSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'gray',
  },
  camera: {
    flex: 1,
  },
  statusContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    padding: 10,
    zIndex: 1000,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scannedDataText: {
    color: 'yellow',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  loadingIndicator: {
    marginTop: 8,
  },
});