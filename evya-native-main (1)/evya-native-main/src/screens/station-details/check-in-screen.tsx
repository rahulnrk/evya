import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import {pallette} from '../../utils/pallette';
import {adjust, nav} from '../../helpers/common-functions';
import {medium} from '../../utils/fonts';
import {h, w} from '../../constants/dimensions';
import strings from '../../utils/strings';
import {TextInput} from 'react-native-paper';
import { SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import StationsService from '../../axios/Apis';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../extra/errormessages';
import Slider from '@react-native-community/slider';
import BookingSuccessPopup from '../../extra/BookingSuccessPopup';
import { useSelector } from 'react-redux';
import { current } from '@reduxjs/toolkit';

// Custom Tabs Component
const CustomTabs = ({ 
  tabs, 
  onTabChange, 
  activeTab = 0 
}: { 
  tabs: string[], 
  onTabChange: (index: number) => void, 
  activeTab?: number 
}) => {
  return (
    <View style={customTabStyles.container}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            customTabStyles.tab,
            activeTab === index ? customTabStyles.activeTab : customTabStyles.inactiveTab,
          ]}
          onPress={() => onTabChange(index)}>
          <Text
            style={[
              customTabStyles.tabText,
              activeTab === index ? customTabStyles.activeTabText : customTabStyles.inactiveTabText,
            ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const customTabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: pallette.lightgrey,
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: pallette.primary,
    borderRadius: 10,
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: adjust(14),
    fontFamily: medium,
  },
  activeTabText: {
    color: pallette.white,
    fontWeight: 'bold',
  },
  inactiveTabText: {
    color: pallette.grey,
  },
});

const CheckIn = ({route}: any) => {
  const navigation = useNavigation();
  // STATE-1: auth from Redux
  const { userId } = useAuth();
  const { user } = useSelector((state: any) => state.auth);
  
  // State management
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [alertMsg, setAlertMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState<any>({});
  const [sliderValue, setSliderValue] = useState(0);
  const [apiData, setApiData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [portAvailability, setPortAvailability] = useState<any>(null);
  const [maxAvailableTime, setMaxAvailableTime] = useState(480); // Default 8 hours

  // Constants for charging calculation
  const tabs = ['By Time', 'By Units', 'By Price'];
  const { station, connector, payload, initialTime, button, Charger } = route.params || {};
  const charger=Charger;
  const initialChargetime = initialTime || payload?.durationMinutes || 0;

  // Get dynamic values from connector and station
  const portCapacity = connector?.powerCapacity || 7; // kW
  
  const getPricePerUnit = (): number => {
    const priceString = connector?.price || station?.pricePerUnit || "20";
    
    if (typeof priceString === 'string') {
      const match = priceString.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    }
    
    return typeof priceString === 'number' ? priceString : 0;
  };

  const pricePerUnit = getPricePerUnit();

  // Time configuration
  const TIME_CONFIG = {
    INTERVAL_MINUTES: 30
  };

  /**
   * Format minutes into hours and minutes representation
   */
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    
    return `${hours}h ${mins}m`;
  };
/** Display ISO (UTC) in local device time for UI only (BUG-2). */
const convertISOToDisplaySameTime = (isoString: string): string => {
  if (!isoString) return "--";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
/** Transport timestamps as true UTC ISO — no manual IST offset (BUG-2). */
const getCurrentISTISO = (): string => {
    return new Date().toISOString();
};
  /**
   * Fetches availability for a specific port
   */
  const fetchPortAvailability = async (portId: string) => {
    try {
      setIsLoading(true);
     
 const response = button === "pay & charge" 
    ? await StationsService.portavaliablity(portId)
    : await StationsService.portavaliablity(portId, payload.startDate.slice(0, -1));
        console.log(response.data);
      if (response.data && response.data.portId) {
        const availabilityData = {
          portId: response.data.portId,
          status: response.data.status,
          durationHours: response.data.durationHours || 0,
          durationMinutes: response.data.durationMinutes || 0,
          calculatedAmount: response.data.calculatedAmount,
          unitsConsumed: response.data.unitsConsumed || 0.0,
          billingUnits: response.data.billingUnits,
          max_power_kW: response.data.max_power_kW || 0.0,
          billingAmount: response.data.billingAmount || 0.0,
          durationText: response.data.durationText
        };

        setPortAvailability(availabilityData);
        
        const availableMinutes =  availabilityData.durationHours * 60 + availabilityData.durationMinutes || 480;
        setMaxAvailableTime(Math.min(availableMinutes, 480));
        
        return availabilityData;
      } else {
        return console.log("soory");;
      }
    } catch (error) {
      return console.log(error);;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * API for charging calculations
   */
  const calculateCharging = async (value: number, type: string): Promise<any> => {
    try {
      let requestBody: any = {};
      
      switch (type) {
        case 'price':
          requestBody.amount = Math.max(value, 50);
          break;
        case 'units':
          requestBody.units = Math.max(value, 0.1);
          break;
        case 'time':
          requestBody.timeInHours = Math.max(value / 60, 5/60);
          break;
      }
      
      const response = await StationsService.calculateCharging(
        portCapacity,
        pricePerUnit,
        requestBody
      );
      
      return response.data;
      
    } catch (error) {
      throw new Error('Calculation failed');
    }
  };

  /**
   * Call API when input changes
   */
  useEffect(() => {
    if ((input && activeTab !== 0) || (activeTab === 0 && sliderValue > 0)) {
      callCalculationAPI();
    }
  }, [input, activeTab, sliderValue]);

  /**
   * Initialize with initial time if provided and fetch port availability
   */
  useEffect(() => {
    const initializeData = async () => {
      if (connector?.portId) {
        await fetchPortAvailability(connector.portId);
      }
      
      if (initialChargetime > 0 && !apiData) {
        const initialTimeToSet = Math.min(initialChargetime, maxAvailableTime);
        setSliderValue(initialTimeToSet);
        handleTimeSliderChange(initialTimeToSet);
      }
    };

    initializeData();
  }, [initialChargetime, connector?.portId]);

  const handlePopupClose = (): void => {
    setShowSuccessPopup(false);
    setSelectedSlot(null);
    navigation.goBack();
  };

  const callCalculationAPI = async () => {
    try {
      const type = getActiveTabType();
      let value = 0;
      
      if (activeTab === 0) {
        value = sliderValue;
      } else if (input && parseFloat(input) > 0) {
        value = parseFloat(input);
      } else {
        return;
      }
      
      const result = await calculateCharging(value, type);
      setApiData(result);
    } catch (error) {
      showAlert("Calculation failed");
    }
  };

  const getActiveTabType = (): string => {
    switch (activeTab) {
      case 2: return 'price';
      case 1: return 'units';
      case 0: return 'time';
      default: return 'time';
    }
  };

  /**
   * Reset input when tab changes to ensure clean state
   */
  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setInput('');
    setApiData(null);
    setIsEditing(false);
    if (tabIndex === 0) {
      const initialTimeToSet = Math.min(initialChargetime, maxAvailableTime);
      setSliderValue(initialTimeToSet);
    }
  };

  /**
   * Get placeholder text based on active tab
   */
  const getPlaceholder = (): string => {
    switch (activeTab) {
      case 2: return 'Enter amount (₹)';
      case 1: return 'Enter units (kWh)';
      case 0: return 'Enter time (minutes)';
      default: return 'Enter value';
    }
  };

  /**
   * Get input value based on active tab and API data
   */
  const getInputValue = (): string => {
    if (isEditing) return input;
    
    if (apiData) {
      switch (activeTab) {
        case 2: return apiData.amount?.toString() || '';
        case 1: return apiData.units?.toString() || '';
        case 0: return Math.round((apiData.timeInHours || 0) * 60).toString();
        default: return '';
      }
    }
    
    return '';
  };

  /**
   * Handle time slider change with validation against port availability
   */
  const handleTimeSliderChange = (value: number) => {
    const validatedValue = Math.min(value, maxAvailableTime);
    setSliderValue(validatedValue);
    setIsEditing(false);
  };

  /**
   * Handle input change with validation - CALL API IMMEDIATELY
   */
  const handleInputChange = (text: string) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    setInput(numericValue);
    setIsEditing(true);
    
    if (numericValue && parseFloat(numericValue) > 0) {
      callCalculationAPI();
    }
  };

  /**
   * Get final values for transaction with validation against port availability
   */
  const getFinalAmount = (): number => {
    const calculatedAmount = apiData?.amount || 0;
    const enteredAmount = activeTab === 2 && input ? parseFloat(input) : 0;
    
    if (activeTab === 2 && enteredAmount > 0) {
      return Math.min(enteredAmount, calculatedAmount);
    }
    
    return calculatedAmount;
  };

  const getActualUnits = (): number => {
    return apiData?.units || 0;
  };

  const getActualTime = (): number => {
    const calculatedTime = Math.round((apiData?.timeInHours || 0) * 60);
    
    if (activeTab === 0) {
      return Math.min(sliderValue, calculatedTime);
    }
    
    return calculatedTime;
  };

  const getActualPercentage = (): number => {
    const batteryCapacity = 50;
    const units = getActualUnits();
    return Math.min((units / batteryCapacity) * 100, 100);
  };

  const walletBalance = wallet?.data?.accountBalance || 0;

  const hasSufficientBalance = (): boolean => {
    const finalAmount = getFinalAmount();
    return walletBalance >= finalAmount;
  };

  /**
   * Show alert message with proper state management
   */
  const showAlert = (message: string) => {
    setAlertMsg(""); // Clear first to ensure re-render
    setTimeout(() => {
      setAlertMsg(message);
    }, 100);
  };

  const validateInput = (): boolean => {
    if (!apiData) {
      showAlert("Please enter charging details first");
      return false;
    }

    const finalAmount = getFinalAmount();
    const actualTime = getActualTime();
    
    if (finalAmount < 50) {
      showAlert("Minimum amount required is ₹50");
      return false;
    }

    if (portAvailability) {
      if (actualTime > maxAvailableTime) {
        showAlert(`Requested time exceeds available port time. Maximum: ${formatTime(maxAvailableTime)}`);
        return false;
      }
      
      // if (portAvailability.status === 'Charging') {
      //   showAlert(`Port is currently ${portAvailability.status}. Please try another port.`);
      //   return false;
      // }
    }

    if (activeTab === 0) {
      const enteredTime = sliderValue;
      const calculatedTime = Math.round((apiData.timeInHours || 0) * 60);
      
      if (enteredTime > calculatedTime) {
        showAlert(`Entered time exceeds calculated charging time. Maximum: ${formatTime(calculatedTime)}`);
        return false;
      }
    }

    if (!hasSufficientBalance()) {
      showAlert(`Insufficient wallet balance. Required: ₹${finalAmount.toFixed(2)}, Available: ₹${walletBalance.toFixed(2)}`);
      return false;
    }

    return true;
  };

  // Check if payment should be disabled
  const isPaymentDisabled = getFinalAmount() < 50 || isLoading || !apiData;

  /**
   * Fetch wallet details on component mount
   */
  useEffect(() => {
    const loadWalletDetails = async () => {
      try {
        const walletData = await StationsService.getWalletDetails(userId);
        setWallet(walletData);
      } catch (error) {
        showAlert("Failed to load wallet details");
      }
    };

    loadWalletDetails();
  }, [userId]);

  /**
   * Navigate to Add Money screen in wallet section
   */
  const handleAddMoney = (): void => {
    navigation.navigate(strings.wallettab as never, {
      screen: 'WalletNav',
      params: {
        screen: strings.addmoney
      }
    } as never);
  };

  /**
   * Reserve Now function for booking charger
   */
  const ReserveNow = async (): Promise<void> => {
    if (isLoading) return;
    if (!validateInput()) {
      return;
    }
   
    setIsLoading(true);

    try {
      if (!station?.chargers?.[0]?.stationId || !connector?.slot) {
        showAlert("Station or connector information missing");
        setIsLoading(false);
        return;
      }

      const actualAmount = getFinalAmount();
      const actualUnits = getActualUnits();
      const actualPercentage = getActualPercentage();
      const actualTime = getActualTime();

      const startTime = payload.startDate;
    
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + actualTime * 60 * 1000);
      const endTime = endDate.toISOString();

      const updatedPayload = {
        stationId: payload.stationId,
        portId: payload.portId,
        connectorId: payload.connectorId,
        requestType: "ReserveNow",
        idTag: payload.idTag,
        userId: payload.userId,
        startDate: payload.startDate,
        endDate: endTime,
      };

      

      const response = await StationsService.occprequests(updatedPayload);
console.log(updatedPayload),console.log(response.data)
      if (response.data?.statusCode === 200 && response.data?.status === "Accepted") {
        const bookingInfo = {
           bookingId:response.data?.reservationId ,
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          date: new Date().toLocaleDateString(),
          timeSlot: `${convertISOToDisplaySameTime(startTime)} - ${convertISOToDisplaySameTime(endTime)}`,
          duration: `${formatTime(actualTime)}`,
          stationName: station?.name || connector.name,
          address: station?.address,
          connectorType: connector.connectorType,
          price: connector.price,
          powerLevel: connector.powerCapacity,
          totalCost: actualAmount,
        };

        setBookingData(bookingInfo);
        setShowSuccessPopup(true);
        showAlert("Your reservation has been confirmed successfully");
      } else {
        showAlert(response.message || "Failed to make reservation. Please try again.");
      }

    } catch (error) {
      console.log(error);
      showAlert("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start charging transaction process
   */
  const startChargingTransaction = async (): Promise<void> => {
    if (isLoading) return;
    if (!validateInput()) {
      return;
    }
   
    setIsLoading(true);

      if (!station?.chargers?.[0]?.stationId || !connector?.slot) {
        showAlert("Station or connector information missing");
        setIsLoading(false);
        return;
      }

      const actualAmount = getFinalAmount();
      const actualUnits = getActualUnits();
      const actualPercentage = getActualPercentage();
      const actualTime = getActualTime();
      // BUG-2: use real UTC now (do not add 5h30m — toISOString already is UTC)
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + actualTime * 60000);

      const updatedPayload = {
        stationId: Charger?.stationId,
        portId: connector.portId,
        connectorId: connector.slot,
        requestType: "RemoteStart",
        idTag: user.mobileNumber,
        userId: userId,
        startDate: startTime.toISOString(),
       endDate: endTime.toISOString(),
      };
       navigation.navigate(strings.connectcharger, { 
            station, 
            connector,
            charger,    
            updatedPayload,
            chargingDetails: {
              actualTime: actualTime,
              actualAmount: actualAmount,
              units: actualUnits,
              percentage: actualPercentage,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString()
            }
          });
      

      setIsLoading(false);
  };

  /**
   * Handle button press based on button type
   */
  const handleButtonPress = (): void => {
    if (button === "pay & charge") {
      startChargingTransaction();
    } else if (button === "Book Charger") {
      ReserveNow();
    }
  };

  /**
   * Render time slider for "By Time" tab with port availability limits
   */
  const renderTimeSlider = () => {
    if (activeTab !== 0) return null;

    return (
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          Charging Time: {formatTime(sliderValue)} / {formatTime(maxAvailableTime)} max
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maxAvailableTime}
          value={sliderValue}
          onValueChange={handleTimeSliderChange}
          minimumTrackTintColor={pallette.primary}
          maximumTrackTintColor={pallette.grey}
          thumbTintColor={pallette.primary}
          step={5}
        />
        {portAvailability && (
          <Text style={styles.availabilityText}>
            Port Availability: {portAvailability.status} • Max: {formatTime(maxAvailableTime)}
          </Text>
        )}
      </View>
    );
  };
     
const startTime = payload?.startDate ?? getCurrentISTISO(new Date().toISOString());
    
      const actualTime = getActualTime();
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + actualTime * 60 * 1000);
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Component */}
      <Header
        onback={() => navigation.pop(2)}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'EV Charging Check-In'}
      />

      <RootScroll>
        <View style={styles.tabs}>
          {/* Tab Selection */}
          <CustomTabs 
            tabs={tabs} 
            onTabChange={handleTabChange}
            activeTab={activeTab}
          />
        </View>

        <View style={styles.container}>
          {/* Time Slider for By Time tab */}
          {renderTimeSlider()}

          {/* Input Field - Editable with API data */}
          {activeTab !== 0 && (
            <View style={styles.inputBox}>
              <TextInput
                style={styles.inputText}
                value={getInputValue()}
                placeholder={getPlaceholder()}
                placeholderTextColor={pallette.grey}
                keyboardType="numeric"
                underlineColor="transparent"
                onChangeText={handleInputChange}
                activeUnderlineColor="transparent"
                theme={{
                  colors: {
                    primary: pallette.grey,
                    text: pallette.black,
                    placeholder: pallette.grey,
                  },
                }}
              />
            </View>
          )}

         {/* Display calculated details */}
          {apiData ? (
            <View style={styles.calculationSection}>
              <Text style={styles.sectionTitle}>Session Estimation</Text>
              
              <View style={styles.estimationRow}>
                <View style={styles.estimationColumn}>
                  <Text style={styles.estimationLabel}>Energy</Text>
                  <Text style={styles.estimationValue}>{getActualUnits().toFixed(1)} kWh</Text>
                </View>
                
                <View style={styles.estimationColumn}>
                  <Text style={styles.estimationLabel}>Charger</Text>
                  <Text style={styles.estimationValue}>{portCapacity} kW</Text>
                </View>
                
                <View style={styles.estimationColumn}>
                  <Text style={styles.estimationLabel}>Rate</Text>
                  <Text style={styles.estimationValue}>₹{pricePerUnit}/kWh</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.estimationRow}>
                <View style={styles.estimationColumn}>
                  <Text style={styles.estimationLabel}>Est. Duration</Text>
                  <Text style={styles.estimationValue}>
                    {formatTime(Math.min(getActualTime(), maxAvailableTime)) }
                  </Text>
                  {/* {getActualTime() > maxAvailableTime && (
                    <Text style={styles.warningText}>
                      Max: {formatTime(maxAvailableTime)}
                    </Text>
                  )} */}
                </View>

                <View style={styles.estimationColumn}>
                  <Text style={styles.estimationLabel}>Est. Ends</Text>
                  <Text style={styles.estimationValue}>
                    {apiData.timeInHours ? 
                      // new Date(new Date().getTime() + Math.min(getActualTime(), maxAvailableTime) * 60000)
                      //   .toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                     convertISOToDisplaySameTime(endDate.toISOString())
                      : '--:--'}
                  </Text>
                </View>
                
                <View style={styles.estimationColumn}>
                  <Text style={styles.estimationLabel}>Est. Price</Text>
                  <Text style={styles.estimationValue}>
                    ₹{getFinalAmount().toFixed(2)}
                  </Text>
                </View>
              </View>

              {getActualTime() > maxAvailableTime && (
                <Text style={styles.warningText}>
                   Calculated time exceeds port availability. Limited to {formatTime(maxAvailableTime)}
                </Text>
              )}

              {portAvailability && (
                <Text style={styles.availabilityInfo}>
                  Port Status: <Text style={{color: portAvailability.status === 'Available' ? 'green' : 'red'}}>
                    {portAvailability.status}
                  </Text>
                  {maxAvailableTime > 0 && ` • Max Available: ${formatTime(maxAvailableTime)}`}
                </Text>
              )}

              {!hasSufficientBalance() && (
                <Text style={styles.warningText}>
                  Insufficient balance in wallet
                </Text>
              )}
            </View>
          ) : null}

          {/* Instructions Section */}
          <View style={styles.instructionBox}>
            <Text style={styles.instructionHeader}>Instructions</Text>
            <Text style={styles.instructionLine}>
              {button === "pay & charge" ? "🔌 Please connect the charging gun properly before proceeding." : " ₹ 20 will be deducted as a reservation fee."}
            </Text>
            <Text style={styles.instructionLine}>
              {button === "pay & charge" ? "💰 A minimum of ₹50 is required to start charging." : " • If you don't arrive within the slot, your reservation will be auto-cancelled"}
            </Text>
            {activeTab === 0 && (
              <Text style={styles.instructionLine}>
               •   Drag the slider to adjust charging time (Max: {formatTime(maxAvailableTime)} based on port availability)
              </Text>
            )}
          </View>

          {/* Payment Section */}
          <View style={styles.paymentSection}>
            <View style={styles.row}>
              <Text style={styles.costTitle}>Total Charging Cost</Text>
              <Text style={styles.costAmount}>
                ₹{getFinalAmount().toFixed(2)}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.termsText}>*T&C Apply</Text>
              <TouchableOpacity>
                <Text style={styles.linkText}>View cost breakup</Text>
              </TouchableOpacity>
            </View>

            {/* Wallet and Payment Action */}
            <View style={[styles.row, styles.walletSection]}>
              <View>
                <Text style={styles.walletTitle}>Evya Wallet</Text>
                <View style={styles.walletBalanceRow}>
                  <Text
                    style={[
                      styles.walletAmount,
                      {color: isPaymentDisabled ? pallette.grey : pallette.primary},
                    ]}>
                    ₹ {walletBalance.toFixed(2)}
                  </Text>

                  {/* Add Money Button */}
                  <TouchableOpacity
                    style={styles.addMoneyButton}
                    onPress={handleAddMoney}>
                    <Text style={styles.addMoneyText}>Add Money</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Button based on button type */}
              <TouchableOpacity
                style={[
                  styles.payButton,
                  {
                    backgroundColor: isPaymentDisabled || !hasSufficientBalance() ? 
                      pallette.grey : 
                      pallette.primary,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                disabled={isLoading || isPaymentDisabled || !hasSufficientBalance()}
                onPress={handleButtonPress}>
                <Text style={styles.payButtonText}>
                  {isLoading ? 'Processing...' : button}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RootScroll>
      
      <BookingSuccessPopup
        visible={showSuccessPopup}
        onClose={handlePopupClose}
        bookingData={bookingData}
      />
      
      {/* Error/Success Message Display */}
      {alertMsg ? (
        <ErrorMessage 
          message={alertMsg} 
          onDismiss={() => setAlertMsg("")} 
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1, 
    backgroundColor: pallette.white, 
    paddingTop: h * 0.02
  },
  tabs: {
    marginTop: 0,
  },
  container: {
    padding: 15,
    backgroundColor: pallette.white,
    flex: 1,
    minHeight: h * 0.75,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: pallette.grey,
    borderRadius: 6,
    marginTop: h * 0.01,
  },
  inputText: {
    color: pallette.black,
    fontSize: adjust(19),
    backgroundColor: 'transparent',
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginVertical: h * 0.01,
    paddingHorizontal: 10,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  sliderLabel: {
    textAlign: 'center',
    fontSize: adjust(16),
    color: pallette.black,
    fontFamily: medium,
    marginBottom: 5,
  },
  availabilityText: {
    textAlign: 'center',
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: medium,
    marginTop: 5,
  },
  calculationSection: {
    backgroundColor: pallette.lightgrey,
    borderRadius: 12,
    padding: 16,
    marginVertical: h * 0.01,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
  },
  sectionTitle: {
    fontSize: adjust(16),
    fontWeight: '600',
    color: pallette.black,
    marginBottom: 10,
    fontFamily: medium,
  },
  estimationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  estimationColumn: {
    flex: 1,
  },
  estimationLabel: {
    fontSize: adjust(12),
    color: pallette.grey,
    marginBottom: 4,
    fontFamily: medium,
  },
  estimationValue: {
    fontSize: adjust(14),
    color: pallette.black,
    fontWeight: '600',
    fontFamily: medium,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 4,
    marginHorizontal: -8,
  },
  availabilityInfo: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: medium,
    marginTop: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: adjust(12),
    color: pallette.red,
    fontFamily: medium,
    marginTop: 3,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionHeader: {
    fontSize: adjust(15),
    marginTop: 3,
    fontFamily: medium,
    marginBottom: 8,
    color: pallette.black,
  },
  instructionBox: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FFD580',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  instructionLine: {
    marginTop: 9,
    color: '#A0522D',
    fontSize: adjust(13),
    marginBottom: 2,
  },
  paymentSection: {
    marginTop: h * 0.01,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletSection: {
    marginTop: 25,
  },
  costTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: pallette.black,
  },
  costAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: pallette.black,
  },
  termsText: {
    color: pallette.grey,
    marginTop: h * 0.01,
    fontSize: adjust(13),
  },
  linkText: {
    color: pallette.primary,
    marginTop: 8,
    fontSize: adjust(13),
  },
  walletTitle: {
    fontSize: adjust(15),
    fontWeight: '600',
    color: pallette.black,
    marginBottom: 4,
  },
  walletBalanceRow: {
    flexDirection: 'row', 
    alignItems: 'center'
  },
  walletAmount: {
    fontSize: adjust(14),
    fontWeight: 'bold',
    marginBottom: 40
  },
  addMoneyButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
    marginBottom: 40
  },
  addMoneyText: {
    color: '#fff',
    fontSize: adjust(12),
    fontWeight: '600',
  },
  payButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckIn;