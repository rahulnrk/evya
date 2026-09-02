// import React, { useEffect, useState, useCallback, useRef } from 'react';
// import {
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   ActivityIndicator,
//   Image,
// } from 'react-native';
// import MapView, { Marker } from 'react-native-maps';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useLocation } from '../../contexts/LocationContext';
// import { h, w } from '../../constants/dimensions';
// import { pallette } from '../../utils/pallette';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigation } from '@react-navigation/native';
// import strings from '../../utils/strings';
// import { fetchStations } from '../../redux/stationsSlice';
// import ErrorMessage from '../../extra/errormessages';
// import AlertMessage from '../../extra/alertmessage';
// import EVChargingStations from '../map/map-card';
// import { bold, medium, regular } from '../../utils/fonts';

// /**
//  * MapSection Component - Main map view with charging stations and carousel
//  * Displays interactive map with station markers and horizontal station list
//  */
// const MapSection = ({ moveToMaps }: { moveToMaps: Function }) => {
//   // Location context for current user location
//   const {
//     currentLocation,
//     displayLocation,
//     loading: locationLoading,
//     error: locationError,
//   } = useLocation();
  
//   // Redux state for stations data
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const { stations, loading: stationsLoading, error: stationsError } = useSelector(
//     (state: any) => state.stations
//   );

//   // Component state
//   const [mapRegion, setMapRegion] = useState<any>(null);
//   const [hoveredStation, setHoveredStation] = useState<any>(null);
//   const [selectedStation, setSelectedStation] = useState<any>(null);
//   const [isMapDragging, setIsMapDragging] = useState(false);

//   // Refs for component instances and tracking
//   const mapRef = useRef<MapView>(null);
//   const carouselRef = useRef<any>(null);
//   const lastFetchedRegion = useRef<any>(null);
//   const isProgrammaticMove = useRef(false);

//   /**
//    * Calculates distance between two geographic coordinates in meters
//    * Uses Haversine formula for accurate distance calculation
//    */
//   const getDistanceInMeters = (region1: any, region2: any) => {
//     const earthRadius = 6371e3; // Earth radius in meters
//     const lat1Rad = region1.latitude * Math.PI / 180;
//     const lat2Rad = region2.latitude * Math.PI / 180;
//     const latDiff = (region2.latitude - region1.latitude) * Math.PI / 180;
//     const lonDiff = (region2.longitude - region1.longitude) * Math.PI / 180;

//     const haversine = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
//       Math.cos(lat1Rad) * Math.cos(lat2Rad) *
//       Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
//     const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

//     return earthRadius * angularDistance;
//   };

//   /**
//    * Initializes map region based on user's current location
//    * Fetches nearby stations when location is available
//    */
//   useEffect(() => {
//     if (currentLocation) {
//       const initialRegion = {
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: 0.3,
//         longitudeDelta: 0.2,
//       };
//       setMapRegion(initialRegion);
//       lastFetchedRegion.current = initialRegion;
//       dispatch(fetchStations({ location: currentLocation }));
//     }
//   }, [currentLocation]);

//   /**
//    * Handles map region change start
//    * Sets dragging state to true when user interacts with map
//    */
//   const handleRegionChange = useCallback(() => {
//     setIsMapDragging(true);
//   }, []);

//   /**
//    * Handles map region change completion
//    * Fetches new stations only if user dragged significantly (>1km)
//    * Prevents unnecessary API calls during programmatic map moves
//    */
//   const handleRegionChangeComplete = useCallback(
//     (region: any) => {
//       setMapRegion(region);

//       // Skip API call if move was programmatic
//       if (isProgrammaticMove.current) return;

//       if (isMapDragging) {
//         const shouldFetch = !lastFetchedRegion.current ||
//           getDistanceInMeters(region, lastFetchedRegion.current) > 1000;

//         if (shouldFetch) {
//           lastFetchedRegion.current = region;
//           dispatch(fetchStations({
//             location: {
//               latitude: region.latitude,
//               longitude: region.longitude,
//             },
//           }));
//         }
//       }

//       setIsMapDragging(false);
//     },
//     [dispatch, isMapDragging]
//   );
//   /**
//    * Centers map on user's current location
//    * Resets station selection and zooms to detailed view
//    */
//   const goToCurrentLocation = useCallback(() => {
//     if (currentLocation && mapRef.current) {
//       const currentRegion = {
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: 0.02,
//         longitudeDelta: 0.02,
//       };

//       isProgrammaticMove.current = true;
//       mapRef.current.animateToRegion(currentRegion, 1000);
//       setMapRegion(currentRegion);
//       lastFetchedRegion.current = currentRegion;

//       // Clear station selections
//       setHoveredStation(null);
//       setSelectedStation(null);

//       // Reset programmatic move flag after animation
//       setTimeout(() => {
//         isProgrammaticMove.current = false;
//       }, 1100);
//     } else {
//       AlertMessage({
//         title: 'Location Error',
//         message: 'Unable to get current location. Please check your GPS settings.',
//         type: 'error',
//       });
//     }
//   }, [currentLocation]);

//   /**
//    * Handles station marker press
//    * Selects station, scrolls carousel, and centers map on station
//    */
//   const handleMarkerPress = useCallback(
//     (station: any) => {
//       setHoveredStation(station);
//       setSelectedStation(station);

//       // Sync carousel to selected station
//       if (carouselRef.current && stations.length > 0) {
//         const stationIndex = stations.findIndex((s) => s.id === station.id);
//         if (stationIndex !== -1) {
//           carouselRef.current.scrollToIndex(stationIndex);
//         }
//       }

//       // Center map on selected station
//       if (mapRef.current && station.coordinates) {
//         const stationRegion = {
//           latitude: station.coordinates.latitude,
//           longitude: station.coordinates.longitude,
//           latitudeDelta: 0.02,
//           longitudeDelta: 0.02,
//         };
//         isProgrammaticMove.current = true;
//         mapRef.current.animateToRegion(stationRegion, 500);
//         lastFetchedRegion.current = stationRegion;
//         setTimeout(() => {
//           isProgrammaticMove.current = false;
//         }, 600);
//       }
//     },
//     [stations]
//   );

//   /**
//    * Handles carousel scroll events
//    * Updates selected station and centers map when user scrolls carousel
//    */
//   const handleCarouselScroll = useCallback((station: any) => {
//     if (!station) return;

//     setHoveredStation(station);
//     setSelectedStation(station);

//     // Center map on station from carousel
//     if (mapRef.current && station.coordinates) {
//       const stationRegion = {
//         latitude: station.coordinates.latitude,
//         longitude: station.coordinates.longitude,
//         latitudeDelta: 0.02,
//         longitudeDelta: 0.02,
//       };
//       isProgrammaticMove.current = true;
//       mapRef.current.animateToRegion(stationRegion, 1000);
//       lastFetchedRegion.current = stationRegion;
//       setTimeout(() => {
//         isProgrammaticMove.current = false;
//       }, 1100);
//     }
//   }, []);

//   /**
//    * Handles explicit station selection from carousel
//    * Used when user directly taps on a carousel card
//    */
//   const handleStationSelect = useCallback((station: any) => {
//     setHoveredStation(station);
//     setSelectedStation(station);

//     // Center map on selected station
//     if (mapRef.current && station.coordinates) {
//       const stationRegion = {
//         latitude: station.coordinates.latitude,
//         longitude: station.coordinates.longitude,
//         latitudeDelta: 0.02,
//         longitudeDelta: 0.02,
//       };
//       isProgrammaticMove.current = true;
//       mapRef.current.animateToRegion(stationRegion, 500);
//       lastFetchedRegion.current = stationRegion;
//       setTimeout(() => {
//         isProgrammaticMove.current = false;
//       }, 600);
//     }
//   }, []);

//   /**
//    * Memoized charger icon component
//    * Displays different icons based on station franchise
//    * Optimized to prevent unnecessary re-renders
//    */
//   const ChargerIcon = React.memo(
//     ({ site, isHovered }: { site: any; isHovered: boolean }) => {
//       const stationName = (site?.siteName || site?.managerName || '').toLowerCase();
//       let iconSource = require('../../assets/images/evstation.png');

//       if (stationName.includes('bpcl')) {
//         iconSource = require('../../assets/images/chargers/bpcl.png');
//       } else if (stationName.includes('hpcl')) {
//         iconSource = require('../../assets/images/chargers/hpcl.png');
//       } else if (stationName.includes('iocl') || stationName.includes('indian oil')) {
//         iconSource = require('../../assets/images/chargers/incl.png');
//       }

//       return (
//         <Image
//           source={iconSource}
//           style={[
//             styles.chargerIcon,
//             isHovered && styles.hoveredChargerIcon
//           ]}
//           resizeMode="contain"
//         />
//       );
//     }
//   );

//   // Combined loading and error states
//   const loading = locationLoading || stationsLoading;
//   const error = locationError || stationsError;

//   return (
//     <View style={styles.container}>
//       {/* Empty state message */}
//       {stations.length === 0 && !loading && !error && (
//         <ErrorMessage message="No charging stations found in your area" />
//       )}

//       {/* Map Container */}
//       <View style={styles.mapContainer}>
//         {mapRegion && (
//           <MapView
//             ref={mapRef}
//             style={styles.map}
//             region={mapRegion}
//             onRegionChange={handleRegionChange}
//             onRegionChangeComplete={handleRegionChangeComplete}
//             showsUserLocation={false}
//             showsMyLocationButton={false}
//             moveOnMarkerPress={false}
//           >
//             {/* Current Location Marker */}
//             {currentLocation && (
//               <Marker 
//                 coordinate={currentLocation} 
//                 title="Your Location" 
//                 description={displayLocation}
//               >
//                 <View style={styles.currentLocationMarker}>
//                   <View style={styles.locationPulse} />
//                   <View style={styles.locationDot} />
//                 </View>
//               </Marker>
//             )}

//             {/* Station Markers */}
//             {stations.map((station: any) => (
//               <Marker
//                 key={station.id}
//                 coordinate={station.coordinates}
//                 title={station.name}
//                 description={`${station.available}/${station.totalPorts} available`}
//                 onPress={(e) => {
//                   e.stopPropagation();
//                   handleMarkerPress(station);
//                 }}
//                 tracksViewChanges={false}
//               >
//                 <View style={styles.chargerMarker}>
//                   <ChargerIcon 
//                     site={station} 
//                     isHovered={hoveredStation?.id === station.id} 
//                   />
//                   <View
//                     style={[
//                       styles.availabilityBadge,
//                       {
//                         backgroundColor: station.available > 0 ? 
//                           pallette.lightprimary : pallette.lightred,
//                       },
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         styles.availabilityText,
//                         { 
//                           color: station.available > 0 ? 
//                             pallette.black : pallette.black,
//                         },
//                       ]}
//                     >
//                       {station.available}/{station.totalPorts}
//                     </Text>
//                   </View>
//                 </View>
//               </Marker>
//             ))}
//           </MapView>
//         )}

//         {/* Loading Overlay */}
//         {loading && (
//           <View style={styles.loaderOverlay}>
//             <ActivityIndicator size="large" color={pallette.primary} />
//             <Text style={styles.loadingText}>
//               {locationLoading ? 'Getting your location...' : 'Loading charging stations...'}
//             </Text>
//           </View>
//         )}

//         {/* Error Overlay */}
//         {error && (
//           <View style={styles.loaderOverlay}>
//             <ErrorMessage message={error} />
//             <TouchableOpacity
//               onPress={() => dispatch(fetchStations({ location: currentLocation }))}
//               style={styles.retryButton}
//             >
//               <Text style={styles.retryText}>Try Again</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </View>

//       {/* Stations Carousel */}
//       <View style={styles.carouselSection}>
//         <EVChargingStations
//           ref={carouselRef}
//           onCardScroll={handleCarouselScroll}
//           onStationSelect={handleStationSelect}
//           selectedStation={selectedStation}
//         />
//       </View>

//       {/* Map Action Buttons */}
//       <View style={styles.actionButtons}>
//         <TouchableOpacity 
//           style={styles.actionButton} 
//           onPress={goToCurrentLocation}
//         >
//           <Icon name="my-location" size={24} color={pallette.primary} />
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() =>
//             navigation.navigate(strings.hometab, { screen: strings.stationslist })
//           }
//         >
//           <Icon name="view-list" size={24} color={pallette.primary} />
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() =>
//             navigation.navigate('WebViewScreen', { 
//               url: 'https://web.evyaa.com/route', 
//               title: 'Route' 
//             })
//           }
//         >
//           <Icon name="directions" size={24} color={pallette.primary} />
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() =>
//             navigation.navigate('WebViewScreen', { 
//               url: 'https://web.evyaa.com/map', 
//               title: 'Map' 
//             })
//           }
//         >
//           <Icon name="fullscreen" size={24} color={pallette.primary} />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default MapSection;

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     position: 'relative',
//     backgroundColor: pallette.background,
//   },
//   mapContainer: {
//     height: h * 0.37,
//     width: w * 0.95,
//     marginHorizontal: w * 0.025,
//     borderRadius: w * 0.02,
//     overflow: 'hidden',
//     backgroundColor: pallette.white,
//   },
//   map: { 
//     flex: 1 
//   },
//   chargerMarker: { 
//     alignItems: 'center', 
//     justifyContent: 'center' 
//   },
//   chargerIcon: { 
//     width: 24, 
//     height: 54, 
//     resizeMode: 'contain', 
//     opacity: 0.8 
//   },
//   hoveredChargerIcon: { 
//     opacity: 1, 
//     transform: [{ scale: 1.1 }] 
//   },
//   availabilityBadge: { 
//     borderRadius: 18, 
//     paddingVertical: 2, 
//     paddingHorizontal: 6,
//     position: 'absolute', 
//     bottom: -5, 
//     minWidth: 50,
//   },
//   availabilityText: { 
//     fontSize: 10, 
//     fontFamily: bold,
//     textAlign: 'center' 
//   },
//   currentLocationMarker: { 
//     alignItems: 'center', 
//     justifyContent: 'center' 
//   },
//   locationDot: { 
//     width: 16, 
//     height: 16, 
//     borderRadius: 8, 
//     backgroundColor: pallette.primary, 
//     borderWidth: 3, 
//     borderColor: pallette.white, 
//     zIndex: 2 
//   },
//   locationPulse: { 
//     position: 'absolute', 
//     width: 24, 
//     height: 24, 
//     borderRadius: 12, 
//     backgroundColor: `${pallette.primary}40`, 
//     zIndex: 1 
//   },
//   retryButton: { 
//     marginTop: 12, 
//     paddingHorizontal: 20, 
//     paddingVertical: 10, 
//     backgroundColor: pallette.primary, 
//     borderRadius: 8 
//   },
//   retryText: { 
//     color: pallette.white, 
//     fontFamily: bold, 
//     fontSize: 14 
//   },
//   loadingText: { 
//     marginTop: 12, 
//     color: pallette.primary, 
//     fontSize: 14, 
//     fontFamily: medium 
//   },
//   actionButtons: { 
//     position: 'absolute', 
//     top: h * 0.04, 
//     right: w * 0.04, 
//     zIndex: 10 
//   },
//   actionButton: {
//     backgroundColor: pallette.white,
//     width: w * 0.12,
//     height: w * 0.12,
//     borderRadius: w * 0.06,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: h * 0.008,
//     shadowColor: pallette.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   loaderOverlay: { 
//     ...StyleSheet.absoluteFillObject, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     backgroundColor: `${pallette.white}E6`, 
//     zIndex: 100 
//   },
//   carouselSection: { 
//     flex: 1, 
//     marginTop: h * 0.01 
//   },
// });