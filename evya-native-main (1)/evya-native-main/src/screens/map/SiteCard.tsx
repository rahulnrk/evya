import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { w, h } from "../../constants/dimensions";
import { adjust } from "../../helpers/common-functions";
import { bold, medium, regular, semibold } from "../../utils/fonts";
import { pallette } from "../../utils/pallette";
import strings from "../../utils/strings";

/**
 * SiteCard Component - Displays individual charging station information card
 * Supports navigation to station details and Google Maps integration
 * @param {Object} props - Component properties
 * @param {Object} props.site - Station data object containing name, address, availability, etc.
 * @param {Function} props.onNavigatePress - Callback function when navigate button is pressed
 * @param {boolean} props.showDistance - Controls visibility of navigate button
 * @param {string} props.distance - Distance text to display (default: "Navigate")
 * @param {Function} props.onClose - Callback function when close button is pressed
 */
const SiteCard = ({ 
  site, 
  onNavigatePress, 
  showDistance = true,
  distance = "Navigate",
  onClose 
}: { 
  site: any; 
  onNavigatePress?: (site: any) => void; 
  showDistance?: boolean; 
  distance?: string; 
  onClose?: () => void; 
}) => {
  const navigation = useNavigation();

  // Return null if no site data is provided
  if (!site) return null;

  /**
   * Opens Google Maps navigation to the charging station location
   * @param {Object} station - Station object containing coordinates
   */
  const handleNavigationToStation = (): void => {
    if (!site?.coordinates) return;

    const { latitude, longitude } = site.coordinates;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    
    Linking.openURL(mapsUrl);

    // Notify parent component about navigation action
    if (onNavigatePress) {
      onNavigatePress(site);
    }
  };

  /**
   * Navigates to station details screen
   */
  const navigateToStationDetails = (): void => {
    navigation.navigate(strings.hometab, {
      key: Date.now(),
      screen: strings.stationdetails,
      params: { station: site.originalData || site }
    });
  };

  const isStationAvailable = site.available > 0;

  return (
    <View style={styles.stationCard}>
      {/* Close Button (commented out but available for future use) */}
      {/* <TouchableOpacity 
        style={styles.closeButton}
        onPress={onClose}
      >
        <Icon name="close" size={20} color={pallette.grey} />
      </TouchableOpacity> */}
      
      <TouchableOpacity 
        onPress={navigateToStationDetails} 
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Card Header with Station Name and Availability Status */}
          <View style={styles.cardHeader}>
            <Text style={styles.stationName} numberOfLines={1}>
              {site.name}
            </Text>
            <View 
              style={[
                styles.statusIndicator, 
                { 
                  backgroundColor: isStationAvailable ? pallette.secondary : `${pallette.red}15` 
                }
              ]}
            >
              <Text 
                style={[
                  styles.statusText, 
                  { 
                    color: isStationAvailable ? pallette.primary : pallette.red 
                  }
                ]}
              >
                {site.available}/{site.totalPorts} {isStationAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>

          {/* Station Address */}
          <Text style={styles.stationAddress} numberOfLines={2}>
            {site.address}
          </Text>

          {/* Station Details Row */}
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>{site.current_type}</Text>
            <Text style={styles.detailText}>⚡ {site.power}</Text>
            <Text style={styles.detailText}>{site.price}/kWh</Text>
          </View>

          {/* Card Footer with Connectors and Navigation */}
          <View style={styles.footer}>
            <View style={styles.connectorContainer}>
              {site.connectors && site.connectors.slice(0, 3).map((connector: string, index: number) => (
                <View key={index} style={styles.connectorTag}>
                  <Text style={styles.connectorText}>{connector}</Text>
                </View>
              ))}
              {site.connectors && site.connectors.length > 3 && (
                <View style={styles.connectorTag}>
                  <Text style={styles.connectorText}>
                    +{site.connectors.length - 3}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Navigate Button */}
            {showDistance && (
              <TouchableOpacity 
                onPress={handleNavigationToStation}
                activeOpacity={0.7}
              >
                <View style={styles.navigateButton}>
                  <Image 
                    source={require('../../assets/images/icons/location.png')} 
                    style={styles.navigationIcon} 
                  />
                  <Text style={styles.navigateText}>{distance}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  stationCard: {
    width: w * 0.88,
    backgroundColor: pallette.white,
    borderRadius: w * 0.05,
    padding: 16,
    marginHorizontal: w * 0.03,
    shadowColor: pallette.black,
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: h * 0.02,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 4,
    backgroundColor: pallette.lightgrey,
    borderRadius: 12,
  },
  cardContent: {
    paddingTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationName: {
    fontSize: adjust(14),
    fontFamily: bold,
    color: pallette.black,
    flex: 1,
    marginRight: 8,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: adjust(12),
    fontFamily: semibold,
  },
  stationAddress: {
    fontSize: adjust(12),
    color: pallette.grey,
    marginBottom: 12,
    lineHeight: 18,
    fontFamily: regular,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailText: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: bold,
  },
  connectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 12,
  },
  connectorTag: {
    backgroundColor: pallette.lightgrey,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  connectorText: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigateButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: w * 0.03,
    paddingVertical: w * 0.015,
    borderRadius: w * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationIcon: {
    height: w * 0.05,
    width: w * 0.05,
    resizeMode: 'contain',
    tintColor: pallette.white,
  },
  navigateText: {
    color: pallette.white,
    fontFamily: bold,
    fontSize: adjust(13),
    marginLeft: 4,
  },
});

export default SiteCard;