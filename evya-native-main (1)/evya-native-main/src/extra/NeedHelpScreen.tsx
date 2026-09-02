import React, { useState, ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Platform,
} from "react-native";
import { h, w } from "../constants/dimensions";
import { pallette } from "../utils/pallette";
import { adjust } from "../helpers/common-functions";
import { bold, regular, semibold } from "../utils/fonts";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from 'react-native-toast-message';
import AlertMessage from "../extra/alertmessage";
import RootScroll from "../components/scroll-view";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { issue: string; category: string; description: string; email?: string }) => void;
}

const NeedHelpPopup: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [email, setEmail] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [alertComponent, setAlertComponent] = useState<ReactNode>(null);

  const categories = [
    { label: "General Inquiry", value: "General" },
    { label: "Hardware Issue", value: "Hardware" },
    { label: "Software Issue", value: "Software" },
    { label: "Billing Problem", value: "Billing" },
    { label: "Charging Station", value: "Charging" },
    { label: "Payment Issue", value: "Payment" },
    { label: "Account Problem", value: "Account" },
  ];

  const handleSubmit = () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Issue Title Required',
        text2: 'Please enter a title for your issue',
      });
      return;
    }

    if (!description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Description Required',
        text2: 'Please describe your issue in detail',
      });
      return;
    }

    if (email && !isValidEmail(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    // Show confirmation alert
    // setAlertComponent(
    //   <AlertMessage
    //     message="Submit Support Ticket?"
    //     showConfirm={true}
    //     onClose={(confirmed: boolean) => {
    //       setAlertComponent(null);
    //       if (confirmed) {
            onSubmit({ 
              issue: title.trim(), 
              category, 
              comment: description.trim(), 
              email: email.trim() || undefined 
            });
            resetForm();
            Toast.show({
              type: 'success',
              text1: 'Ticket Submitted',
              text2: 'We will get back to you soon',
            });
          }
  //       }}
  //     />
  //   );
  // };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("General");
    setEmail("");
    setShowCategoryDropdown(false);
  };

  const handleClose = () => {
    if (title.trim() || description.trim()) {
      setAlertComponent(
        <AlertMessage
          message="Discard Changes?"
          showConfirm={true}
          onClose={(confirmed: boolean) => {
            setAlertComponent(null);
            if (confirmed) {
              resetForm();
              onClose();
            }
          }}
        />
      );
    } else {
      onClose();
    }
  };

  const handleCall = () => {
    Linking.openURL("tel:+919876543210").catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Cannot Make Call',
        text2: 'Phone calling is not available',
      });
    });
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@evya.com").catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Cannot Open Email',
        text2: 'Email app is not available',
      });
    });
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(cat => cat.value === value)?.label || value;
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Icon name="close" size={24} color={pallette.grey} />
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Icon name="headset-outline" size={28} color={pallette.white} />
          </View>
          <Text style={styles.title}>Need Help?</Text>
          <Text style={styles.subtitle}>We're here to assist you</Text>
        </View>

        <RootScroll style={styles.scrollContainer}>
          <View style={styles.content}>
           
            {/* Form Section */}
            <View style={styles.formBox}>
              {/* Issue Title */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Issue Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Brief description of your issue"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={pallette.grey}
                />
              </View>

              {/* Category Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <Text style={styles.dropdownText}>{getCategoryLabel(category)}</Text>
                  <Icon 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={pallette.grey} 
                  />
                </TouchableOpacity>

                {showCategoryDropdown && (
                  <View style={styles.dropdownList}>
                    {categories.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[
                          styles.dropdownItem,
                          category === item.value && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setCategory(item.value);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          category === item.value && styles.dropdownItemTextSelected
                        ]}>
                          {item.label}
                        </Text>
                        {category === item.value && (
                          <Icon name="checkmark" size={16} color={pallette.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Please describe your issue in detail..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={pallette.grey}
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com (optional)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={pallette.grey}
                />
              </View>
              {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              (!title.trim() || !description.trim()) && styles.buttonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!title.trim() || !description.trim()}
          >
            <Text style={styles.buttonText}>Submit Ticket</Text>
          </TouchableOpacity>
        </View>
            </View>
             {/* Contact Options */}
            <View style={styles.contactOptions}>
              <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                <View style={styles.contactIcon}>
                  <Icon name="call-outline" size={20} color={pallette.primary} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Call Support</Text>
                  <Text style={styles.contactText}>+91-9876543210</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                <View style={styles.contactIcon}>
                  <Icon name="mail-outline" size={20} color={pallette.primary} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>Email Support</Text>
                  <Text style={styles.contactText}>support@evya.com</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>
          
        </RootScroll>

        
      </View>

      {/* Alert Component */}
      {alertComponent}

      <Toast position="top" visibilityTime={4000} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: "#000000AA" 
  },
  modalContainer: {
    position: "absolute",
    top: h * 0.05,
    left: w * 0.05,
    width: w * 0.9,
    backgroundColor: pallette.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
    elevation: 10,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxHeight: h * 0.85,
    overflow: 'hidden',
  },
  scrollContainer: {
    width: '100%',
    flex: 1,
  },
  content: {
    paddingBottom: 10,
  },
  headerSection: {
    alignItems: "center",
    // marginBottom: 16,
    width: '100%',
  },
  closeButton: { 
    position: "absolute", 
    top: 12, 
    right: 12, 
    zIndex: 10,
    padding: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: pallette.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { 
    fontSize: adjust(16), 
    fontFamily: bold, 
    color: pallette.primary, 
    textAlign: 'center',
  },
  subtitle: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
    textAlign: 'center',
  },
  contactOptions: {
    width: "100%",
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pallette.lightprimary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: pallette.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
    marginBottom: 2,
  },
  contactText: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: semibold,
  },
  formBox: { 
    backgroundColor: pallette.lightgrey, 
    padding: 16, 
    borderRadius: 12, 
    width: "100%", 
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: semibold,
    marginBottom: 6,
  },
  input: {
    backgroundColor: pallette.white,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: 8,
    padding: 12,
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: regular,
  },
  textArea: {
    height: h * 0.12,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: pallette.white,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: regular,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: pallette.white,
    borderWidth: 1,
    borderColor: pallette.mediumgrey,
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    maxHeight: 700,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: pallette.lightgrey,
  },
  dropdownItemSelected: {
    backgroundColor: pallette.lightprimary,
  },
  dropdownItemText: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: regular,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: pallette.primary,
    fontFamily: semibold,
  },
  footer: {
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: pallette.lightgrey,
  },
  button: { 
    backgroundColor: pallette.primary, 
    paddingVertical: 14,
    borderRadius: 8, 
    alignItems: "center", 
    width: "100%",
    marginBottom:20
  },
  buttonDisabled: {
    backgroundColor: pallette.mediumgrey,
    opacity: 0.6,
  },
  buttonText: { 
    color: pallette.white, 
    fontSize: adjust(16), 
    fontFamily: bold,
  },
});

export default NeedHelpPopup;