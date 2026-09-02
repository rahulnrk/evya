import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';

import Header from '../../components/header-with-skip';
import { useNavigation } from '@react-navigation/native';

import { pallette, regular, semibold } from '../../utils/pallette';
import { h, w } from '../../constants/dimensions';
import { adjust } from '../../helpers/common-functions';
import { bold } from '../../utils/fonts';
import CachedRemoteImage from '../../components/cached-remote-image';

interface VehicleScreenProps {
  route: {
    params: {
      vehicle: {
        name: string;
        image?: string;
        registrationNo: string;
        vin?: string;
        make?: string;
        model?: string;
        variant?: string;
        chargerType?: string;
        chargingOptions?: string;
        batteryCapacity?: string;
        range?: string;
        power?: string;
      };
    };
  };
}

const VehicleScreen: React.FC<VehicleScreenProps> = ({ route }) => {
  const { vehicle } = route.params;
  console.log(vehicle)
  const navigation = useNavigation();

  const DetailRow = ({ label, value, isLast }: any) => (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '-'}</Text>
    </View>
  );

 return (
    <View style={styles.container}>
      <Header
        onback={() => navigation.goBack()}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title="Vehicle Details"
        titleStyle={styles.headerTitle}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 🔥 Image Section */}
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            <CachedRemoteImage
              uri={vehicle?.image}
              fallback={require('../../assets/images/home/vehicle.png')}
              style={styles.vehicleImage}
              cdnWidth={720}
              resizeMode="cover"
            />
          </View>

          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {vehicle?.description || '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* 🔥 Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.vehicleName}>
            {vehicle?.make} {vehicle?.model}
          </Text>

          {/* <View style={styles.regContainer}>
            <Text style={styles.regLabel}>Registration</Text>
            <Text style={styles.regValue}>
              {vehicle?.registrationNo || '--'}
            </Text>
          </View> */}
        </View>

        {/* 🔥 Specifications */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Specifications</Text>
            <View style={styles.cardHeaderLine} />
          </View>

          <DetailRow label="VIN Number" value={vehicle?.vin || "--"} />

           <DetailRow label="Registration" value={vehicle?.registrationNo || '--'}/>

          <DetailRow
            label="Charger Type"
            value={vehicle?.variant?.chargerType || vehicle?.connectorType || "--"}
          />

         <DetailRow
  label="Charging Options"
  value={
    (vehicle?.variant?.chargingOptions || "--").length > 25
      ? (vehicle?.variant?.chargingOptions || "--").substring(0, 15) + "..."
      : (vehicle?.variant?.chargingOptions || "--")
  }
/>

          <DetailRow
            label="Battery Capacity"
            value={
              vehicle?.variant?.batterycapacity
                ? `${vehicle.variant.batterycapacity} kWh`
                : "--"
            }
          />

          <DetailRow
            label="Power Output"
            value={vehicle?.variant?.power || "--"}
          />

          <DetailRow
            label="Range (Full)"
            value={
              vehicle?.variant?.rangeKm
                ? `${vehicle.variant.rangeKm} km`
                : "--"
            }
            isLast
          />
        </View>

        {/* 🔥 Other Details */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Other Details</Text>
            <View style={styles.cardHeaderLine} />
          </View>

          <DetailRow label="Make" value={vehicle?.make || "--"} />
          <DetailRow label="Model" value={vehicle?.model || "--"} />
          <DetailRow
            label="Variant"
            value={vehicle?.variant?.variantName || "--"}
          />
        </View>

        {/* 🔥 Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Verified Vehicle</Text>
          <View style={styles.footerDot} />
        </View>
      </ScrollView>
    </View>
  );
};

export default VehicleScreen;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop:20,
  },
  headerTitle: {
    fontSize: adjust(18),
    fontFamily: semibold,
    color: '#000000',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    marginTop: 10,
    marginBottom: 0,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
    marginHorizontal: 20,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  vehicleImage: {
    width: width * 0.9,
    height: h * 0.28,
    resizeMode: 'contain',
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: -15,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  badgeText: {
    fontSize: adjust(12),
    fontFamily: regular,
    color: '#666666',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  vehicleName: {
    fontSize: adjust(20),
    textAlign:'center',
    fontFamily: bold,
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  regContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop:10,
  },
  regLabel: {
    fontSize: adjust(14),
    fontFamily: regular,
    color: '#999999',
    marginRight: 12,
  },
  regValue: {
    fontSize: adjust(16),
    fontFamily: semibold,
    color: '#000000',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    // marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#000000',
  },
  statLabel: {
    fontSize: adjust(12),
    fontFamily: regular,
    color: '#999999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: adjust(18),
    fontFamily: semibold,
    color: '#000000',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: adjust(18),
    fontFamily: semibold,
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  cardHeaderLine: {
    width: 40,
    height: 2,
    backgroundColor: '#000000',
    opacity: 0.1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  rowLabel: {
    fontSize: adjust(14),
    fontFamily: regular,
    color: '#666666',
  },
  rowValue: {
    fontSize: adjust(14),
    fontFamily: semibold,
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: adjust(12),
    fontFamily: regular,
    color: '#999999',
    letterSpacing: 0.5,
  },
});