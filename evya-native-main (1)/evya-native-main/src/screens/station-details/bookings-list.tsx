import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { h, w } from "../../constants/dimensions";
import { nav } from "../../helpers/common-functions";
import strings from "../../utils/strings";
import StationsService from "../../axios/Apis";
import { useAuth } from "../../hooks/useAuth";
import ErrorMessage from "../../extra/errormessages";
import { pallette } from "../../utils/pallette";
import { bold, medium, regular, semibold } from "../../utils/fonts";

const BOOKING_ROW_HEIGHT = 96;

/**
 * PERF-4: memoized booking row
 */
const ScheduleCard = React.memo(
  ({ item, onClick }: { item: any; onClick: () => void }) => (
    <TouchableOpacity onPress={onClick} style={styles.card} activeOpacity={0.7}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{item.date || "--"}</Text>
        <Text style={styles.monthText}>{item.month || ""}</Text>
      </View>
      <View style={styles.dayContainer}>
        <Text style={styles.dayText}>{item.day || ""}</Text>
        <Text style={styles.timeText}>{item.timeSlot || ""}</Text>
        <Text style={styles.durationText}>{item.duration || ""}</Text>
      </View>
      <Image
        source={require("../../assets/images/icons/right.png")}
        style={styles.icon}
      />
    </TouchableOpacity>
  ),
);

/**
 * ScheduleList Component - Main component that displays filtered bookings
 */
const ScheduleList = ({
  navigation,
  activeTabIndex,
}: {
  navigation: any;
  activeTabIndex: number;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // STATE-1: auth from Redux
  const { userId } = useAuth();

  const getApiEndpointByIndex = (index: number): Promise<any> => {
    switch (index) {
      case 0:
        return StationsService.getUpcomingReservations(userId);
      case 1:
        return StationsService.getCompletedReservations(userId);
      case 2:
        return StationsService.getCancelledReservations(userId);
      default:
        return StationsService.getUpcomingReservations(userId);
    }
  };

  const getDisplayNameByIndex = (index: number): string => {
    switch (index) {
      case 0:
        return "upcoming";
      case 1:
        return "completed";
      case 2:
        return "cancelled";
      default:
        return "upcoming";
    }
  };

  /**
   * Converts ISO date string to readable 12-hour UTC time (no timezone conversion)
   * Example: "2025-10-30T17:30:00.000+00:00" -> "5:30 PM"
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
   * Formats start/end ISO timestamps to display (UTC time kept as-is)
   */
  const formatScheduleData = (start: string, end: string) => {
    if (!start || !end)
      return {
        date: "--",
        month: "--",
        day: "--",
        timeSlot: "--",
        duration: "--",
      };

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      return {
        date: "--",
        month: "--",
        day: "--",
        timeSlot: "--",
        duration: "--",
      };

    const date = startDate.getUTCDate().toString().padStart(2, "0");
    const month = startDate.toLocaleString("default", { month: "short" });
    const day = startDate.toLocaleString("default", { weekday: "long" });

    const startTime = convertISOToDisplaySameTime(start);
    const endTime = convertISOToDisplaySameTime(end);
    const timeSlot = `${startTime} - ${endTime}`;

    const durationMinutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000
    );
    const duration = `${durationMinutes} mins`;

    return { date, month, day, timeSlot, duration };
  };

  const fetchBookingsData = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const apiResponse = await getApiEndpointByIndex(activeTabIndex);

      const formattedBookings = (apiResponse?.data || []).map(
        (booking: any) => {
          const startTime = booking.startTime || booking.startDateTime;
          const endTime = booking.endTime || booking.expiryDateTime;
          const formattedData = formatScheduleData(startTime, endTime);

          return {
            ...formattedData,
            reservationId: booking.reservationId,
            status: booking.status,
            id: booking.id || booking.reservationId,
            stationName: booking.stationName,
            address: booking.address,
          };
        }
      );

      setBookings(formattedBookings);
    } catch (error) {
      setErrorMessage("Failed to load bookings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToBookingDetails = useCallback(
    (item: any): void => {
      nav(navigation, strings.bookingdetails, {
        reservationId: item.reservationId,
      });
    },
    [navigation],
  );

  useEffect(() => {
    fetchBookingsData();
  }, [activeTabIndex]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ScheduleCard
        item={item}
        onClick={() => navigateToBookingDetails(item)}
      />
    ),
    [navigateToBookingDetails],
  );

  const keyExtractor = useCallback(
    (item: any, index: number) =>
      item.id?.toString() || item.reservationId?.toString() || `booking-${index}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: BOOKING_ROW_HEIGHT,
      offset: BOOKING_ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={pallette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ErrorMessage message={errorMessage} />

      <FlatList
        data={bookings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={
          bookings.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {getDisplayNameByIndex(activeTabIndex)} bookings found
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: pallette.white,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pallette.white,
    padding: 16,
    borderRadius: 10,
    shadowColor: pallette.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
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
  dayContainer: {
    flex: 1,
    marginRight: 12,
  },
  dateText: {
    color: pallette.white,
    fontSize: 18,
    fontFamily: bold,
  },
  monthText: {
    color: pallette.white,
    fontSize: 12,
    fontFamily: regular,
    marginTop: 2,
  },
  dayText: {
    fontSize: 18,
    fontFamily: semibold,
    color: pallette.black,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontFamily: regular,
    color: pallette.grey,
    marginBottom: 2,
  },
  durationText: {
    fontSize: 12,
    fontFamily: regular,
    color: pallette.mediumgrey,
  },
  icon: {
    height: w * 0.04,
    width: w * 0.04,
    resizeMode: "contain",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: pallette.grey,
    fontSize: 16,
    fontFamily: medium,
  },
});

export default ScheduleList;
