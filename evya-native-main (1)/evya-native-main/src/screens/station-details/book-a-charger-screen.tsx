import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { h } from '../../constants/dimensions';
import { pallette } from '../../utils/pallette';
import { adjust } from '../../helpers/common-functions';
import { bold, semibold, regular, medium } from '../../utils/fonts';
import Header from '../../components/header-with-skip';
import ErrorMessage from '../../extra/errormessages';
import BookingSuccessPopup from '../../extra/BookingSuccessPopup';
import StationsService from '../../axios/Apis';
import { useAuth } from '../../hooks/useAuth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';

interface BookChargerScreenProps {
  route: any;
  navigation: any;
}

const TIME_CONFIG = {
  START_HOUR: 0,
  END_HOUR: 23,
  INTERVAL_MINUTES: 15,
  AUTO_SCROLL_DELAY: 100
};

const DEFAULT_VALUES = {
  SITE_NAME: 'Unknown Site',
  CONNECTOR_NAME: 'Connector details not available',
  ADDRESS: 'Address not available',
  CONNECTOR_TYPE: 'Unknown',
  POWER_CAPACITY: 'Unknown',
  PRICE: '₹0/kWh'
};

const generateTimeSlots = (): string[] => {
  const times: string[] = [];
  
  for (let hour = TIME_CONFIG.START_HOUR; hour <= TIME_CONFIG.END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += TIME_CONFIG.INTERVAL_MINUTES) {
      const period = hour >= 12 ? 'pm' : 'am';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      times.push(
        `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
      );
    }
  }
  
  return times;
};

const convertTimeToMinutes = (time: string): number => {
  const [timePart, ampm] = time.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes;
  
  if (ampm === 'pm' && hours !== 12) totalMinutes += 12 * 60;
  if (ampm === 'am' && hours === 12) totalMinutes -= 12 * 60;
  
  return totalMinutes;
};

const convertMinutesToTimeString = (minutes: number): string => {
  let hours = Math.floor(minutes / 60);
  let mins = minutes % 60;
  let ampm = 'am';
  
  if (hours >= 12) {
    ampm = 'pm';
    if (hours > 12) hours -= 12;
  }
  if (hours === 0) hours = 12;
  
  return `${hours}:${mins.toString().padStart(2, '0')} ${ampm}`;
};

const convertToISOFormat = (timeString: string): string => {
  const [timePart, period] = timeString.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const day = today.getUTCDate();
  
  let hour24 = hours;
  if (period === 'pm' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'am' && hours === 12) {
    hour24 = 0;
  }
  
  const utcDate = new Date(Date.UTC(year, month, day, hour24, minutes, 0, 0));
  return utcDate.toISOString();
};

const getCurrentTimeSlot = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  
  const roundedMinutes = Math.floor(minutes / TIME_CONFIG.INTERVAL_MINUTES) * TIME_CONFIG.INTERVAL_MINUTES;
  
  return `${displayHour}:${roundedMinutes.toString().padStart(2, '0')} ${period}`;
};

const isTimeSlotInPast = (timeSlot: string): boolean => {
  const currentTimeMinutes = convertTimeToMinutes(getCurrentTimeSlot());
  const slotTimeMinutes = convertTimeToMinutes(timeSlot);
  return slotTimeMinutes <= currentTimeMinutes;
};

// NEW FUNCTION: Round minutes DOWN to the nearest 15-minute interval (for start times)
const roundDownTo15Minutes = (minutes: number): number => {
  return Math.floor(minutes / TIME_CONFIG.INTERVAL_MINUTES) * TIME_CONFIG.INTERVAL_MINUTES;
};

// NEW FUNCTION: Round minutes UP to the nearest 15-minute interval (for end times)
const roundUpTo15Minutes = (minutes: number): number => {
  return Math.ceil(minutes / TIME_CONFIG.INTERVAL_MINUTES) * TIME_CONFIG.INTERVAL_MINUTES;
};

// NEW FUNCTION: Convert reservation time to display format
const convertReservationTimeToSlotFormat = (dateString: string, isStartTime: boolean = true): string => {
  const date = new Date(dateString);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  
  // Use roundDown for start times, roundUp for end times
  const roundedMinutes = isStartTime 
    ? roundDownTo15Minutes(minutes)
    : roundUpTo15Minutes(minutes);
  
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  
  return `${displayHour}:${roundedMinutes.toString().padStart(2, '0')} ${period}`;
};

// NEW FUNCTION: Get all time slots between start and end time (in 15-min intervals)
const getTimeSlotsBetween = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const startMinutes = convertTimeToMinutes(startTime);
  const endMinutes = convertTimeToMinutes(endTime);
  
  let currentMinutes = startMinutes;
  while (currentMinutes < endMinutes) { // Use < instead of <= (end time is exclusive)
    slots.push(convertMinutesToTimeString(currentMinutes));
    currentMinutes += TIME_CONFIG.INTERVAL_MINUTES;
  }
  
  return slots;
};

const BookChargerScreen: React.FC<BookChargerScreenProps> = ({ route, navigation }) => {
  const { station, connector, Charger } = route.params || {};
  // STATE-1: auth from Redux
  const { userId } = useAuth();
  const { user } = useSelector((state: any) => state.auth);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [alertMessage, setAlertMessage] = useState<string>("");
  
  const scrollRef = useRef<FlatList<string>>(null);
  const timeSlots = generateTimeSlots();
  
  const siteName = Charger?.name || station?.siteName || DEFAULT_VALUES.SITE_NAME;
  const connectorName = connector?.connectorName || DEFAULT_VALUES.CONNECTOR_NAME;
  const address = station?.address || station?.locations?.[0]?.address || DEFAULT_VALUES.ADDRESS;
  const connectorType = connector?.connectorType || DEFAULT_VALUES.CONNECTOR_TYPE;
  const powerCapacity = connector?.currentType || connector?.powerType || DEFAULT_VALUES.POWER_CAPACITY;
  const price = connector?.price || DEFAULT_VALUES.PRICE;
  const portId = connector?.portId || null;
  const stationId = Charger?.stationId || station?.chargers?.[0]?.stationId;

  useEffect(() => {
    const fetchBookedSlots = async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        if (!portId) {
          setBookedSlots([]);
          return;
        }

        const response = await StationsService.getPortReservations(portId);
        const reservations = response.data|| [];
        console.log("reservations", reservations);
        
        const bookedSlotsList: string[] = [];
        
        reservations.forEach((reservation: any) => {
          // For start time: Round DOWN to nearest 15 minutes
          const startSlot = convertReservationTimeToSlotFormat(reservation.startTime, true);
          
          // For end time: Round UP to nearest 15 minutes
          const endSlot = convertReservationTimeToSlotFormat(reservation.endTime, false);
          
          console.log(`Reservation: ${reservation.startTime} -> ${reservation.endTime}`);
          console.log(`Converted slots: ${startSlot} -> ${endSlot}`);
          
          // Get all slots between rounded start and end times
          const slots = getTimeSlotsBetween(startSlot, endSlot);
          console.log(`Slots to block: ${slots}`);
          bookedSlotsList.push(...slots);
        });

        // Remove duplicates
        const uniqueBookedSlots = [...new Set(bookedSlotsList)];
        console.log("Final booked slots:", uniqueBookedSlots);
        setBookedSlots(uniqueBookedSlots);

        setTimeout(() => {
          const currentTimeSlot = getCurrentTimeSlot();
          const currentIndex = timeSlots.findIndex(time => time === currentTimeSlot);
          if (currentIndex !== -1 && scrollRef.current) {
            const row = Math.floor(currentIndex / 4);
            const scrollToY = row * 60;
            scrollRef.current.scrollToOffset({ offset: scrollToY, animated: true });
          }
        }, TIME_CONFIG.AUTO_SCROLL_DELAY);

      } catch (error) {
        console.error('Error fetching booked slots:', error);
        setAlertMessage("Failed to load availability data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookedSlots();
  }, [portId]);

  const isTimeSlotBooked = (time: string): boolean => {
    return bookedSlots.includes(time);
  };

  const isTimeSlotAvailable = (time: string): boolean => {
    return !isTimeSlotBooked(time) && !isTimeSlotInPast(time);
  };

  const handleTimeSlotSelection = (time: string): void => {
    if (!isTimeSlotAvailable(time)) {
      if (isTimeSlotBooked(time)) {
        Alert.alert('Slot Unavailable', 'This time slot is already booked.');
      } else if (isTimeSlotInPast(time)) {
        Alert.alert('Invalid Time', 'Cannot select time slots that have already passed.');
      }
      return;
    }

    if (selectedSlot === time) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(time);
    }
  };

  const handleBookingConfirmation = async (): Promise<void> => {
    if (!selectedSlot) {
      Alert.alert("Select a Slot", "Please select a slot before booking.");
      return;
    }

    setIsLoading(true);
    
    const startTimeISO = convertToISOFormat(selectedSlot);
    const endTimeISO = convertToISOFormat(
      convertMinutesToTimeString(convertTimeToMinutes(selectedSlot) + TIME_CONFIG.INTERVAL_MINUTES)
    );

    const reserveNowPayload = {
      stationId: stationId,
      portId: portId,
      connectorId: connector?.slot || connector?.connectorId,
      requestType: "ReserveNow",
      idTag: user.mobileNumber,
      userId: userId,
      startDate: startTimeISO,
    };

    navigation.navigate("Check In", { 
      station: station, 
      connector: connector,
      payload: reserveNowPayload,
      button: "Book Charger",
    });
    setIsLoading(false);
  };

  const handlePopupClose = (): void => {
    setShowSuccessPopup(false);
    setSelectedSlot(null);
    navigation.goBack();
  };

  const startTime = selectedSlot || '';
  const endTime = selectedSlot
    ? convertMinutesToTimeString(convertTimeToMinutes(selectedSlot) + TIME_CONFIG.INTERVAL_MINUTES)
    : 'End Time';

  return (
    <View style={styles.container}>
      <Header
        onback={() => navigation.goBack()}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'Book Charger'}
      />

      {alertMessage ? <ErrorMessage message={alertMessage} /> : null}

      <View style={styles.stationCard}>
        <Text style={styles.stationName}>{siteName}</Text>
        <View style={styles.infoRow}>
          <Icon name="ev-station" size={24} color={pallette.primary} />
          <View style={styles.infoDetails}>
            <View style={styles.detailsRow}>
              <Text style={styles.connectorText}>{connectorName}</Text>
              <Text style={styles.connectorType}>{connectorType} • {powerCapacity}</Text>
              <Text style={styles.costText}>{price}</Text>
            </View>
            <Text style={styles.addressText}>
              <Icon name="location-on" size={14} color={pallette.grey} /> {address}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.timeSection}>
        <View style={styles.timeHeader}>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <Text style={styles.timeValue}>{startTime}</Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Duration</Text>
            <Text style={styles.durationValue}>
              {selectedSlot ? `${TIME_CONFIG.INTERVAL_MINUTES} Mins` : '--'}
            </Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>End Time</Text>
            <Text style={styles.timeValue}>{endTime}</Text>
          </View>
        </View>
        <View style={{flexDirection:'row',justifyContent:'center',gap:20,}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <View style={{width:12,height:12,borderRadius:6,backgroundColor:pallette.primary}}></View>
            <Text style={{fontSize:12,fontFamily:regular}}>Selected</Text>
          </View>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <View style={{width:12,height:12,borderRadius:6,backgroundColor:pallette.red}}></View>
            <Text style={{fontSize:12,fontFamily:regular}}>Booked</Text>
          </View>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <View style={{width:12,height:12,borderRadius:6,backgroundColor:pallette.grey}}></View>
            <Text style={{fontSize:12,fontFamily:regular}}>Unavailable</Text>
          </View>
        </View>
        
        {/* PERF-5: virtualized time slots (was ScrollView + .map) */}
        <FlatList
          ref={scrollRef}
          data={timeSlots}
          keyExtractor={(time) => time}
          numColumns={4}
          style={styles.timeGridContainer}
          columnWrapperStyle={styles.timeGridRow}
          showsVerticalScrollIndicator={false}
          initialNumToRender={24}
          maxToRenderPerBatch={24}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item: time }) => {
            const isSelected = selectedSlot === time;
            const isBooked = isTimeSlotBooked(time);
            const isPast = isTimeSlotInPast(time);
            const isAvailable = isTimeSlotAvailable(time);

            return (
              <TouchableOpacity
                disabled={!isAvailable}
                onPress={() => handleTimeSlotSelection(time)}
                style={[
                  styles.timeSlot,
                  isSelected && styles.selectedTimeSlot,
                  isBooked && styles.bookedTimeSlot,
                  isPast && styles.pastTimeSlot,
                  !isAvailable && styles.disabledTimeSlot,
                ]}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    isSelected && styles.selectedTimeSlotText,
                    isBooked && styles.bookedTimeSlotText,
                    isPast && styles.pastTimeSlotText,
                    !isAvailable && styles.disabledTimeSlotText,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View>
        <View style={styles.termsContainer}>
          <Text style={styles.termsheader}>Terms & Conditions apply</Text>
          <Text style={styles.termsText}>*   ₹20 will be deducted as a reservation fee.</Text>
          <Text style={styles.termsText}>*   Slot time: {startTime} to {endTime}.</Text>
          <Text style={styles.termsText}>*   If you don't arrive within the slot, your reservation will be auto-cancelled.</Text>
          <Text style={styles.termsText}>*   Tap "Continue" to confirm your booking.</Text>
        </View>
        <View style={styles.actionBar}>
          <TouchableOpacity
            disabled={!selectedSlot || isLoading}
            onPress={handleBookingConfirmation}
            style={[
              styles.bookButton,
              (!selectedSlot || isLoading) && styles.disabledButton,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={pallette.white} />
            ) : (
              <Text style={[
                styles.bookButtonText,
                (!selectedSlot || isLoading) && styles.disabledButtonText,
              ]}>
                {!selectedSlot ? 'Select Time Slot' : 'Continue To Book'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <BookingSuccessPopup
        visible={showSuccessPopup}
        onClose={handlePopupClose}
        bookingData={bookingData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: pallette.white,
    padding: 16,
  },
  actionBar: {
    flexDirection: "row",
    paddingTop: 16,
    backgroundColor: pallette.white,
  },
  bookButton: {
    flex: 1,
    backgroundColor: pallette.white,
    borderWidth: 1,
    borderColor: pallette.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: pallette.mediumgrey,
    borderColor: pallette.mediumgrey,
  },
  bookButtonText: {
    color: pallette.primary,
    fontSize: 16,
    fontFamily: bold,
  },
  disabledButtonText: {
    color: pallette.white,
  },
  stationCard: {
    backgroundColor: pallette.lightgrey,
    padding: 16,
    borderRadius: 12,
    marginBottom: 7,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationName: {
    fontSize: adjust(15),
    fontFamily: bold,
    color: pallette.black,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoDetails: {
    flex: 1,
    marginLeft: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  connectorText: {
    fontSize: adjust(12),
    fontFamily: semibold,
    color: pallette.black,
    flex: 1,
    marginRight: 8,
  },
  connectorType: {
    fontSize: adjust(12),
    fontFamily: regular,
    color: pallette.grey,
    marginRight: 8,
  },
  costText: {
    fontSize: adjust(12),
    fontFamily: bold,
    color: pallette.primary,
  },
  addressText: {
    fontSize: adjust(10),
    fontFamily: regular,
    color: pallette.grey,
  },
  timeSection: {
    flex: 1,
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: pallette.lightgrey,
    padding: 16,
    borderRadius: 12,
  },
  timeBox: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: adjust(12),
    fontFamily: regular,
    color: pallette.grey,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: adjust(14),
    fontFamily: semibold,
    color: pallette.black,
  },
  durationValue: {
    fontSize: adjust(14),
    fontFamily: bold,
    color: pallette.primary,
  },
  timeGridContainer: {
    maxHeight: h * 0.35,
    marginBottom: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeGridRow: {
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  timeSlot: {
    width: '23%',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: pallette.white,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: pallette.secondary,
    borderColor: pallette.primary,
  },
  bookedTimeSlot: {
    backgroundColor: pallette.lightred,
  },
  pastTimeSlot: {
    backgroundColor: pallette.mediumgrey,
  },
  disabledTimeSlot: {
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: adjust(12),
    fontFamily: regular,
    color: pallette.black,
  },
  selectedTimeSlotText: {
    color: pallette.primary,
    fontFamily: semibold,
  },
  bookedTimeSlotText: {
    color: pallette.white,
    fontFamily: semibold,
  },
  pastTimeSlotText: {
    color: pallette.grey,
    fontFamily: regular,
  },
  disabledTimeSlotText: {
    color: pallette.grey,
  },
  termsContainer: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FFD580',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
  },
  termsheader: {
    fontSize: adjust(12),
    fontFamily: medium,
    color: pallette.black,
  },
  termsText: {
    color: '#A0522D',
    fontSize: adjust(11),
    marginBottom: 2,
  },
});

export default BookChargerScreen;