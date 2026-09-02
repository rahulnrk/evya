import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  ScrollView,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import {pallette} from '../../utils/pallette';
import {h, w} from '../../constants/dimensions';
import { medium, regular } from '../../utils/fonts';
import strings from '../../utils/strings';
import {adjust} from '../../helpers/common-functions';
import { useSelector } from 'react-redux';
import StationsService from '../../axios/Apis';
import { useAuth } from '../../hooks/useAuth';
import Geolocation from 'react-native-geolocation-service';
import AlertMessage from '../../extra/alertmessage';
import ErrorMessage from '../../extra/errormessages';
import Toast from 'react-native-toast-message';
const FranchiseRequestForm = ({navigation, route}: any) => {
  // ✅ State Hooks
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('');
  const [stationName, setStationName] = useState('');
  const [location, setLocation] = useState('');
  const [numberOfChargers, setNumberOfChargers] = useState('');
  const [chargerTypes, setChargerTypes] = useState('AC');
  const [powerCapacity, setPowerCapacity] = useState('');
  const [category, setCategory] = useState('FRANCHISE');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // ✅ Alert & Error States
  const [alertMessage, setAlertMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);

  // STATE-1: single auth source (Redux via useAuth)
  const { user, userId } = useAuth();
  const { address } = useSelector((state: any) => state.auth);
  const finalUserId = userId;

  // ✅ Pre-fill form when user data is available
  useEffect(() => {
    if (user || finalUserId) {
      prefillFormWithUserData();
      setLoading(false);
    } else {
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  }, [user, finalUserId]);

  const prefillFormWithUserData = () => {
    // Pre-fill station name with user's username
    if (user?.username) {
      setStationName(`${user.username}'s Charging Station`);
    } else if (user?.name) {
      setStationName(`${user.name}'s Charging Station`);
    } else {
      setStationName('My Charging Station');
    }
    
    // Pre-fill location with user's address if available
    if (address && address.length > 0) {
      const primaryAddress = address[0];
      if (primaryAddress.street || primaryAddress.city || primaryAddress.state) {
        const locationParts = [
          primaryAddress.street,
          primaryAddress.city,
          primaryAddress.state,
          primaryAddress.zipCode
        ].filter(Boolean);
        
        if (locationParts.length > 0) {
          setLocation(locationParts.join(', '));
        }
      }
    }
  };

  // ✅ Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to set franchise coordinates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
    return true;
  };

  // ✅ Get current location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    requestLocationPermission().then(granted => {
      if (granted) {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLatitude(latitude.toString());
            setLongitude(longitude.toString());
            setGettingLocation(false);
            setAlertMessage('Location captured successfully!');
          },
          (error) => {
            console.error('Geolocation error:', error);
            setGettingLocation(false);
            setErrorMessage('Failed to get current location. Please enter coordinates manually.');
          },
          { 
            enableHighAccuracy: true, 
            timeout: 15000, 
            maximumAge: 10000 
          }
        );
      } else {
        setGettingLocation(false);
        setErrorMessage('Location permission is required to get current coordinates.');
      }
    });
  };

  // ✅ Validate coordinates
  const validateCoordinates = (lat: string, lng: string) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      return 'Please enter valid numeric coordinates';
    }
    
    if (latNum < -90 || latNum > 90) {
      return 'Latitude must be between -90 and 90';
    }
    
    if (lngNum < -180 || lngNum > 180) {
      return 'Longitude must be between -180 and 180';
    }
    
    return null;
  };

  // ✅ Validate form
  const validateForm = () => {
    if (!stationName.trim()) {
      return 'Please enter station name';
    }
    if (!location.trim()) {
      return 'Please enter location';
    }
    if (!numberOfChargers.trim() || isNaN(Number(numberOfChargers)) || Number(numberOfChargers) <= 0) {
      return 'Please enter valid number of chargers';
    }
    if (!powerCapacity.trim()) {
      return 'Please enter power capacity';
    }
    if (!category.trim()) {
      return 'Please select category';
    }
    
    // Validate coordinates
    const coordError = validateCoordinates(latitude, longitude);
    if (coordError) {
      return coordError;
    }
    
    return null;
  };

  // ✅ Show confirmation alert
  const showConfirmationAlert = () => {
    setAlertMessage('Are you sure you want to submit this franchise request?');
    setShowConfirmAlert(true);
    setAlertCallback(() => handleSubmitConfirmed);
  };


   // ✅ Handle confirmed submission
  const handleSubmitConfirmed = async () => {
    if (!user || !finalUserId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User data not available. Please try again later.',
        position: 'top',
        visibilityTime: 4000,
      });
      return;
    }

    setSubmitting(true);
    try {      
      // Prepare franchise data for API - CORRECTED STRUCTURE
      const franchiseData = {
        userId: parseInt(finalUserId),
        category: category,
        franchiseName: user?.username || user?.name || "User Franchise",
        address: location.trim(),
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        mobileNumber: user?.mobileNumber || "",
        email: user?.email || "",
        sitename: siteName.trim(), // ✅ Added this field as per API
        stationName: stationName.trim(), // ✅ Added this field as per API
        status: false, // ✅ Added this field as per API
        sites: [
          {
            sitename: siteName.trim() || `${stationName.trim()} Site`,
            address: location.trim(),
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            stations: [
              {
                stationName: stationName.trim(),
                chargerCapacity: parseFloat(powerCapacity) || 50.0
              }
            ]
          }
        ]
      };
      
      console.log('Submitting franchise data:', JSON.stringify(franchiseData, null, 2));

      // Call the API
      const result = await StationsService.requestFranchise(franchiseData);
      
      if (result.success) {
        Toast.show({
          type: 'success', 
          text1: 'Success',
          text2: 'Franchise request submitted successfully!',
          position: 'top',
          visibilityTime: 3000,
        });
        
        // Navigate after delay
        setTimeout(() => {
          navigation.navigate(strings.franchises);
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to submit franchise request');
      }
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // Handle specific error messages
      let errorMsg = 'Failed to submit franchise request. Please try again.';
      
      if (error.message?.includes('User not found')) {
        errorMsg = `User with ID ${finalUserId} not found. Please check your account.`;
      } else if (error.response?.data?.error?.includes('getUserId() is null')) {
        errorMsg = 'User ID is missing. Please try logging in again.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
        position: 'top',
        visibilityTime: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Handle form submission
  const handleSubmit = () => {
    showConfirmationAlert();
  };

  // ✅ Handle alert close
  const handleAlertClose = (confirmed: boolean) => {
    setShowConfirmAlert(false);
    setAlertMessage('');
    
    if (confirmed && alertCallback) {
      alertCallback();
    }
  };

  // ✅ Get display user data
  const getDisplayUserData = () => {
    if (!user) {
      return {
        username: 'Not available',
        email: 'Not available',
        mobile: 'Not available',
        userId: finalUserId || 'Not available'
      };
    }

    return {
      username: user.username || user.name || 'N/A',
      email: user.email || 'N/A',
      mobile: user.mobileNumber || 'N/A',
      userId: finalUserId || 'N/A'
    };
  };

  // ✅ Show loading while checking user data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={pallette.primary} />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  const displayUser = getDisplayUserData();

  return (
    <View style={styles.Container} >
      <Header
        onback={() => navigation.goBack()}
        hastitle={true}
        onSkip={() => {}}
        skippable={false}
        title="Request Franchise"
      />
      
      <RootScroll>
        {/* User Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Details</Text>
          {!user && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>User data not available. Some fields may not be pre-filled.</Text>
            </View>
          )}
          <View style={styles.userDetail}>
            <Text style={styles.label}>Username:</Text>
            <Text style={styles.value}>{displayUser.username}</Text>
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{displayUser.email}</Text>
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.label}>Mobile:</Text>
            <Text style={styles.value}>{displayUser.mobile}</Text>
          </View>
          <View style={styles.userDetail}>
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.value}>{displayUser.userId}</Text>
          </View>
        </View>

        {/* Franchise Details Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Franchise Details</Text>
          
          {/* Category Dropdown */}
          <Text style={styles.inputLabel}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker}
              dropdownIconColor={pallette.primary}
            >
              <Picker.Item label="Franchise" value="FRANCHISE" />
              {/* <Picker.Item label="Site" value="SITE" />
              <Picker.Item label="Station" value="STATION" /> */}
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Site Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your site name"
            value={siteName}
            onChangeText={setSiteName}
            placeholderTextColor={pallette.grey}
          />

          <Text style={styles.inputLabel}>Station Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your charging station name"
            value={stationName}
            onChangeText={setStationName}
            placeholderTextColor={pallette.grey}
          />

          <Text style={styles.inputLabel}>Location Address *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter complete address location"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={pallette.grey}
            multiline
            numberOfLines={3}
          />

          {/* Coordinates Section */}
          <Text style={styles.inputLabel}>Coordinates *</Text>
          
          {/* Get Current Location Button */}
          <TouchableOpacity 
            style={[styles.locationButton, gettingLocation && styles.disabledButton]}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={pallette.white} />
            ) : (
              <Text style={styles.locationButtonText}>Get Current Location</Text>
            )}
          </TouchableOpacity>

          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateColumn}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 16.4375"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                placeholderTextColor={pallette.grey}
              />
            </View>
            <View style={styles.coordinateColumn}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 81.7031"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                placeholderTextColor={pallette.grey}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.inputLabel}>No. Of Chargers *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 4"
                value={numberOfChargers}
                onChangeText={setNumberOfChargers}
                keyboardType="number-pad"
                placeholderTextColor={pallette.grey}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.inputLabel}>Charger Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={chargerTypes}
                  onValueChange={(itemValue) => setChargerTypes(itemValue)}
                  style={styles.picker}
                  dropdownIconColor={pallette.primary}
                >
                  <Picker.Item label="AC" value="AC" />
                  <Picker.Item label="DC" value="DC" />
                  <Picker.Item label="Both" value="BOTH" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.inputLabel}>Power Capacity (kW) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 50"
                value={powerCapacity}
                onChangeText={setPowerCapacity}
                placeholderTextColor={pallette.grey}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (!user || !finalUserId || submitting) && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!user || !finalUserId || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={pallette.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {(!user || !finalUserId) ? 'Waiting for User Data...' : 'Submit Request'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </RootScroll>

      {/* Alert Message Component */}
      <AlertMessage
        message={alertMessage} 
        onClose={handleAlertClose}
        showConfirm={showConfirmAlert}
      />

      {/* Error Message Component */}
      <ErrorMessage message={errorMessage} />
       <Toast />
    </View >
  );
};

const styles = StyleSheet.create({
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: pallette.white,
  },
  loadingText: {
    fontSize: adjust(16),
    fontFamily: 'Poppins-Regular',
    color: pallette.grey,
    marginTop: h * 0.02,
  },

  // Card Styles
  Container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop:24,
  
  },
  card: {
    backgroundColor: pallette.white,
    borderRadius: w * 0.04,
    padding: w * 0.05,
    marginVertical: w * 0.03,
    marginHorizontal: w * 0.04,
    shadowColor: pallette.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: adjust(18),
    fontFamily: 'Poppins-Medium',
    color: pallette.black,
    marginBottom: h * 0.02,
  },

  // User Details Styles
  userDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: h * 0.012,
    paddingVertical: h * 0.005,
  },
  label: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: 'Poppins-Regular',
  },
  value: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: 'Poppins-Medium',
  },
  warningContainer: {
    backgroundColor: pallette.lightred,
    padding: w * 0.03,
    borderRadius: w * 0.02,
    marginBottom: h * 0.015,
  },
  warningText: {
    fontSize: adjust(12),
    color: pallette.red,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },

  // Form Input Styles
  inputLabel: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: 'Poppins-Medium',
    marginBottom: h * 0.008,
    marginTop: h * 0.015,
  },
  textInput: {
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: w * 0.02,
    paddingHorizontal: w * 0.04,
    paddingVertical: w * 0.035,
    fontSize: adjust(14),
    fontFamily: 'Poppins-Regular',
    color: pallette.black,
    backgroundColor: pallette.lightgrey,
  },
  textArea: {
    height: h * 0.1,
    textAlignVertical: 'top',
  },

  // Picker Styles
  pickerContainer: {
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: w * 0.02,
    overflow: 'hidden',
    backgroundColor: pallette.lightgrey,
  },
  picker: {
    height: h * 0.055,
    color: pallette.black,
    fontFamily: 'Poppins-Regular',
  },

  // Location Button Styles
  locationButton: {
    backgroundColor: pallette.primary,
    height: h * 0.05,
    borderRadius: w * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: h * 0.02,
    flexDirection: 'row',
  },
  locationButtonText: {
    color: pallette.white,
    fontSize: adjust(13),
    fontFamily: 'Poppins-Medium',
  },

  // Coordinates Styles
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: h * 0.02,
  },
  coordinateColumn: {
    flex: 0.48,
  },
  coordinateLabel: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: 'Poppins-Regular',
    marginBottom: h * 0.005,
  },

  // Row & Column Layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: h * 0.01,
  },
  column: {
    flex: 0.48,
  },

  // Submit Button Styles
  submitButton: {
    backgroundColor: pallette.primary,
    height: h * 0.065,
    borderRadius: w * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: h * 0.04,
    shadowColor: pallette.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: pallette.white,
    fontSize: adjust(15),
    fontFamily: 'Poppins-Medium',
  },

  // Disabled State
  disabledButton: {
    opacity: 0.6,
  },
});

export default FranchiseRequestForm;