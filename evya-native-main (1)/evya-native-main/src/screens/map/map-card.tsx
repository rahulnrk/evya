import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from "../../contexts/LocationContext";
import { w, h } from "../../constants/dimensions";
import { adjust } from "../../helpers/common-functions";
import { bold, medium, regular, semibold } from "../../utils/fonts";
import { pallette } from "../../utils/pallette";
import strings from "../../utils/strings";
import { useGetStationsQuery } from "../../redux/api/baseApi";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.90; // Slightly smaller for better spacing
const CARD_MARGIN = w * 0.025; // Increased margin for better separation

/**
 * EVChargingStations — STATE-2: stations via RTK Query
 */
const EVChargingStations = forwardRef((props, ref) => {
  const { onCardScroll, onStationSelect, selectedStation } = props;
  const navigation = useNavigation();
  const { currentLocation } = useLocation();
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const queryArg = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : undefined;

  const {
    data: stations = [],
    isLoading: stationsLoading,
  } = useGetStationsQuery(queryArg, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: 60,
  });

  /**
   * Synchronizes the carousel with the selected station from map
   * Automatically scrolls to the selected station when changed externally
   */
  useEffect(() => {
    if (selectedStation && flatListRef.current && stations.length > 0) {
      const stationIndex = stations.findIndex(station => station.id === selectedStation.id);
      if (stationIndex !== -1 && stationIndex !== currentIndex) {
        setCurrentIndex(stationIndex);
        flatListRef.current.scrollToIndex({
          index: stationIndex,
          animated: true,
          viewPosition: 0.5
        });
      }
    }
  }, [selectedStation, stations, currentIndex]);

  /**
   * Exposes component methods to parent for external control
   */
  useImperativeHandle(ref, () => ({
    /**
     * Scrolls the carousel to a specific station index
     * @param {number} index - Index of the station to scroll to
     */
    scrollToIndex: (index) => {
      if (flatListRef.current && index >= 0 && index < stations.length) {
        setCurrentIndex(index);
        flatListRef.current.scrollToIndex({
          index: index,
          animated: true,
          viewPosition: 0.5
        });
        
        const station = stations[index];
        if (station && onCardScroll) {
          onCardScroll(station);
        }
      }
    }
  }));

  /**
   * Opens Google Maps navigation to the selected charging station
   * @param {Object} station - Station object containing coordinates
   */
  const handleNavigationToStation = (station: any): void => {
    if (station?.coordinates?.latitude && station?.coordinates?.longitude) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.latitude},${station.coordinates.longitude}`;
      Linking.openURL(mapsUrl).catch(() => {
     
      });
    }
  };

  /**
   * Handles station card press - navigates to station details and notifies parent
   * @param {Object} station - Selected station object
   */
  const handleStationCardPress = (station: any): void => {
    if (onStationSelect) {
      onStationSelect(station);
    }
    navigation.navigate(strings.hometab, {
      screen: strings.stationdetails,
      params: { station: station.originalData || station },
    });
  };

  /**
   * Handles scroll events and updates current index with animation
   */
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (CARD_WIDTH + CARD_MARGIN * 2));
        if (index >= 0 && index < stations.length && index !== currentIndex) {
          setCurrentIndex(index);
          const station = stations[index];
          if (onCardScroll && station) {
            onCardScroll(station);
          }
        }
      }
    }
  );

  /**
   * Renders individual station card with animated properties
   * @param {Object} param0 - Item and index from FlatList
   * @returns {JSX.Element} Animated station card component
   */
  const renderStationCard = ({ item, index }: { item: any; index: number }): JSX.Element => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_MARGIN * 2),
      index * (CARD_WIDTH + CARD_MARGIN * 2),
      (index + 1) * (CARD_WIDTH + CARD_MARGIN * 2),
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1.0, 0.92],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    const isSelected = selectedStation?.id === item.id;
    const isStationAvailable = item.available > 0;

    return (
      <Animated.View
        style={[
          styles.stationCard,
          {
            transform: [{ scale }],
            opacity,
            borderColor: isSelected ? pallette.primary : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          },
        ]}
      >
        <TouchableOpacity 
          onPress={() => handleStationCardPress(item)}
          activeOpacity={0.8}
          style={styles.cardTouchable}
        >
          {/* Card Header with Station Name and Status */}
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
                {item.available}/{item.totalPorts}{" "}
                {isStationAvailable ? "Available" : "UnAvailable"}
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
              {item.connectors && item.connectors.slice(0, 3).map((connector: string, connectorIndex: number) => (
                <View key={`connector-${connectorIndex}`} style={styles.connectorTag}>
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
            <TouchableOpacity 
              onPress={() => handleNavigationToStation(item)}
              style={styles.navigateButton}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../assets/images/icons/location.png")}
                style={styles.navigationIcon}
              />
              <Text style={styles.navigateText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Display loading state
  if (stationsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={pallette.primary} />
        <Text style={styles.loadingText}>Loading stations...</Text>
      </View>
    );
  }

  // Display empty state
  if (!stations || stations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No charging stations found</Text>
        <Text style={styles.emptySubtext}>
          Try adjusting your search or check back later
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Nearby Charging Stations</Text>
        <Text style={styles.stationCount}>{stations.length} stations</Text>
      </View>
      <Animated.FlatList
        ref={flatListRef}
        data={stations}
        keyExtractor={(item) => `station-${item.id}`}
        renderItem={renderStationCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialScrollIndex={currentIndex}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_MARGIN * 2,
          offset: (CARD_WIDTH + CARD_MARGIN * 2) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          // Fallback for scroll index failure
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            if (flatListRef.current && info.index < stations.length) {
              flatListRef.current.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5
              });
            }
          });
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: h * 0.03,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: w * 0.05,
    marginBottom: h * 0.01,
  },
  sectionTitle: {
    fontSize: adjust(13),
    fontFamily: bold,
    color: pallette.black,
  },
  stationCount: {
    fontSize: adjust(12),
    fontFamily: medium,
    color: pallette.grey,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: h * 0.0,
    minHeight: h * 0.2,
  },
  loadingText: {
    marginTop: h * 0.015,
    color: pallette.primary,
    fontSize: adjust(14),
    fontFamily: medium,
  },
  emptyText: {
    color: pallette.grey,
    fontSize: adjust(16),
    fontFamily: medium,
    marginBottom: h * 0.005,
  },
  emptySubtext: {
    color: pallette.grey,
    fontSize: adjust(12),
    fontFamily: regular,
    textAlign: "center",
    marginHorizontal: w * 0.1,
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingVertical: h * 0.002,
  },
  stationCard: {
    width: CARD_WIDTH,
    backgroundColor: pallette.white,
    borderRadius: w * 0.02,
    paddingHorizontal: w * 0.04,
    paddingVertical: h * 0.01,
    marginHorizontal: CARD_MARGIN,
    shadowColor: pallette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: h * 0.01,
  },
  cardTouchable: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    // marginBottom: h * 0.01,
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
    // marginBottom: h * 0.01,
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
});

export default EVChargingStations;