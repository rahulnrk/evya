import React, { useEffect, useState, ReactNode, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { h, w } from "../../constants/dimensions";
import { pallette } from "../../utils/pallette";
import StationsService from "../../axios/Apis";
import AlertMessage from "../../extra/alertmessage";
import ErrorMessage from "../../extra/errormessages";
import { bold, medium, regular, semibold } from "../../utils/fonts";
import strings from "../../utils/strings";

// Types
interface Port {
  id: number;
  portId: number;
  connectorId: number;
  connectorName: string;
  connectorType: string;
  powerType: string;
  maxPower: number;
  capacity: string;
  billingUnits: string;
  billingAmount: number;
  price: string;
  status: string;
  currentType: string;
  slot: string;
}

interface Charger {
  id: number;
  name: string;
  stationId: number;
  serialNo: string;
  model: string;
  status: string;
  maxOutputPower: number;
  currentType: string;
  numberOfPorts: number;
}

interface Site {
  id: number;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  managerName: string;
  managerEmail: string;
  managerPhone: string;
}

interface StationData {
  site: Site;
  charger: Charger;
  ports: Port[];
  bookedPort?: Port;
  available: number;
  totalPorts: number;
  power: string;
  current_type: string;
  price: string;
}

interface BookingData {
  reservationId?: string;
  stationId?: number;
  portId?: number;
  connectorId?: number;
  stationName?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  connector_type?: string;
  currentType?: string;
}

// Constants
const DEFAULT_COORDINATES = {
  latitude: 17.43133,
  longitude: 78.45443,
};

const DEFAULT_VALUES = {
  day: "----",
  date: "--",
  month: "---",
  time: "---- - ----",
  duration: "----",
};

/**
 * Converts ISO UTC date string to readable 12-hour time (e.g. "5:30 PM")
 */
const convertISOToDisplaySameTime = (isoString: string): string => {
  if (!isoString) return "--";
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "--";
  
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
};

/**
 * Transforms raw station data into structured format
 */
const transformStationData = (stationData: any, bookingPortId?: number): StationData | null => {
  if (!stationData) return null;

  const sourceData = stationData;

  // Site information
  const siteInfo: Site = {
    id: sourceData.site?.id || sourceData.id,
    name: sourceData.site?.siteName || sourceData.stationName || "Unknown Site",
    address: sourceData.address || "--",
    coordinates: {
      latitude: sourceData.latitude || 0,
      longitude: sourceData.longitude || 0,
    },
    managerName: sourceData.site?.managerName || "---",
    managerEmail: sourceData.site?.managerEmail || "---",
    managerPhone: sourceData.site?.managerPhone || "---",
  };

  // Charger information
  const chargerInfo: Charger = {
    id: sourceData.id,
    name: sourceData.stationName || `Charger ${sourceData.id}`,
    stationId: sourceData.id,
    serialNo: sourceData.serialNo || "---",
    model: sourceData.model || "---",
    status: sourceData.stationStatus || "---",
    maxOutputPower: sourceData.max_output_power_kW || 0,
    currentType: sourceData.current_type || "---",
    numberOfPorts: sourceData.number_of_ports || 0,
  };

  // Port information
  const portInfo: Port[] = (sourceData.port || []).map((port: any, index: number) => ({
    id: port.id || index,
    portId: port.id || index,
    connectorId: port.connectorId || index + 1,
    connectorName: port.connectorName || `Port-${index + 1}`,
    connectorType: port.connector_type || "---",
    powerType: port.power_type || "---",
    maxPower: port.max_power_kW || 0,
    capacity: `${port.max_power_kW || 0}kW`,
    billingUnits: port.billingUnits || "kWh",
    billingAmount: port.billingAmount || 0,
    price: `₹${port.billingAmount || 0}/${port.billingUnits || "kWh"}`,
    status: port.statusNotifcation?.[0]?.status || "Unknown",
    currentType: port.power_type || "---",
    slot: `Port ${index + 1}`,
  }));

  // Find specific port for booking
  const specificPort = bookingPortId 
    ? portInfo.find(port => port.portId === bookingPortId || port.connectorId === bookingPortId)
    : undefined;

  const availablePorts = portInfo.filter(port => 
    port.status?.toLowerCase() === "available"
  ).length;

  return {
    site: siteInfo,
    charger: chargerInfo,
    ports: portInfo,
    bookedPort: specificPort,
    available: availablePorts,
    totalPorts: portInfo.length,
    power: `${sourceData.max_output_power_kW || 0}kW`,
    current_type: sourceData.current_type || "--",
    price: portInfo.length > 0 
      ? `₹${portInfo[0].billingAmount || 0}/${portInfo[0].billingUnits || "kWh"}` 
      : "--",
  };
};

/**
 * BookingDetailsComponent - Displays detailed information about a specific booking
 */
const BookingDetailsComponent: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { reservationId } = route.params as { reservationId?: string };
  
  const { user } = useSelector((state: any) => state.auth);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [stationData, setStationData] = useState<StationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStartingCharge, setIsStartingCharge] = useState<boolean>(false);
  const [isCancelCharge, setIsisCancelCharge] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertComponent, setAlertComponent] = useState<ReactNode>(null);

  // Fetch booking details on component mount
  useEffect(() => {
    fetchBookingDetails();
  }, []);

  // Clear alert message after 3 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Fetch station details when booking data is available
  useEffect(() => {
    if (bookingData?.stationId) {
      fetchStationDetails();
    }
  }, [bookingData?.stationId]);

  /**
   * Fetches booking details from API
   */
  const fetchBookingDetails = async (): Promise<void> => {
    if (!reservationId) return;

    try {
      setIsLoading(true);
      const response = await StationsService.getReservationById(reservationId);
     
      if (Array.isArray(response?.data) && response.data.length > 0) {
        setBookingData(response.data[0]);
      } else {
        setBookingData({});
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      setBookingData({});
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches station details from API
   */
  const fetchStationDetails = async (): Promise<void> => {
    if (!bookingData?.stationId) return;

    try {
      const response = await StationsService.getstationDetailsById(bookingData.stationId);
      const transformedData = transformStationData(response, bookingData?.portId);
      setStationData(transformedData);
    } catch (error) {
      console.error('Failed to get station details:', error);
      setStationData(null);
    }
  };

  /**
   * Gets current time in IST
   */
  const getCurrentIST = (): Date => {
    const now = new Date();
    const timezoneOffset = 5.5 * 60 * 60 * 1000; // IST offset: +5:30 hours
    return new Date(now.getTime() + timezoneOffset);
  };

  /**
   * Checks if current time is within reservation period
   */
  const isWithinReservationTime = (): boolean => {
    if (!bookingData?.startTime || !bookingData?.endTime) return false;
    
    const now = getCurrentIST();
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);
    
    return now >= startTime && now <= endTime;
  };

  const isReservationEnded = (): boolean => {
    if (!bookingData?.endTime) return false;
    return getCurrentIST() > new Date(bookingData.endTime);
  };

  const isReservationUpcoming = (): boolean => {
    if (!bookingData?.startTime) return false;
    return getCurrentIST() < new Date(bookingData.startTime);
  };

  /**
   * Handles reservation cancellation
   */
  const handleReservationCancellation = async (): Promise<void> => {
    setAlertComponent(
      <AlertMessage
        message="Are you sure you want to cancel your reservation?"
        showConfirm={true}
        onClose={async (confirmed: boolean) => {
          setAlertComponent(null);
          if (!confirmed) return;

          try {
            setIsisCancelCharge(true);
            const cancelPayload = {
              stationId: bookingData?.stationId,
              requestType: "CancelReservation",
              reservationId: bookingData?.reservationId,
            };

            const response = await StationsService.occprequests(cancelPayload);
            
            if (response.data?.statusCode === 200 && response.data?.status === "Accepted") {
              setAlertMessage("Your reservation has been canceled successfully");
              setIsisCancelCharge(false);
              fetchBookingDetails();
            } else {
              setAlertMessage("Failed to cancel reservation. Please contact support.");
            }
          } catch {
            setAlertMessage("Something went wrong. Please try again.");
          } finally {
            setIsLoading(false);
          }
        }}
      />
    );
  };

  /**
   * Handles start charging process
   */
 const handleStartCharging = async (): Promise<void> => {
  if (!bookingData || !stationData) return;

  try {
    setIsStartingCharge(true);
    setAlertMessage("");

    const startChargingPayload = {
      stationId: bookingData.stationId,
      portId: bookingData.portId,
      connectorId: bookingData.connectorId,
      reservationId: bookingData.reservationId, 
      startDate: new Date(bookingData.startTime!),
      endDate: new Date(bookingData.endTime!),
      requestType: "RemoteStart",
      idTag: user.mobileNumber,
      userId: bookingData.userId,
    };

    // const response = await StationsService.occprequests(startChargingPayload);
    
    // if (response.data?.statusCode === 200 && response.data?.status === "Accepted") {
    //   setAlertMessage("Charging started successfully!");
    //   setBookingData(prev => prev ? { ...prev, status: "Charging" } : null);
      
      // Navigate to Charging screen
      navigation.navigate(strings.connectcharger, { 
        station: stationData.site, 
        connector: stationData.bookedPort,
        charger: stationData.charger,
        updatedPayload: startChargingPayload,
        // transactionId: undefined, // Add undefined since response is commented
      });
    // } else {
    //   setAlertMessage(response.data?.message || "Failed to start charging. Please try again.");
    // }
    // Remove this duplicate line: setIsStartingCharge(true);
  } catch (error) {
    console.error('Start Charging Error:', error);
    setAlertMessage("Something went wrong. Please try again.");
  } finally {
    setIsStartingCharge(false);
  }
};

  /**
   * Opens navigation to site location
   */
  const handleNavigationToSite = (): void => {
    const latitude = stationData?.site.coordinates.latitude || DEFAULT_COORDINATES.latitude;
    const longitude = stationData?.site.coordinates.longitude || DEFAULT_COORDINATES.longitude;
    
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    
    Linking.openURL(mapsUrl).catch(() => 
      setAlertMessage("Failed to open navigation app.")
    );
  };

  /**
   * Formats booking date and time for display
   */
  const formatBookingDateTime = (start: string, end: string) => {
    if (!start || !end) return DEFAULT_VALUES;

    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return DEFAULT_VALUES;
    }

    const day = startDate.toLocaleDateString("en-US", { weekday: "long" });
    const date = startDate.getUTCDate().toString().padStart(2, "0");
    const month = startDate.toLocaleString("default", { month: "short" }).toUpperCase();

    const startTime = convertISOToDisplaySameTime(start);
    const endTime = convertISOToDisplaySameTime(end);
    const time = `${startTime} - ${endTime}`;

    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    const duration = `${durationMinutes} Mins`;

    return { day, date, month, time, duration };
  };

  /**
   * Safely gets value or returns default
   */
  const getSafeValue = (value: any): string => value ? String(value) : "----";

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={pallette.primary} />
      </View>
    );
  }

  // Format booking date time
  const { day, date, month, time, duration } = formatBookingDateTime(
    bookingData?.startTime || "",
    bookingData?.endTime || ""
  );

  // Determine reservation status and button visibility
  const isReservationActive = bookingData?.status?.toLowerCase() === "reserved";
  const withinReservationTime = isWithinReservationTime();
  const reservationUpcoming = isReservationUpcoming();
  
  const showStartChargeButton = isReservationActive && withinReservationTime;
  const showNavigateButton = isReservationActive && reservationUpcoming;

  return (
    <View style={styles.container}>
      {/* Header Information */}
      <Text style={styles.bookingId}>
        Booking ID: {getSafeValue(bookingData?.reservationId)}
      </Text>
      <Text style={styles.date}>
        Date: {getSafeValue(bookingData?.startTime?.slice(0, 10))} | Time: {time}
      </Text>

      {/* Date Time Card */}
      <View style={styles.dateTimeCard}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.monthText}>{month}</Text>
        </View>
        <View style={styles.timeDetails}>
          <Text style={styles.dayText}>{day}</Text>
          <Text style={styles.timeText}>{time}</Text>
          <Text style={styles.durationText}>{duration}</Text>
          {isReservationActive && (
            <Text style={[
              styles.statusText,
              withinReservationTime && styles.activeStatus,
              reservationUpcoming && styles.upcomingStatus,
            ]}>
              {withinReservationTime ? "Active Now" : reservationUpcoming ? "Upcoming" : "Ended"}
            </Text>
          )}
        </View>
      </View>

      {/* Station Information */}
      <Text style={styles.stationTitle}>
        {getSafeValue(stationData?.site.name || bookingData?.stationName)}
      </Text>
      <Text style={styles.address}>
        {getSafeValue(stationData?.site.address || bookingData?.address)}
      </Text>

      {/* Charging Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailBox}>
          <Text style={styles.detailTitle}>
            {getSafeValue(bookingData?.connector_type)}
          </Text>
          <Image
            source={require("../../assets/images/chargers/c1.png")}
            style={styles.connectorIcon}
          />
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailTitle}>Price</Text>
          <Text style={styles.detailValue}>
            {getSafeValue(stationData?.bookedPort?.price)}
          </Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailTitle}>Power</Text>
          <Text style={styles.detailValue}>
            {getSafeValue(stationData?.bookedPort?.capacity)}
          </Text>
        </View>
      </View>

      {/* Cost Breakdown */}
      <View style={styles.costContainer}>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Charging Cost</Text>
          <Text style={styles.costValue}>
            {getSafeValue(stationData?.bookedPort?.price)}
          </Text>
        </View>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>GST</Text>
          <Text style={styles.costValue}>----</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total (Paid via Wallet)</Text>
          <Text style={styles.totalValue}>----</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.cancelButton, !isReservationActive && styles.disabledButton]}
          onPress={handleReservationCancellation}
          disabled={!isReservationActive}
        >
          {isCancelCharge ? (
            <ActivityIndicator size="small" color={pallette.primary} />
          ) : (
            <Text style={[styles.cancelButtonText, !isReservationActive && styles.disabledText]}>
            Cancel Reservation
          </Text>
          )}
          
        </TouchableOpacity>

        {showNavigateButton && (
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigationToSite}>
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Start Charge Button */}
      {showStartChargeButton && (
        <TouchableOpacity
          style={[styles.startChargeButton, isStartingCharge && styles.disabledButton]}
          onPress={handleStartCharging}
          disabled={isStartingCharge}
        >
          {isStartingCharge ? (
            <ActivityIndicator size="small" color={pallette.white} />
          ) : (
            <Text style={styles.startChargeButtonText}>Start Charge</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Alert Messages */}
      {alertMessage && (
        <ErrorMessage 
          message={alertMessage} 
          onDismiss={() => setAlertMessage("")}
        />
      )}
      
      {alertComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal:16, 
    backgroundColor: pallette.white 
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: pallette.white,
  },
  bookingId: { 
    fontSize: 16, 
    fontFamily: semibold, 
    color: pallette.black, 
    marginBottom: 4 
  },
  date: { 
    fontSize: 14, 
    fontFamily: regular, 
    color: pallette.grey, 
    marginBottom: 16 
  },
  dateTimeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pallette.white,
    padding: 16,
    borderRadius: 10,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  dateContainer: {
    backgroundColor: pallette.primary,
    borderRadius: 8,
    paddingVertical: h * 0.02,
    paddingHorizontal: 16,
    marginRight: 16,
    alignItems: "center",
    minWidth: 60,
  },
  timeDetails: { 
    flex: 1 
  },
  dateText: { 
    color: pallette.white, 
    fontSize: 18, 
    fontFamily: bold 
  },
  monthText: { 
    color: pallette.white, 
    fontSize: 12, 
    fontFamily: regular, 
    marginTop: 2 
  },
  dayText: { 
    fontSize: 18, 
    fontFamily: semibold, 
    color: pallette.black, 
    marginBottom: 4 
  },
  timeText: { 
    fontSize: 14, 
    fontFamily: regular, 
    color: pallette.grey, 
    marginBottom: 2 
  },
  durationText: { 
    fontSize: 12, 
    fontFamily: regular, 
    color: pallette.mediumgrey 
  },
  statusText: {
    fontSize: 12,
    fontFamily: medium,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  activeStatus: { 
    backgroundColor: pallette.primary, 
    color: pallette.white 
  },
  upcomingStatus: { 
    backgroundColor: pallette.lightred, 
    color: pallette.white 
  },
  endedStatus: { 
    backgroundColor: pallette.red, 
    color: pallette.white 
  },
  stationTitle: { 
    fontSize: 18, 
    fontFamily: bold, 
    color: pallette.black, 
    marginBottom: 4 
  },
  address: { 
    fontSize: 14, 
    fontFamily: regular, 
    color: pallette.grey, 
    marginBottom: 16 
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: pallette.lightgrey,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailBox: { 
    alignItems: "center", 
    flex: 1, 
    gap: h * 0.01 
  },
  detailTitle: { 
    fontSize: 14, 
    fontFamily: medium, 
    color: pallette.grey 
  },
  detailValue: { 
    fontSize: 14, 
    fontFamily: bold, 
    color: pallette.black 
  },
  connectorIcon: { 
    height: w * 0.04, 
    width: w * 0.04, 
    resizeMode: "contain" 
  },
  costContainer: {
    backgroundColor: pallette.white,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  costRow: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  costLabel: { 
    fontSize: 14, 
    fontFamily: regular, 
    color: pallette.grey 
  },
  costValue: { 
    fontSize: 14, 
    fontFamily: bold, 
    color: pallette.black 
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: pallette.mediumgrey,
  },
  totalLabel: { 
    fontSize: 14, 
    fontFamily: semibold, 
    color: pallette.black 
  },
  totalValue: { 
    fontSize: 16, 
    fontFamily: bold, 
    color: pallette.black 
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: pallette.white,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: pallette.primary,
  },
  cancelButtonText: { 
    fontSize: 16, 
    fontFamily: semibold, 
    color: pallette.primary 
  },
  navigateButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: pallette.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  navigateButtonText: { 
    fontSize: 16, 
    fontFamily: semibold, 
    color: pallette.white 
  },
  startChargeButton: {
    paddingVertical: 14,
    backgroundColor: pallette.primary,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    minHeight: 50,
    justifyContent: "center",
  },
  startChargeButtonText: { 
    fontSize: 16, 
    fontFamily: semibold, 
    color: pallette.white 
  },
  disabledButton: { 
    opacity: 0.5 
  },
  disabledText: { 
    color: pallette.mediumgrey 
  },
});

export default BookingDetailsComponent;