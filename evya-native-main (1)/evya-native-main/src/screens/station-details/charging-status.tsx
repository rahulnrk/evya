
import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Animated
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { pallette } from "../../utils/pallette";
import { regular, medium, semibold, bold } from "../../utils/fonts";
import strings from "../../utils/strings";
import { useAuth } from "../../hooks/useAuth";
import StationsService from "../../axios/Apis";
import ErrorMessage from "../../extra/errormessages";
import { useCharging } from "../../contexts/ChargingContext";
import SessionModel from "../ChargingScreen/SessionModel";
import Toast from "react-native-toast-message";

// ===================================================================
// INTERFACES
// ===================================================================

interface ChargingData {
  stationName: string;
  address: string;
  date: string;
  timeSlot: string;
  isCharging: boolean;
}

interface ChargingStatusProps {
  power: number;
  percentage: number;
  chargingTime: string;
  totalTime: string;
  cost: string;
  totalCost: string;
  units: number;
  totalUnits: number;
  speed: number;
  vehicleName: string;
  vehicleNumber: string;
  station: any;
  connector: any;
  charger: any;
  onChargingStarted: (chargingData: ChargingData) => void;
  onChargingStopped: () => void;
  isLoading?: boolean;
  status: string;
  onRefreshData?: () => Promise<void>;
}

interface SessionData {
  bookingId: string;
  date: string;
  time: string;
  stationName: string;
  stationAddress: string;
  stationProvider: string;
  chargingCost: string;
  totalCost: string;
  status: string;
  units: number;
}

interface Connector {
  portId?: string;
  slot?: string;
  connectorId?: string;
  connectorType?: string;
}

// ===================================================================
// CONSTANTS & HELPERS
// ===================================================================

const DEFAULT_VALUES = {
  BOOKING_ID: "--------",
  STATION_NAME: "--------",
  STATION_ADDRESS: "--------",
  STATION_PROVIDER: "--------",
  COST: "0.00",
  UNITS: "0.00",
} as const;

const STATUS_CONFIG: Record<string, {
  color: string;
  text: string;
  showStopButton: boolean;
}> = {
  Charging: {
    color: pallette.primary,
    text: 'Charging',
    showStopButton: true,
  },
  Finishing: {
    color: pallette.primary,
    text: 'Finishing',
    showStopButton: false,
  },
  Completed: {
    color: pallette.primary,
    text: 'Completed',
    showStopButton: false,
  },
  Stopped: {
    color: pallette.red,
    text: 'Stopped',
    showStopButton: false,
  },
  Error: {
    color: pallette.red,
    text: 'Error',
    showStopButton: true,
  },
  Available: {
    color: pallette.grey,
    text: 'Available',
    showStopButton: false,
  },
  Default: {
    color: pallette.grey,
    text: 'Unknown',
    showStopButton: false,
  }
};

const formatDate = (): string => {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (): string => {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const generateBookingId = (): string => 
  Math.random().toString(36).substring(2, 10).toUpperCase();

const getEndTime = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const validateChargingParameters = (
  userId: string | undefined, 
  connector: Connector | null, 
  charger: any | null
): string | null => {
  if (!userId) return "User ID missing";
  if (!connector?.portId) return "Port information missing";
  if (!charger?.stationId) return "Station information missing";
  return null;
};

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toFixed(2)}`;
};

const formatUnits = (units: number): string => {
  return `${units.toFixed(2)} kWh`;
};

// ===================================================================
// MEMOIZED COMPONENTS
// ===================================================================

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  percentage: number;
  power: number;
  status: string;
}

const CircularProgress = memo<CircularProgressProps>(({ 
  size, 
  strokeWidth, 
  percentage, 
  power,
  status 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const getStatusConfig = (statusKey: string) => {
    return STATUS_CONFIG[statusKey] || STATUS_CONFIG.Default;
  };

  const statusConfig = getStatusConfig(status);
  const progressColor = statusConfig.color;

  React.useEffect(() => {
    if (status === 'Charging') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [percentage, scaleAnim]);

  return (
    <Animated.View style={[
      styles.progressContainer, 
      { 
        transform: [
          { scale: scaleAnim },
          { scale: pulseAnim }
        ] 
      }
    ]}>
      <Svg width={size} height={size}>
        <Circle 
          cx={size / 2} 
          cy={size / 2} 
          r={radius} 
          stroke={pallette.mediumgrey} 
          strokeWidth={strokeWidth} 
          fill="none" 
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      
      {(status === 'Charging' || status === 'Finishing') && (
        <Image 
          source={require("../../assets/images/icons/charge.png")} 
          style={styles.chargeIcon} 
        />
      )}
      
      <Text style={styles.powerText}>{power.toFixed(1)}</Text>
      <Text style={styles.powerTagText}>kW</Text>
      <Text style={[styles.percentageText, { color: progressColor }]}>
        {Math.round(percentage)}%
      </Text>
    </Animated.View>
  );
});

CircularProgress.displayName = 'CircularProgress';

interface DetailBoxProps {
  label: string;
  value: string;
  testID?: string;
  isLoading?: boolean;
}

const DetailBox = memo<DetailBoxProps>(({ label, value, testID, isLoading = false }) => (
  <View style={styles.detailBox} testID={testID}>
    <Text style={styles.detailLabel}>{label}</Text>
    {isLoading ? (
      <ActivityIndicator size="small" color={pallette.primary} />
    ) : (
      <Text style={styles.detailValue}>{value}</Text>
    )}
  </View>
));

DetailBox.displayName = 'DetailBox';

interface StationInfoProps {
  stationName?: string;
  siteAddress?: string;
  connector: Connector | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const StationInfo = memo<StationInfoProps>(({ 
  stationName, 
  siteAddress, 
  connector, 
  onRefresh, 
  isLoading = false 
}) => (
  <View style={styles.stationContainer}>
    <View style={styles.stationInfo}>
      <Text style={styles.stationName} numberOfLines={1}>
        {stationName || "Charging Station"}
      </Text>
      <Text style={styles.stationAddress} numberOfLines={2}>
        {siteAddress || "Station Address"}
      </Text>
      <Text style={styles.connectorInfo}>
        Connector {connector?.slot || connector?.connectorId || 'N/A'} • {connector?.connectorType || "Type not specified"}
      </Text>
    </View>
    {onRefresh && (
      <View>
        <TouchableOpacity 
          style={styles.reloadButton}
          onPress={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={pallette.primary} />
          ) : (
            <Icon name='refresh' size={24} color={pallette.primary} />
          )}
        </TouchableOpacity>
      </View>
    )}
  </View>
));

StationInfo.displayName = 'StationInfo';

// ===================================================================
// MAIN COMPONENT
// ===================================================================

const ChargingStatus: React.FC<ChargingStatusProps> = ({
  power,
  percentage,
  chargingTime,
  totalTime,
  cost,
  totalCost,
  units,
  totalUnits,
  speed,
  vehicleName,
  vehicleNumber,
  station,
  connector,
  charger,
  onChargingStarted,
  onChargingStopped,
  isLoading = false,
  onRefreshData, 
  status,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isStopping, setIsStopping] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [reloading, setReloading] = useState(false);
  
  // STATE-1: auth from Redux
  const { userId } = useAuth();
  const { startCharging, stopCharging, chargingSession } = useCharging();
  const navigation = useNavigation();

  const stopAttemptRef = useRef(false);
  const autoStopHandledRef = useRef(false);
  const isInitializingRef = useRef(false);
  const navigationAttemptedRef = useRef(false);

  const progressSize = 200;
  const progressStrokeWidth = 8;
  
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.Default;

  // Handle refresh data
  const handleRefreshData = useCallback(async () => {
    if (reloading || !onRefreshData) return;
    
    setReloading(true);
    
    try {
      await onRefreshData();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Charging data refreshed!',
        position: 'top',
        visibilityTime: 2000,
      });
      
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to refresh charging data',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setReloading(false);
    }
  }, [reloading, onRefreshData]);

  // Initialize charging session
  useEffect(() => {
    const initializeSession = async () => {
      if (isInitializingRef.current || chargingSession || status !== 'Charging') {
        return;
      }
      
      if (station && connector) {
        isInitializingRef.current = true;
        
        try {
          const chargingData = {
            station: {
              id: station.id || station.SiteId,
              name: station.name || station.siteName,
              address: station.address || station.siteAddress
            },
            charger: {
              id: charger?.id,
              name: charger?.name,
              stationId: charger?.stationId || station.id
            },
            connector: connector
          };
          
          await startCharging(chargingData);
          
          onChargingStarted({
            stationName: chargingData.station.name,
            address: chargingData.station.address,
            date: "Today",
            timeSlot: `${formatTime()} - ${getEndTime()}`,
            isCharging: true,
          });

          console.log('✅ Charging session initialized');

        } catch (error) {
          console.error('Failed to start charging session:', error);
          setAlertMessage("Failed to start charging session");
        } finally {
          isInitializingRef.current = false;
        }
      }
    };

    initializeSession();
  }, [station, connector, charger, chargingSession, status, onChargingStarted, startCharging]);

  // Handle auto-stop when status changes
  useEffect(() => {
    const handleAutoStop = async () => {
      if (chargingSession && (status === 'Stopped' ||status === 'Available' || status === 'Completed' || status === 'Finishing') && !autoStopHandledRef.current) {
        console.log('🔄 Auto-stop triggered for status:', status);
        autoStopHandledRef.current = true;
        
        try {
          const finalSessionData: SessionData = {
            bookingId: chargingSession.transactionId || generateBookingId(),
            date: formatDate(),
            time: formatTime(),
            stationName: chargingSession.stationName || DEFAULT_VALUES.STATION_NAME,
            stationAddress: chargingSession.siteAddress || DEFAULT_VALUES.STATION_ADDRESS,
            stationProvider: DEFAULT_VALUES.STATION_PROVIDER,
            chargingCost: cost || DEFAULT_VALUES.COST,
            totalCost: totalCost || DEFAULT_VALUES.COST,
            units: units || Number(DEFAULT_VALUES.UNITS),
            status: status,
          };
          
          // Set session data BEFORE showing modal
          setSessionData(finalSessionData);
          setAlertMessage(`Charging ${status.toLowerCase()} successfully`);
          
          // Show modal first, then clear session
          setIsModalVisible(true);
          
          // Call onChargingStopped callback
          onChargingStopped();
          
          console.log('✅ Auto-stop completed');
          
        } catch (error) {
          console.error('Error during auto-stop:', error);
          setAlertMessage("Error during auto-stop");
        } finally {
          setIsStopping(false);
          stopAttemptRef.current = false;
        }
      }
    };

    handleAutoStop();

    // Reset autoStopHandled when status goes back to Charging
    if (status === 'Charging') {
      autoStopHandledRef.current = false;
    }
  }, [status, chargingSession, cost, totalCost, units, onChargingStopped]);

  // Handle stop charging button
  const handleStopCharging = useCallback(async (): Promise<void> => {
    console.log('🛑 Stop charging requested');
    
    if (isStopping || stopAttemptRef.current) {
      console.log('⚠️ Stop already in progress');
      return;
    }
    
    stopAttemptRef.current = true;
    setIsStopping(true);

    try {
      const validationError = validateChargingParameters(userId, connector, charger);
      if (validationError) {
        setAlertMessage(validationError);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: validationError,
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      const payload = {
        stationId: chargingSession?.stationId || station?.id,
        portId: connector?.portId,
        connectorId: connector?.connectorId || connector?.slot,
        requestType: "RemoteStop",
      };
        
      console.log('📤 Sending stop request:', payload);
      const response = await StationsService.occprequests(payload);
      
      if (response.data?.statusCode === 200 && response.data?.status === "Accepted") {
        setAlertMessage("Stop request sent. Charging will stop shortly.");
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Stop request sent. Charging will stop shortly.',
          position: 'top',
          visibilityTime: 3000,
        });
        
        // Server will update status to 'Stopped', which will trigger auto-stop
        console.log('✅ Stop request accepted');
        
      } else {
        const errorMsg = response.message || "Stop request failed";
        setAlertMessage(errorMsg);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
          position: 'top',
          visibilityTime: 3000,
        });
      }

    } catch (error: any) {
      console.error('❌ Stop charging error:', error);
      setAlertMessage(error.message || "Network error. Please try again.");
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Failed to send stop request',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsStopping(false);
      // Keep stopAttemptRef true until auto-stop completes
    }
  }, [userId, connector, charger, chargingSession, station, isStopping]);

  // Handle modal close
  const handleModalClose = useCallback(async () => {
    console.log('📭 Modal close requested');
    
    if (navigationAttemptedRef.current) {
      console.log('⚠️ Navigation already attempted');
      return;
    }
    
    navigationAttemptedRef.current = true;
    
    try {
      // First close the modal
      setIsModalVisible(false);
      setSelectedFeedback(null);
      setSessionData(null);
      setAlertMessage("");
      
      // Clear the charging session
      await stopCharging();
      console.log('✅ Charging session cleared');
      
      // Wait a moment then navigate
      setTimeout(() => {
        console.log('🚀 Navigating to home...');
        navigation.reset({
          index: 0,
          routes: [{ name: strings.home as never }],
        });
      }, 300);
      
    } catch (error: any) {
      console.error('❌ Error in handleModalClose:', error);
      // Fallback navigation
      navigation.navigate(strings.home as never);
    }
  }, [navigation, stopCharging]);

  const handleFeedbackSelect = useCallback((feedback: string) => {
    setSelectedFeedback(feedback);
  }, []);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up ChargingStatus');
      stopAttemptRef.current = false;
      autoStopHandledRef.current = false;
      isInitializingRef.current = false;
      navigationAttemptedRef.current = false;
    };
  }, []);

  // Use charging session data if available, otherwise use props
  const currentSessionData: SessionData = {
    bookingId: chargingSession?.transactionId || generateBookingId(),
    date: formatDate(),
    time: formatTime(),
    stationName: chargingSession?.stationName || station?.name || DEFAULT_VALUES.STATION_NAME,
    stationAddress: chargingSession?.siteAddress || station?.address || DEFAULT_VALUES.STATION_ADDRESS,
    stationProvider: DEFAULT_VALUES.STATION_PROVIDER,
    chargingCost: cost || DEFAULT_VALUES.COST,
    totalCost: totalCost || DEFAULT_VALUES.COST,
    units: units || Number(DEFAULT_VALUES.UNITS),
    status: status,
  };

  return (
    <View style={styles.container} testID="charging-status-screen">
      
      {alertMessage ? (
        <ErrorMessage 
          message={alertMessage} 
          onDismiss={() => setAlertMessage("")} 
          type={status === 'Error' ? 'error' : 'success'}
        />
      ) : null}

      <CircularProgress 
        size={progressSize}
        strokeWidth={progressStrokeWidth}
        percentage={percentage}
        power={power}
        status={status}
      />

      <StationInfo 
        stationName={chargingSession?.stationName || station?.name}
        siteAddress={chargingSession?.siteAddress || station?.address}
        connector={chargingSession?.connector || connector}
        onRefresh={handleRefreshData}
        isLoading={reloading}
      />

      <View style={styles.detailsContainer}>
        <DetailBox 
          label="Charging Time" 
          value={chargingTime}
          testID="charging-time-box"
          isLoading={isLoading}
        />
        
        <DetailBox 
          label="Current Cost" 
          value={formatCurrency(cost)}
          testID="current-cost-box"
          isLoading={isLoading}
        />
        
        <DetailBox 
          label="Units Used" 
          value={formatUnits(units)}
          testID="units-used-box"
          isLoading={isLoading}
        />
        
        <DetailBox 
          label="Charging Speed" 
          value={`${speed.toFixed(1)} kWh`}
          testID="charging-speed-box"
          isLoading={isLoading}
        />
      </View>

      <View style={styles.vehicleContainer}>
        <Image 
          source={require("../../assets/images/curveev.png")} 
          style={styles.vehicleImage} 
          resizeMode="contain"
        />
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {vehicleName}
          </Text>
          <Text style={styles.vehicleNumber} numberOfLines={1}>
            {vehicleNumber}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {statusConfig.showStopButton && (
          <TouchableOpacity 
            style={[
              styles.stopButton, 
              isStopping && styles.stopButtonDisabled
            ]} 
            onPress={handleStopCharging}
            disabled={isStopping}
            testID="stop-charging-button"
          >
            {isStopping ? (
              <ActivityIndicator size="small" color={pallette.white} />
            ) : (
              <Text style={styles.stopButtonText}>
                Stop Charging
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <SessionModel
        isVisible={isModalVisible}
        onClose={handleModalClose}
        selectedFeedback={selectedFeedback}
        onFeedbackSelect={handleFeedbackSelect}
        sessionData={sessionData || currentSessionData}
        chargingTime={chargingTime}
        getEndTime={getEndTime}
      />
    </View>
  );
};

// ===================================================================
// STYLES
// ===================================================================
const styles = StyleSheet.create({ 
  container: { 
    flex: 1, 
    alignItems: "center", 
    backgroundColor: pallette.white, 
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: { 
    alignItems: "center", 
    marginBottom: 24,
    position: 'relative',
  },
  chargeIcon: { 
    position: "absolute", 
    top: "20%", 
    height: 40, 
    width: 40, 
    resizeMode: 'contain',
  },
  powerText: { 
    position: "absolute", 
    top: "40%", 
    fontSize: 22, 
    fontFamily: bold, 
    textAlign: "center",
    color: pallette.black,
  },
  powerTagText: { 
    position: "absolute", 
    top: "50%", 
    fontSize: 16, 
    fontFamily: medium, 
    textAlign: "center",
    color: pallette.black,
  },
  percentageText: { 
    position: "absolute", 
    top: "65%", 
    fontSize: 16, 
    fontFamily: medium,
    textAlign: "center",
  },
  stationContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: 16,
    backgroundColor: pallette.lightgrey,
    borderRadius: 12,
    marginBottom: 8,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontFamily: semibold,
    color: pallette.black,
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    fontFamily: regular,
    color: pallette.grey,
    marginBottom: 4,
  },
  connectorInfo: {
    fontSize: 12,
    fontFamily: medium,
    color: pallette.primary,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: pallette.white,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: pallette.primary,
  },
  detailsContainer: { 
    width: "100%", 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginBottom: 14,
    gap: 12,
  },
  detailBox: { 
    width: "48%", 
    backgroundColor: pallette.lightgrey, 
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12, 
    alignItems: 'flex-start', 
    minHeight: 80,
  },
  detailLabel: { 
    fontSize: 14, 
    fontFamily: regular,
    color: pallette.grey,
    marginBottom: 4,
  },
  detailValue: { 
    fontSize: 16, 
    fontFamily: semibold,
    color: pallette.black,
    flex: 1,
    textAlignVertical: 'center',
  },
  vehicleContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    width: "100%", 
    paddingVertical: 16,
    paddingHorizontal: 16, 
    borderWidth: 1, 
    borderColor: pallette.mediumgrey, 
    borderRadius: 12, 
    marginBottom: 14,
    backgroundColor: pallette.white,
  },
  vehicleImage: { 
    width: 60, 
    height: 40, 
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: { 
    fontSize: 16, 
    fontFamily: semibold,
    color: pallette.black,
    marginBottom: 2,
  },
  vehicleNumber: { 
    fontSize: 14, 
    fontFamily: regular,
    color: pallette.grey,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
  },
  stopButton: { 
    backgroundColor: pallette.primary, 
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 14,
    borderRadius: 12, 
    width: "100%", 
    alignItems: "center",
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: pallette.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stopButtonDisabled: {
    backgroundColor: pallette.mediumgrey,
    shadowOpacity: 0,
    elevation: 0,
  },
  stopButtonText: { 
    color: pallette.white, 
    fontSize: 16, 
    fontFamily: bold,
    textAlign: 'center',
  },
});

export default memo(ChargingStatus);
