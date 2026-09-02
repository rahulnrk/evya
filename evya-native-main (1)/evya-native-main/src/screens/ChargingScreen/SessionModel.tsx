import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from "react-native";
import { h, w } from "../../constants/dimensions";
import { pallette } from "../../utils/pallette";
import { regular, medium, semibold, bold } from "../../utils/fonts";

// ===================================================================
// INTERFACES
// ===================================================================
interface FeedbackOptionProps {
  label: string;
  emoji: string;
  isSelected: boolean;
  onPress: () => void;
}

interface SessionModelProps {
  isVisible: boolean;
  onClose: () => void;
  selectedFeedback: string | null;
  onFeedbackSelect: (feedback: string) => void;
  sessionData: {
    bookingId: string;
    date: string;
    time: string;
    stationName: string;
    stationAddress: string;
    stationProvider: string;
    chargingCost: string;
    totalCost: string;
    units: string;
  };
  chargingTime?: string;
  getEndTime: () => string;
}

// ===================================================================
// CONSTANTS
// ===================================================================
const FEEDBACK_OPTIONS = [
  { label: "Excellent", emoji: "😊" },
  { label: "Good", emoji: "🙂" },
  { label: "Bad", emoji: "😐" },
  { label: "Very Bad", emoji: "😡" },
];

// ===================================================================
// SUB-COMPONENTS
// ===================================================================
const FeedbackButton: React.FC<FeedbackOptionProps> = ({ label, emoji, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.feedbackButton, isSelected && styles.feedbackButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.feedbackEmoji}>{emoji}</Text>
    <Text style={[styles.feedbackLabel, isSelected && styles.feedbackLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

// ===================================================================
// MAIN COMPONENT
// ===================================================================
const SessionModel: React.FC<SessionModelProps> = ({
  isVisible,
  onClose,
  selectedFeedback,
  onFeedbackSelect,
  sessionData,
  chargingTime,
  getEndTime,
}) => {
  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
         {/* <Image source={require("../../assets/images/icons/charge.png")}
            style={styles.modalIcon}
          /> */}
          <Text style={styles.modalTitle}>Thanks for choosing Evya!</Text>
          
          {/* Session Details Section */}
          <View style={styles.sessionDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID:</Text>
              <Text style={styles.detailValue}>{sessionData.bookingId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{sessionData.date} | {sessionData.time}</Text>
            </View>

            {/* Date and Time Box */}
            <View style={styles.dateContainer}>
              <View style={styles.monthDayContainer}>
                <Text style={styles.monthText}>
                  {new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </Text>
                <Text style={styles.dayText}>
                  {new Date().getDate()}
                </Text>
              </View>
              <View style={styles.dateInfoContainer}>
                <Text style={styles.dayNameText}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
                <Text style={styles.timeText}>
                  {sessionData.time} – {getEndTime()}
                </Text>
                <Text style={styles.durationText}>
                  {chargingTime || "0 Min"}
                </Text>
              </View>
            </View>

            {/* Location Details */}
            <View style={styles.locationContainer}>
              <Text style={styles.stationName}>{sessionData.stationName}</Text>
              <Text style={styles.stationAddress}  numberOfLines={1}>{sessionData.stationAddress}</Text>
              <Text style={styles.stationProvider}>{sessionData.stationProvider}</Text>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.costContainer}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Charging Cost</Text>
                <Text style={styles.costValue}>₹ {sessionData.chargingCost}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Tax</Text>
                <Text style={styles.costValue}>₹ 0.00</Text>
              </View>
              <View style={styles.totalCostRow}>
                <Text style={styles.totalCostLabel}>Total (Pass via Wallet)</Text>
                <Text style={styles.totalCostValue}>₹ {sessionData.totalCost}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.feedbackTitle}>How was your experience?</Text>

          {/* Feedback Options */}
          <View style={styles.feedbackRow}>
            {FEEDBACK_OPTIONS.map((item, index) => (
              <FeedbackButton
                key={index}
                label={item.label}
                emoji={item.emoji}
                isSelected={selectedFeedback === item.label}
                onPress={() => onFeedbackSelect(item.label)}
              />
            ))}
          </View>
          
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.bottomCloseButton} 
            onPress={onClose}
          >
            <Text style={styles.bottomCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SessionModel;

// ===================================================================
// STYLES
// ===================================================================
const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  modalContainer: { 
    width: "85%", 
    backgroundColor: pallette.white, 
    borderRadius: 20, 
    padding: 20, 
    alignItems: "center" 
  },
  closeButton: { 
    position: "absolute", 
    top: 10, 
    right: 10 
  },
  closeButtonText: { 
    fontSize: 18,
    color: pallette.black
  },
  modalIcon: { 
    height: 40, 
    width: 40, 
    marginBottom: 10 
  },
  modalTitle: { 
    fontSize: 18, 
    fontFamily: bold, 
    color: pallette.primary, 
    marginTop: 10, 
    marginBottom: 10 
  },
  sessionDetailsContainer: { 
    width: "100%", 
    backgroundColor: pallette.lightgrey, 
    padding: 16, 
    borderRadius: 12, 
    marginVertical: 10,
    borderWidth: 1,
    borderColor: pallette.mediumgrey
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    width: "100%"
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: regular,
    color: pallette.grey
  },
  detailValue: {
    fontSize: 14,
    fontFamily: medium,
    color: pallette.black
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pallette.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    marginVertical: 12
  },
  monthDayContainer: {
    alignItems: "center",
    marginRight: 15,
    paddingRight: 15,
    borderRightWidth: 1,
    borderRightColor: pallette.mediumgrey
  },
  monthText: {
    fontSize: 14,
    fontFamily: medium,
    color: pallette.grey,
    marginBottom: 2
  },
  dayText: {
    fontSize: 20,
    fontFamily: bold,
    color: pallette.black
  },
  dateInfoContainer: {
    flex: 1
  },
  dayNameText: {
    fontSize: 16,
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
    fontSize: 13,
    fontFamily: regular,
    color: pallette.grey
  },
  locationContainer: {
    marginBottom: 12
  },
  stationName: {
    fontSize: 15,
    fontFamily: semibold,
    color: pallette.black,
    marginBottom: 4
  },
  stationAddress: {
    fontSize: 14,
    fontFamily: regular,
    color: pallette.grey,
    marginBottom: 2
  },
  stationProvider: {
    fontSize: 13,
    fontFamily: regular,
    color: pallette.grey
  },
  costContainer: {
    borderTopWidth: 1,
    borderTopColor: pallette.mediumgrey,
    paddingTop: 12,
    marginTop: 8
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  costLabel: {
    fontSize: 14,
    fontFamily: regular,
    color: pallette.grey
  },
  costValue: {
    fontSize: 14,
    fontFamily: medium,
    color: pallette.black
  },
  totalCostRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: pallette.mediumgrey
  },
  totalCostLabel: {
    fontSize: 15,
    fontFamily: semibold,
    color: pallette.black
  },
  totalCostValue: {
    fontSize: 15,
    fontFamily: bold,
    color: pallette.black
  },
  feedbackTitle: { 
    fontSize: 14, 
    fontFamily: semibold,
    marginBottom: 10, 
    marginTop: 10, 
    color: pallette.black
  },
  feedbackRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "100%", 
    marginBottom: 15 
  },
  feedbackButton: { 
    flex: 1, 
    alignItems: "center", 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  feedbackButtonActive: { 
    backgroundColor: pallette.secondary 
  },
  feedbackEmoji: { 
    fontSize: 20 
  },
  feedbackLabel: { 
    fontSize: 12, 
    fontFamily: regular,
    color: pallette.grey, 
    marginTop: 5 
  },
  feedbackLabelActive: { 
    color: pallette.primary 
  },
  bottomCloseButton: { 
    backgroundColor: pallette.primary, 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 10, 
    marginTop: 10,
    width: "100%",
    alignItems: "center"
  },
  bottomCloseButtonText: { 
    color: pallette.white, 
    fontSize: 16, 
    fontFamily: bold 
  },
});