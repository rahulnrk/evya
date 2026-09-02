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
  website: "https://evya.energy",
  formattedPhone: "+91 91607 21823",
  address: "Evya Headquarters, Tech Park, City, State - PIN"
};

/**
 * App version information
 */
const APP_INFO = {
  version: "1.0.0",
  copyright: "© 2024 Evya. All rights reserved."
};

/**
 * Feature cards configuration
 */
const FEATURES = [
  {
    title: "Fast Charging",
    description: "High-speed charging stations to get you back on the road quickly"
  },
  {
    title: "Smart Navigation",
    description: "Find available charging stations with real-time status updates"
  },
  {
    title: "Easy Payments",
    description: "Secure and convenient payment options for hassle-free charging"
  },
  {
    title: "Eco-Friendly",
    description: "Contributing to a cleaner environment with every charge"
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

/**
 * Opens company website in browser
 */
const handleWebsitePress = (): void => {
  Linking.canOpenURL(COMPANY_CONTACT.website)
    .then((supported) => {
      if (supported) {
        Linking.openURL(COMPANY_CONTACT.website);
      } else {
        Alert.alert("Error", "Browser is not available on this device");
      }
    })
    .catch(() => {
      Alert.alert("Error", "Failed to open website");
    });
};

// =============================================================================
// COMPONENT: FEATURE CARD
// =============================================================================

/**
 * Reusable component for displaying feature cards
 */
interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => (
  <View style={styles.featureCard}>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDescription}>{description}</Text>
  </View>
);

// =============================================================================
// COMPONENT: CONTACT BUTTON
// =============================================================================

/**
 * Reusable component for contact action buttons
 */
interface ContactButtonProps {
  text: string;
  onPress: () => void;
}

const ContactButton: React.FC<ContactButtonProps> = ({ text, onPress }) => (
  <TouchableOpacity 
    style={styles.contactButton} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.contactButtonText}>{text}</Text>
  </TouchableOpacity>
);

// =============================================================================
// COMPONENT: CONTACT INFO ITEM
// =============================================================================

/**
 * Reusable component for displaying contact information
 */
interface ContactInfoItemProps {
  label: string;
  value: string;
  isClickable?: boolean;
  onPress?: () => void;
}

const ContactInfoItem: React.FC<ContactInfoItemProps> = ({ 
  label, 
  value, 
  isClickable = false, 
  onPress 
}) => (
  <View style={styles.contactItem}>
    <Text style={styles.contactLabel}>{label}</Text>
    {isClickable ? (
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.contactValueClickable}>{value}</Text>
      </TouchableOpacity>
    ) : (
      <Text style={styles.contactValue}>{value}</Text>
    )}
  </View>
);

// =============================================================================
// MAIN COMPONENT: ABOUT EVYA SCREEN
// =============================================================================

/**
 * About Evya Screen - Displays company information, mission, features and contact details
 * Provides interactive contact options for email, phone and website
 */
const AboutEvya: React.FC = () => {
  const navigation = useNavigation();

  /**
   * Handles navigation back to previous screen
   */
  const handleBackPress = (): void => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header Component */}
      <Header
        onback={handleBackPress}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={'About Evya'}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Company Logo and Brand Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.companyName}>Evya</Text>
          <Text style={styles.tagline}>Powering Your Electric Journey</Text>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            At Evya, we're committed to accelerating the transition to sustainable 
            transportation by providing reliable, accessible, and smart electric 
            vehicle charging solutions.
          </Text>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Do</Text>
          <Text style={styles.paragraph}>
            Evya offers a comprehensive EV charging ecosystem that includes:
          </Text>
          <Text style={styles.bulletPoint}>• Network of smart charging stations</Text>
          <Text style={styles.bulletPoint}>• Mobile app for seamless charging experience</Text>
          <Text style={styles.bulletPoint}>• Real-time station availability and status</Text>
          <Text style={styles.bulletPoint}>• Secure payment processing</Text>
          <Text style={styles.bulletPoint}>• 24/7 customer support</Text>
        </View>

        {/* Vision Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Vision</Text>
          <Text style={styles.paragraph}>
            To create a world where electric vehicle charging is as convenient and 
            accessible as traditional refueling, making sustainable transportation 
            the preferred choice for everyone.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Evya?</Text>
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={`feature-${index}`}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get In Touch</Text>
          
          <ContactButton
            text="Contact Support"
            onPress={handleEmailPress}
          />

          <ContactButton
            text="Visit Our Website"
            onPress={handleWebsitePress}
          />

          <View style={styles.contactInfo}>
            <ContactInfoItem
              label="Email"
              value={COMPANY_CONTACT.email}
              isClickable={true}
              onPress={handleEmailPress}
            />
            
            <ContactInfoItem
              label="Phone"
              value={COMPANY_CONTACT.formattedPhone}
              isClickable={true}
              onPress={handlePhonePress}
            />
            
            <ContactInfoItem
              label="Address"
              value={COMPANY_CONTACT.address}
            />
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.version}>Version {APP_INFO.version}</Text>
          <Text style={styles.copyright}>{APP_INFO.copyright}</Text>
        </View>
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
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: pallette.mediumgrey,
    marginBottom: 20,
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
    marginBottom: 25,
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
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: regular,
    lineHeight: 20,
    marginLeft: 10,
    marginBottom: 5,
  },
  featureCard: {
    backgroundColor: pallette.secondary,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: pallette.primary,
  },
  featureTitle: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: semibold,
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
    lineHeight: 16,
  },
  contactButton: {
    backgroundColor: pallette.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  contactButtonText: {
    fontSize: adjust(14),
    color: pallette.white,
    fontFamily: medium,
  },
  contactInfo: {
    marginTop: 15,
  },
  contactItem: {
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: medium,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: regular,
  },
  contactValueClickable: {
    fontSize: adjust(14),
    color: pallette.primary,
    fontFamily: regular,
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: pallette.mediumgrey,
    marginTop: 10,
  },
  version: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
    marginBottom: 5,
  },
  copyright: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
  },
});

export default AboutEvya;