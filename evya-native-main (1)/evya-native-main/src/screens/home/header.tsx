import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { h, w } from '../../constants/dimensions';
import { pallette } from '../../utils/pallette';
import { adjust } from '../../helpers/common-functions';
import { medium, regular } from '../../utils/fonts';
import { useLocation } from '../../contexts/LocationContext';
import strings from '../../utils/strings';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HeaderProps {
  franchises: () => void;
  profile: () => void;
}

const Header = ({ franchises, profile }: HeaderProps) => {
  const navigation = useNavigation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { displayLocation, fullLocation, loading, error, refreshLocation } = useLocation();

  /**
   * Toggles location expansion with smooth animation
   */
  const toggleLocationExpansion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (fullLocation) {
      setIsExpanded(!isExpanded);
    }
  };

  /**
   * Handles location container press
   * Refreshes location if error/loading, otherwise toggles expansion
   */
  const handleLocationPress = () => {
    if (error || loading) {
      refreshLocation();
    } else {
      toggleLocationExpansion();
    }
  };

  /**
   * Handles navigation to help screen
   */
  const handleHelpPress = () => {
    navigation.navigate(strings.help);
  };

  return (
    <View style={styles.stickyHeader}>
      <View style={styles.container}>
        {/* Location Section */}
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={handleLocationPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="location-sharp"
            size={20}
            color={error ? pallette.red : pallette.black}
          />
          <View style={styles.locationTextContainer}>
            <Text
              style={[
                styles.locationText,
                error && styles.errorText,
                loading && styles.loadingText,
              ]}
              numberOfLines={2}
            >
              {loading ? 'Fetching location...' : error || fullLocation || displayLocation}
            </Text>

            {/* Expanded full address */}
            {/* {isExpanded && fullLocation && (
              <Text style={styles.fullLocationText}>
                {fullLocation}
              </Text>
            )} */}
          </View>

          {/* Location status icons */}
          {/* {!loading && !error && fullLocation && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={pallette.grey}
              style={styles.expandIcon}
            />
          )} */}

          {(error || loading) && (
            <Ionicons
              name="refresh"
              size={16}
              color={pallette.primary}
              style={styles.refreshIcon}
            />
          )}
        </TouchableOpacity>

        {/* Franchise Button with Gradient */}
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.franchiseLinear}
          colors={[pallette.l1, pallette.l2, pallette.l3, pallette.l4, pallette.l5]}
        >
          <TouchableOpacity 
            onPress={franchises} 
            style={styles.franchiseButton}
            activeOpacity={0.8}
          >
            <Image
              source={require('../../assets/images/icons/franchise.png')}
              style={styles.franchiseImage}
            />
            <Text style={styles.franchiseText}>Franchises</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Profile and Help Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            onPress={profile}
            style={styles.iconButton}
          >
            <Ionicons name="person-outline" size={28} color={pallette.black} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleHelpPress}
            style={styles.iconButton}
          >
            <Ionicons name="headset-outline" size={28} color={pallette.black} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: pallette.white,
  },
  container: {
    paddingTop: h * 0.05,
    paddingHorizontal: w * 0.04,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: h * 0.08,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: w * 0.02,
  },
  locationTextContainer: {
    flexShrink: 1,
    marginLeft: w * 0.02,
  },
  locationText: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: medium,
  },
  fullLocationText: {
    fontSize: adjust(11),
    color: pallette.grey,
    marginTop: h * 0.005,
    fontFamily: regular,
  },
  errorText: {
    color: pallette.red,
  },
  loadingText: {
    color: pallette.grey,
  },
  expandIcon: {
    marginLeft: w * 0.01,
    alignSelf: 'center',
  },
  refreshIcon: {
    marginLeft: w * 0.01,
    alignSelf: 'center',
  },
  franchiseLinear: {
    maxWidth: w * 0.35,
    borderRadius: w * 0.02,
    marginHorizontal: w * 0.02,
  },
  franchiseButton: {
    paddingHorizontal: w * 0.04,
    paddingVertical: h * 0.01,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: w * 0.02,
  },
  franchiseText: {
    fontSize: adjust(11),
    color: pallette.white,
    fontFamily: medium,
  },
  franchiseImage: {
    height: h * 0.02,
    width: h * 0.02,
    resizeMode: 'contain',
  },
  buttonsContainer: {
    width: w * 0.25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: w * 0.03,
  },
  iconButton: {
    padding: w * 0.01,
  },
});