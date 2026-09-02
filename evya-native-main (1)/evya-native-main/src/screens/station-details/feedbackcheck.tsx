import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { pallette } from "../../utils/pallette";
import { regular, medium, semibold, bold } from "../../utils/fonts";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Feedback options configuration
 */
const FEEDBACK_OPTIONS = {
  WORKING: "working",
  NOT_WORKING: "notworking"
} as const;

/**
 * Modal display timing constants
 */
const MODAL_TIMING = {
  SUCCESS_DISPLAY_DURATION: 2000,
  AUTO_CLOSE_DELAY: 100
} as const;

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * Props for Feedback Option Button Component
 */
interface FeedbackOptionProps {
  label: string;
  value: string;
  isSelected: boolean;
  onPress: (value: string) => void;
}

/**
 * Props for Submit Button Component
 */
interface SubmitButtonProps {
  isDisabled: boolean;
  onPress: () => void;
}

// =============================================================================
// COMPONENT: FEEDBACK OPTION BUTTON
// =============================================================================

/**
 * Reusable component for feedback selection options
 */
const FeedbackOption: React.FC<FeedbackOptionProps> = ({ 
  label, 
  value, 
  isSelected, 
  onPress 
}) => (
  <TouchableOpacity
    style={[
      styles.option,
      isSelected && styles.activeOption
    ]}
    onPress={() => onPress(value)}
    activeOpacity={0.7}
  >
    <Text style={[
      styles.optionText,
      isSelected && styles.activeOptionText
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// =============================================================================
// COMPONENT: SUBMIT BUTTON
// =============================================================================

/**
 * Reusable component for submit action
 */
const SubmitButton: React.FC<SubmitButtonProps> = ({ isDisabled, onPress }) => (
  <TouchableOpacity
    style={[
      styles.submitButton,
      isDisabled && styles.disabledButton
    ]}
    onPress={onPress}
    disabled={isDisabled}
    activeOpacity={0.8}
  >
    <Text style={styles.submitButtonText}>Submit</Text>
  </TouchableOpacity>
);

// =============================================================================
// COMPONENT: SUCCESS MESSAGE
// =============================================================================

/**
 * Displays success confirmation after feedback submission
 */
const SuccessMessage: React.FC = () => (
  <View style={styles.successContainer}>
    <Text style={styles.successTitle}>✅ Thank you!</Text>
    <Text style={styles.successMessage}>
      Your feedback helps the next customer.
    </Text>
  </View>
);

// =============================================================================
// MAIN COMPONENT: FEEDBACK CHECK-IN SCREEN
// =============================================================================

/**
 * Modal screen for collecting charger functionality feedback from users
 */
const FeedBackCheckIn: React.FC = () => {
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  /**
   * Handles feedback option selection
   */
  const handleOptionSelect = (option: string): void => {
    setSelectedOption(option);
  };

  /**
   * Processes feedback submission and shows success state
   */
  const handleSubmit = (): void => {
    if (!selectedOption) return;

    setIsSubmitted(true);
    
    setTimeout(() => {
      resetFormAndClose();
    }, MODAL_TIMING.SUCCESS_DISPLAY_DURATION);
  };

  /**
   * Resets form state and closes modal
   */
  const resetFormAndClose = (): void => {
    setIsSubmitted(false);
    setIsModalVisible(false);
    setSelectedOption(null);
    setDescription("");
    
    setTimeout(() => {
      navigation.goBack();
    }, MODAL_TIMING.AUTO_CLOSE_DELAY);
  };

  /**
   * Determines if submit button should be disabled
   */
  const isSubmitDisabled = !selectedOption;

  return (
    <View style={styles.container}>
      <Modal 
        transparent 
        visible={isModalVisible} 
        animationType="fade"
        onRequestClose={resetFormAndClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {!isSubmitted ? (
              <>
                {/* Feedback Question Section */}
                <Text style={styles.title}>
                  Is this charger working properly?
                </Text>
                <Text style={styles.subtitle}>
                  Your feedback helps the next customer.
                </Text>

                {/* Feedback Options */}
                <View style={styles.optionsContainer}>
                  <FeedbackOption
                    label="Working"
                    value={FEEDBACK_OPTIONS.WORKING}
                    isSelected={selectedOption === FEEDBACK_OPTIONS.WORKING}
                    onPress={handleOptionSelect}
                  />
                  <FeedbackOption
                    label="Not Working"
                    value={FEEDBACK_OPTIONS.NOT_WORKING}
                    isSelected={selectedOption === FEEDBACK_OPTIONS.NOT_WORKING}
                    onPress={handleOptionSelect}
                  />
                </View>

                {/* Optional Description Input */}
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Add a description (optional)"
                  placeholderTextColor={pallette.grey}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={500}
                />

                {/* Submit Button */}
                <SubmitButton
                  isDisabled={isSubmitDisabled}
                  onPress={handleSubmit}
                />
              </>
            ) : (
              <SuccessMessage />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: pallette.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalCard: {
    width: 350,
    backgroundColor: pallette.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: pallette.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontFamily: semibold,
    color: pallette.black,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: regular,
    color: pallette.black,
    marginBottom: 20,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "space-between",
    width: "100%",
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    alignItems: "center",
    backgroundColor: pallette.white,
  },
  activeOption: {
    backgroundColor: pallette.primary,
    borderColor: pallette.primary,
  },
  optionText: {
    fontSize: 14,
    fontFamily: medium,
    color: pallette.black,
  },
  activeOptionText: {
    color: pallette.white,
  },
  descriptionInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 14,
    fontFamily: regular,
    color: pallette.black,
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: pallette.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: pallette.mediumgrey,
  },
  submitButtonText: {
    color: pallette.white,
    fontSize: 16,
    fontFamily: bold,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: bold,
    color: pallette.primary,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    fontFamily: regular,
    color: pallette.grey,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default FeedBackCheckIn;