import React from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { pallette } from '../../utils/pallette';
import { h, w } from '../../constants/dimensions';
import { adjust } from '../../helpers/common-functions';
import { bold, regular, semibold } from '../../utils/fonts';
import strings from '../../utils/strings';

/**
 * VehicleInfo interface defining the structure of vehicle information
 */
interface VehicleInfo {
  connectorType?: string;
  model?: string;
  registrationNo?: string;
  battery?: string;
  tracking?: string;
  description?: string;
  variant?: {
    registrationNo?: string;
    chargerType?: string;
    batterycapacity?: string;
    rangeKm?: string;
    power?: string;
  };
  [key: string]: any;
}

/**
 * CarInfo Component Props interface
 */
interface CarInfoProps {
  info: VehicleInfo;
}

/**
 * CarInfo Component - Displays individual vehicle information card
 * Shows vehicle details, status indicators, and navigation to vehicle details page
 */
const CarInfo = ({ info }: CarInfoProps) => {
  const navigation = useNavigation();

  /**
   * Handles navigation to vehicle details page
   */
  const navigateToVehicleDetails = (): void => {
    navigation.navigate(strings.Vehiclepage, { vehicle: info });
  };

  return (
    <TouchableOpacity
      style={styles.carContainer}
      activeOpacity={0.7}
      onPress={navigateToVehicleDetails}
    >
      {/* Left Section: Vehicle Details */}
      <View style={styles.detailsContainer}>
        <Text numberOfLines={2} style={styles.title}>
          {info?.description || 'Vehicle'} ({info?.model })
        </Text>

        <Text style={styles.RegnoValue}>
          {info?.registrationNo || 'No Registration'}
        </Text>

        <View style={styles.chargerContainer}>

  <View style={styles.chargerBadge}>
    <Text style={styles.chargerValue}>
      {info?.variant?.chargerType || 'No Charger Info'}
    </Text>
  </View>
</View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Capacity</Text>
            <Text style={styles.statValue}>
              {info?.variant?.batterycapacity +' units'|| '--'}
            </Text>
            
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Range</Text>
            <Text style={styles.statValue}>
              {info?.variant?.rangeKm +' kms' || '--'}
            </Text>
            
          </View>

          <View style={styles.statBox}>
             <Text style={styles.statLabel}>Power</Text>
            <Text style={styles.statValue}>
              {info?.variant?.power+'' || '--'}
            </Text>
           
          </View>
        </View>
      </View>

      {/* Right Section: Vehicle Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/home/vehicle.png')}
          style={styles.carImage}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  carContainer: {
    backgroundColor: pallette.lightgrey,
    padding: h * 0.01,
    marginBottom: h * 0.01,
    borderRadius: w * 0.02,
    alignSelf: 'center',
    width: w * 0.95,
    flexDirection: 'row',
    marginHorizontal: w * 0.025,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: w * 0.02,
  },
  imageContainer: {
    width: w * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: adjust(13),
    fontFamily: semibold,
    color: '#111',
    marginBottom: 4,
  },
  subText: {
    fontSize: adjust(10),
    color: '#666',
    fontFamily: regular,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: adjust(11),
    fontFamily: semibold,
    color: '#000',
  },
  statLabel: {
    fontSize: adjust(8),
    color: '#888',
    fontFamily: regular,
  },
  carImage: {
    width: '100%',
    height: h * 0.13,
    resizeMode: 'contain',
  },
  chargerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
  flexWrap: 'wrap',
},
chargerLabel: {
  fontSize: adjust(10),
  color: '#666',
  fontFamily: regular,
  marginRight: 6,
},
chargerBadge: {
  backgroundColor: '#E8F0FE',
  paddingHorizontal: w * 0.02,
  paddingVertical: h * 0.003,
  borderRadius: w * 0.01,
  alignSelf: 'flex-start',
},
chargerValue: {
  fontSize: adjust(10),
  color: '#007AFF',
  fontFamily: semibold,
},
RegnoValue: {
  fontSize: adjust(12),
  
  fontFamily: semibold,
},
});

export default CarInfo;