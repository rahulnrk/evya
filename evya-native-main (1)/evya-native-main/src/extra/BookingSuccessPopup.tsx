import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { bold, regular } from "../utils/fonts";
import { pallette } from "../utils/pallette";
import { useNavigation } from '@react-navigation/native';
import strings from "../utils/strings";
import { nav } from "../helpers/common-functions";

const BookingSuccessPopup = ({ visible, onClose, bookingData }) => {
  const navigation = useNavigation();
  if (!bookingData) return null;

  const {
    bookingId,
    day,
    date,
    timeSlot,
    duration,
    stationName,
    address,
    connectorType,
    price,
    powerLevel,
    totalCost,
  } = bookingData;

  const handleClose = () => {
    onClose?.();
    nav(navigation, strings.mybookings); // ✅ navigate to BookingDetails page
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.successTitle}>Booking Successful!</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Booking ID */}
            <Text style={styles.bookingId}>Booking ID: {bookingId}</Text>

            {/* Date & Time */}
            <View style={styles.dateTimeRow}>
              <View style={styles.dateBox}>
                <Text style={styles.date}>{date}</Text>
                <Text style={styles.day}>{day}</Text>
              </View>
              <View style={styles.timeBox}>
                <Text style={styles.time}>{timeSlot}</Text>
                <Text style={styles.duration}>{duration}</Text>
              </View>
            </View>

            {/* Station Info */}
            <Text style={styles.stationName}>{stationName}</Text>
            <Text style={styles.address} numberOfLines={1}>{address}</Text>

            {/* Charger Details */}
            <View style={styles.chargerTable}>
              <View style={styles.tableRow}>
                <Text style={styles.connectorType}>{connectorType}</Text>
                <Text style={styles.price}>{price}</Text>
                <Text style={styles.powerLevel}>{powerLevel}</Text>
              </View>
            </View>

            {/* Total Cost */}
            <View style={styles.costContainer}>
              <Text style={styles.totalCostLabel}>Total Charging Cost</Text>
              <Text style={styles.totalCostAmount}>{totalCost}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              {/* <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
                
                <Icon name="cancel" size={20} color={pallette.primary} />
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navigateBtn}>
                <Icon name="navigation" size={20} color="#fff" />
                <Text style={styles.navigateText}>Navigate</Text>
              </TouchableOpacity> */}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  successTitle: {
    fontSize: 20,
    fontFamily: bold,
    color: "#34A853",
  },
  scrollContent: { padding: 20 },
  bookingId: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: regular,
  },
  dateTimeRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dateBox: {
    backgroundColor: pallette.lightgrey,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginRight: 12,
  },
  date: { fontSize: 20, fontFamily: bold, color: pallette.primary },
  day: { fontSize: 14, fontFamily: regular, color: "#000" },
  timeBox: { flex: 1 },
  time: { fontSize: 16, fontFamily: bold, color: "#000" },
  duration: { fontSize: 14, fontFamily: regular, color: "#666" },
  stationName: { fontSize: 16, fontFamily: bold, color: "#000", marginTop: 8 },
  address: { fontSize: 14, fontFamily: regular, color: "#666", marginVertical: 8 },
  chargerTable: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  connectorType: { flex: 1, fontFamily: regular, color: "#000" },
  price: { flex: 1, fontFamily: regular, textAlign: "center" },
  powerLevel: { flex: 1, fontFamily: bold, textAlign: "right" },
  costContainer: { alignItems: "center", marginBottom: 16 },
  totalCostLabel: { fontSize: 16, fontFamily: regular, color: "#000" },
  totalCostAmount: { fontSize: 20, fontFamily: bold, color: pallette.primary },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pallette.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  linkText: {
    marginLeft: 4,
    fontSize: 14,
    color: pallette.primary,
    fontFamily: regular,
  },
  navigateText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#fff",
    fontFamily: bold,
  },
});

export default BookingSuccessPopup;
