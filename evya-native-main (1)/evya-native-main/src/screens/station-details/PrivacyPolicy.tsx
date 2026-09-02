import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { pallette } from "../../utils/pallette";
import { regular, medium, semibold } from "../../utils/fonts";
import { adjust } from "../../helpers/common-functions";
import Header from "../../components/header-with-skip";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Company contact information constants
 */
const COMPANY_CONTACT = {
  email: "evya@evya.com",
  phone: "+919160721823",
  formattedPhone: "+91 91607 21823"
};

/**
 * Privacy policy content sections
 */
const PRIVACY_SECTIONS = [
  {
    title: "1. Information We Collect",
    content: "We collect information that you provide directly to us when you use our EV charging services, including:",
    bullets: [
      "Personal details (name, email, phone number)",
      "Vehicle information and charging preferences",
      "Payment information for transactions",
      "Location data to find nearby charging stations"
    ]
  },
  {
    title: "2. How We Use Your Information",
    content: "We use the collected information to:",
    bullets: [
      "Provide and maintain our EV charging services",
      "Process payments and manage your account",
      "Send important updates and notifications",
      "Improve our services and user experience",
      "Ensure the security of our platform"
    ]
  },
  {
    title: "3. Data Sharing and Disclosure",
    content: "We do not sell your personal information. We may share your data with:",
    bullets: [
      "Service providers who assist in our operations",
      "Charging station operators for service provision",
      "Legal authorities when required by law"
    ]
  },
  {
    title: "4. Data Security",
    content: "We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.",
    bullets: []
  },
  {
    title: "5. Your Rights",
    content: "You have the right to:",
    bullets: [
      "Access and update your personal information",
      "Request deletion of your data",
      "Opt-out of marketing communications",
      "Withdraw consent for data processing"
    ]
  }
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Opens email client with pre-filled recipient
 */
const handleEmailPress = (): void => {
  const emailUrl = `mailto:${COMPANY_CONTACT.email}`;
  
  Linking.canOpenURL(emailUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert("Error", "Email app is not available on this device");
      }
    })
    .catch(() => {
      Alert.alert("Error", "Failed to open email app");
    });
};

/**
 * Initiates phone call to company contact number
 */
const handlePhonePress = (): void => {
  const phoneUrl = `tel:${COMPANY_CONTACT.phone}`;
  
  Linking.canOpenURL(phoneUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Error", "Phone calls are not supported on this device");
      }
    })
    .catch(() => {
      Alert.alert("Error", "Failed to initiate phone call");
    });
};

// =============================================================================
// COMPONENT: CONTACT INFO ITEM
// =============================================================================

/**
 * Reusable component for clickable contact information
 */
interface ContactInfoItemProps {
  label: string;
  value: string;
  onPress: () => void;
}

const ContactInfoItem: React.FC<ContactInfoItemProps> = ({ label, value, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.contactItem}>
    <Text style={styles.contactLabel}>{label}: </Text>
    <Text style={styles.contactValue}>{value}</Text>
  </TouchableOpacity>
);

// =============================================================================
// COMPONENT: PRIVACY POLICY SECTION
// =============================================================================

/**
 * Reusable component for privacy policy sections
 */
interface PrivacySectionProps {
  title: string;
  content: string;
  bullets: string[];
}

const PrivacySection: React.FC<PrivacySectionProps> = ({ title, content, bullets }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.paragraph}>{content}</Text>
    {bullets.map((bullet, index) => (
      <Text key={`bullet-${index}`} style={styles.bulletPoint}>
        • {bullet}
      </Text>
    ))}
  </View>
);

// =============================================================================
// MAIN COMPONENT: PRIVACY POLICY SCREEN
// =============================================================================

/**
 * Privacy Policy Screen - Displays company privacy policy with contact options
 */
const PrivacyPolicy: React.FC = () => {
  const navigation = useNavigation();

  /**
   * Handles navigation back to previous screen
   */
  const handleBackPress = (): void => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Header
        onback={handleBackPress}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'Privacy Policy'}
      />

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Company Logo and Information Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.companyName}>Evya</Text>
          <Text style={styles.tagline}>Powering Your Electric Journey</Text>
        </View>
        
        {/* Privacy Policy Sections */}
        {PRIVACY_SECTIONS.map((section, index) => (
          <PrivacySection
            key={`section-${index}`}
            title={section.title}
            content={section.content}
            bullets={section.bullets}
          />
        ))}

        {/* Contact Information Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>6. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          
          <ContactInfoItem
            label="Email"
            value={COMPANY_CONTACT.email}
            onPress={handleEmailPress}
          />
          
          <ContactInfoItem
            label="Phone"
            value={COMPANY_CONTACT.formattedPhone}
            onPress={handlePhonePress}
          />
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop: 24,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: pallette.mediumgrey,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  companyName: {
    fontSize: adjust(24),
    color: pallette.primary,
    fontFamily: semibold,
    marginBottom: 5,
  },
  tagline: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: regular,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: adjust(16),
    color: pallette.black,
    fontFamily: semibold,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: regular,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 6,
  },
  contactSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 6,
  },
  contactLabel: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: medium,
  },
  contactValue: {
    fontSize: adjust(14),
    color: pallette.primary,
    fontFamily: medium,
    textDecorationLine: "underline",
  },
  bottomSpacer: {
    height: 30,
  },
});

export default PrivacyPolicy;
