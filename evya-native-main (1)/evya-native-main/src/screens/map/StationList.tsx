import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  SafeAreaView,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { pallette } from '../../utils/pallette';
import { bold, medium, regular, semibold } from '../../utils/fonts';
import strings from '../../utils/strings';
import { adjust } from '../../helpers/common-functions';
import { useLocation } from '../../contexts/LocationContext';
import { useGetStationsQuery } from '../../redux/api/baseApi';

const { width, height } = Dimensions.get('window');
const w = width;
const h = height;

/**
 * StationsList — STATE-2: stations via RTK Query (cache / dedup / refetch)
 */
const StationsList = () => {
  const navigation = useNavigation();
  const { currentLocation } = useLocation();

  const queryArg = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : undefined;

  const {
    data: stations = [],
    isLoading: stationsLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetStationsQuery(queryArg, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: 60,
  });

  const stationsError = isError
    ? (error as any)?.error || 'Failed to load stations'
    : null;

  /**
   * Handles navigation to station details screen
   * @param {Object} station - Station object containing station data
   */
  const handleStationDetailsNavigation = (station: any): void => {
    navigation.navigate(strings.hometab, {
      screen: strings.stationdetails,
      params: { station: station.originalData || station }
    });
  };

  /**
   * Opens Google Maps navigation to the selected charging station
   * @param {Object} station - Station object containing coordinates
   */
  const handleNavigationToStation = (station: any): void => {
    if (!station?.coordinates) {
      Alert.alert("Location Unavailable", "Coordinates not available for this station.");
      return;
    }

    const { latitude, longitude } = station.coordinates;
    if (!latitude || !longitude) {
      Alert.alert("Invalid Location", "Coordinates not available for this station.");
      return;
    }

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(mapsUrl);
  };

  /**
   * PERF-4: memoized-friendly renderItem (stable callback)
   */
  const renderStationCard = useCallback(({ item }: { item: any }): JSX.Element => {
    const isStationAvailable = item.available > 0;

    return (
      <TouchableOpacity 
        style={styles.stationCard} 
        onPress={() => handleStationDetailsNavigation(item)}
        activeOpacity={0.8}
      >
        {/* Card Header with Station Name and Availability Status */}
        <View style={styles.cardHeader}>
          <Text style={styles.stationName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isStationAvailable ? pallette.lightprimary : pallette.lightred,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: isStationAvailable ? pallette.primary : pallette.red,
                },
              ]}
            >
              {item.available}/{item.totalPorts} {isStationAvailable ? "Available" : "UnAvailable"}
            </Text>
          </View>
        </View>

        {/* Station Address */}
        <Text style={styles.stationAddress} numberOfLines={2}>
          {item.address}
        </Text>

        {/* Station Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailText}>{item.current_type}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Power</Text>
            <Text style={styles.detailText}>⚡ {item.power}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailText}>₹{item.price}/kWh</Text>
          </View>
        </View>

        {/* Card Footer with Connectors and Navigation */}
        <View style={styles.cardFooter}>
          <View style={styles.connectorContainer}>
            {(item.connectors || []).slice(0, 3).map((connector: string, index: number) => (
              <View key={index} style={styles.connectorTag}>
                <Text style={styles.connectorText}>{connector}</Text>
              </View>
            ))}
            {item.connectors && item.connectors.length > 3 && (
              <View style={styles.connectorTag}>
                <Text style={styles.connectorText}>
                  +{item.connectors.length - 3}
                </Text>
              </View>
            )}
          </View>
          
          {/* Navigate Button */}
          <TouchableOpacity 
            onPress={() => handleNavigationToStation(item)}
            style={styles.navigateButton}
            activeOpacity={0.7}
          >
            <Image 
              source={require('../../assets/images/icons/location.png')} 
              style={styles.navigationIcon} 
            />
            <Text style={styles.navigateText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, []);

  // Display loading state while fetching stations
  if (stationsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={pallette.primary} />
        <Text style={styles.loadingText}>
          Loading stations...
        </Text>
      </View>
    );
  }

  // Display error state if stations failed to load
  if (stationsError && stations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{String(stationsError)}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Charging Stations</Text>
        <Text style={styles.stationCount}>{stations.length} stations</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="close" size={24} color={pallette.black} />
        </TouchableOpacity>
      </View>

      {/* Stations List */}
      <FlatList 
        data={stations}
        renderItem={renderStationCard}
        keyExtractor={(item, index) => item.id?.toString() || `station-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !stationsLoading}
            onRefresh={() => refetch()}
            colors={[pallette.primary]}
            tintColor={pallette.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No charging stations found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or check back later
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: pallette.white,
    marginTop: 25,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: w * 0.05,
    marginBottom: h * 0.01,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: pallette.lightgrey
  },
  title: {
    fontSize: adjust(13),
    fontFamily: bold,
    color: pallette.black,
    flex: 1,
  },
  stationCount: {
    fontSize: adjust(12),
    fontFamily: medium,
    color: pallette.grey,
    marginRight: 10,
  },
  closeButton: {
    padding: 4
  },
  listContent: {
    paddingHorizontal: w * 0.05,
    paddingVertical: h * 0.01
  },
  stationCard: {
    backgroundColor: pallette.white,
    borderRadius: w * 0.02,
    paddingHorizontal: w * 0.04,
    paddingVertical: h * 0.01,
    marginBottom: h * 0.01,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: h * 0.005,
  },
  stationName: {
    fontSize: adjust(15),
    fontFamily: bold,
    color: pallette.black,
    flex: 1,
    marginRight: w * 0.03,
  },
  statusIndicator: {
    paddingHorizontal: w * 0.03,
    paddingVertical: h * 0.005,
    borderRadius: w * 0.02,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: adjust(11),
    fontFamily: semibold,
  },
  stationAddress: {
    fontSize: adjust(11),
    color: pallette.grey,
    marginBottom: h * 0.01,
    lineHeight: adjust(16),
    fontFamily: regular,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: h * 0.005,
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailLabel: {
    fontSize: adjust(10),
    color: pallette.grey,
    fontFamily: medium,
    marginBottom: h * 0.003,
  },
  detailText: {
    fontSize: adjust(11),
    color: pallette.black,
    fontFamily: semibold,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: h * 0.005,
  },
  connectorContainer: {
    flexDirection: "row",
    flexWrap: 'wrap',
    flex: 1,
    marginRight: w * 0.03,
  },
  connectorTag: {
    backgroundColor: `${pallette.primary}10`,
    borderRadius: w * 0.015,
    paddingHorizontal: w * 0.02,
    paddingVertical: h * 0.004,
    marginRight: w * 0.01,
    marginBottom: h * 0.004,
    borderWidth: 1,
    borderColor: `${pallette.primary}20`,
  },
  connectorText: {
    fontSize: adjust(10),
    color: pallette.primary,
    fontFamily: medium,
  },
  navigateButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: w * 0.04,
    paddingVertical: h * 0.01,
    borderRadius: w * 0.025,
    flexDirection: "row",
    alignItems: "center",
    minWidth: w * 0.25,
    justifyContent: "center",
  },
  navigationIcon: {
    height: w * 0.045,
    width: w * 0.045,
    resizeMode: "contain",
    tintColor: pallette.white,
    marginRight: w * 0.015,
  },
  navigateText: {
    color: pallette.white,
    fontFamily: semibold,
    fontSize: adjust(12),
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingVertical: h * 0.0,
    minHeight: h * 0.2,
    backgroundColor: pallette.white
  },
  loadingText: { 
    marginTop: h * 0.015,
    color: pallette.primary,
    fontSize: adjust(14),
    fontFamily: medium,
  },
  errorText: { 
    marginTop: h * 0.015,
    color: pallette.red,
    fontSize: adjust(14),
    fontFamily: medium,
    textAlign: 'center',
    marginHorizontal: w * 0.1,
  },
  retryButton: { 
    marginTop: h * 0.02, 
    backgroundColor: pallette.primary, 
    paddingHorizontal: w * 0.06, 
    paddingVertical: h * 0.012, 
    borderRadius: w * 0.025,
  },
  retryButtonText: { 
    color: pallette.white, 
    fontSize: adjust(12), 
    fontFamily: semibold
  },
  emptyStateContainer: {
    paddingVertical: h * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: adjust(16),
    color: pallette.grey,
    fontFamily: medium,
    marginBottom: h * 0.005,
  },
  emptyStateSubtext: {
    fontSize: adjust(12),
    color: pallette.grey,
    fontFamily: regular,
    textAlign: 'center',
    marginHorizontal: w * 0.1,
  }
});

export default StationsList;