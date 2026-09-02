// import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Keyboard,
//   FlatList,
//   Platform,
//   Linking,
//   Alert,
//   InteractionManager,
//   Dimensions,
//   Image,
// } from "react-native";
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
// import Ionicons from "react-native-vector-icons/Ionicons";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchStations } from "../../redux/stationsSlice";
// import PolylineDecode from "@mapbox/polyline";
// import { useLocation } from "../../contexts/LocationContext";
// import { pallette } from "../../utils/pallette";
// import { semibold } from "../../utils/fonts";
// import { h, w } from '../../constants/dimensions';
// import { useNavigation } from '@react-navigation/native';
// import strings from '../../utils/strings';
// import SiteCard from "../map/SiteCard";

// const { width, height } = Dimensions.get('window');
  
// // IMPORTANT: move this to env in production
// const GOOGLE_API_KEY = "REDACTED_GOOGLE_MAPS_API_KEY";

// // ------------------ Small memoized components ------------------
// const PredictionItem = React.memo(({ item, onPress }) => (
//   <TouchableOpacity style={styles.predictionItem} onPress={() => onPress(item)}>
//     <Ionicons name="location-outline" size={18} color="#333" />
//     <Text style={styles.predictionText} numberOfLines={1}>
//       {item.description}
//     </Text>
//   </TouchableOpacity>
// ));

// const PredictionsList = React.memo(({ predictions, onSelect }) => (
//   <FlatList
//     data={predictions}
//     keyExtractor={(i) => i.place_id}
//     style={styles.predictionsList}
//     keyboardShouldPersistTaps="handled"
//     renderItem={({ item }) => <PredictionItem item={item} onPress={onSelect} />}
//   />
// ));

// const SearchBar = React.memo(({
//   source,
//   destination,
//   onSourceFocus,
//   onDestFocus,
//   onUseCurrentLocation,
//   onClearSource,
//   onClearDest,
//   onChangeSource,
//   onChangeDest,
// }) => {
//   return (
//     <View style={styles.expandedContainer}>
//       <View style={styles.inputsContainer}>
//         <View style={styles.inputRow}>
//           <Ionicons name="locate" size={18} color="#4A90E2" />
//           <TextInput
//             style={styles.input}
//             placeholder="Choose Current Location"
//             placeholderTextColor="#888"
//             value={source}
//             onChangeText={onChangeSource}
//             onFocus={onSourceFocus}
//             returnKeyType="next"
//           />
//           {source ? (
//             <TouchableOpacity onPress={onClearSource} hitSlop={10}>
//               <Ionicons name="close-circle" size={18} color="#888" />
//             </TouchableOpacity>
//           ) : null}
//           <TouchableOpacity onPress={onUseCurrentLocation} hitSlop={10}>
//             <Ionicons name="locate" size={18} color={pallette.primary} />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.divider} />

//         <View style={styles.inputRow}>
//           <Ionicons name="location" size={18} color="red" />
//           <TextInput
//             style={styles.input}
//             placeholder="Choose Destination Location"
//             placeholderTextColor="#888"
//             value={destination}
//             onChangeText={onChangeDest}
//             onFocus={onDestFocus}
//             returnKeyType="done"
//           />
//           {destination ? (
//             <TouchableOpacity onPress={onClearDest} hitSlop={10}>
//               <Ionicons name="close-circle" size={18} color="#888" />
//             </TouchableOpacity>
//           ) : null}
//         </View>
//       </View>
//     </View>
//   );
// });

// // ------------------ Main Screen ------------------
// const RouteScreen = () => {
//   const { currentLocation, fullLocation } = useLocation();
//   const mapRef = useRef(null);
//   const navigation = useNavigation();

//   const [isExpanded, setIsExpanded] = useState(true);
//   const [source, setSource] = useState("");
//   const [destination, setDestination] = useState("");
//   const [routeCoords, setRouteCoords] = useState([]);
//   const [noChargers, setNoChargers] = useState(false);
//   const [isFetchingRoute, setIsFetchingRoute] = useState(false);
//   const [selectedSite, setSelectedSite] = useState(null);

//   // Autocomplete state
//   const [predictions, setPredictions] = useState([]);
//   const [activeInput, setActiveInput] = useState(null);

//   const dispatch = useDispatch();
//   const { stations, loading, error } = useSelector((state) => state.stations);

//   // Refs for debouncing
//   const predDebounceRef = useRef(null);

//   // Pre-fill source once
//   useEffect(() => {
//     if (fullLocation && !source) setSource(fullLocation);
//   }, [fullLocation]);

//   // Update route when stations change (lightweight check)
//   useEffect(() => {
//     if (stations && stations.length > 0) {
//       setNoChargers(false);
//       // fetchRoute uses the latest source/destination
//       fetchRoute(source, destination);
//     } else if (!loading && source && destination) {
//       setNoChargers(true);
//     }
//   }, [stations, loading]);

//   // ------------------ Debounced predictions (no external deps) ------------------
//   const fetchPredictions = useCallback(async (input) => {
//     if (!input || input.length < 3) {
//       setPredictions([]);
//       return;
//     }

//     try {
//       const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
//         input
//       )}&key=${GOOGLE_API_KEY}`;
//       const res = await fetch(url);
//       const json = await res.json();

//       if (json.predictions) setPredictions(json.predictions);
//     } catch (err) {
//       console.log("Autocomplete error:", err);
//     }
//   }, []);

//   const debouncedFetchPredictions = useCallback((input) => {
//     if (predDebounceRef.current) clearTimeout(predDebounceRef.current);
//     predDebounceRef.current = setTimeout(() => fetchPredictions(input), 450);
//   }, [fetchPredictions]);

//   // Fetch place details
//   const fetchPlaceDetails = useCallback(async (placeId, description, isSource = false) => {
//     try {
//       const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_API_KEY}`;
//       const res = await fetch(url);
//       const json = await res.json();
//       if (json.result) {
//         if (isSource) {
//           setSource(description);
//         } else {
//           setDestination(description);
//         }
//         setPredictions([]);
//         setActiveInput(null);
//       }
//     } catch (err) {
//       console.log("Place details error:", err);
//       Alert.alert("Error", "Failed to get location details");
//     }
//   }, []);

//   // ------------------ Route fetching with non-blocking polyline decode ------------------
//   const fetchRoute = useCallback(async (from, to) => {
//     if (!from || !to) return;

//     setIsFetchingRoute(true);
//     try {
//       const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
//         from
//       )}&destination=${encodeURIComponent(
//         to
//       )}&key=${GOOGLE_API_KEY}`;

//       const res = await fetch(url);
//       const json = await res.json();

//       if (json.routes && json.routes.length) {
//         // decode after interactions to avoid blocking animations
//         InteractionManager.runAfterInteractions(() => {
//           try {
//             const points = PolylineDecode.decode(json.routes[0].overview_polyline.points);
//             const coords = points.map(point => ({ latitude: point[0], longitude: point[1] }));
//             setRouteCoords(coords);
            
//             // Fit map to show the entire route
//             if (mapRef.current && coords.length > 0) {
//               mapRef.current.fitToCoordinates(coords, {
//                 edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
//                 animated: true,
//               });
//             }
//           } catch (err) {
//             console.log('Polyline decode error', err);
//           }
//         });
//       } else {
//         Alert.alert("Error", "No route found between these locations");
//       }
//     } catch (err) {
//       console.log("Route fetch error:", err);
//       Alert.alert("Error", "Failed to fetch route");
//     } finally {
//       setIsFetchingRoute(false);
//     }
//   }, []);

//   // ------------------ Handlers ------------------
//   const handleFindChargers = useCallback(() => {
//     Keyboard.dismiss();
//     if (source && destination) {
//       dispatch(fetchStations({ from: source, to: destination }));
//     } else {
//       Alert.alert("Error", "Please enter both source and destination");
//     }
//   }, [source, destination, dispatch]);

//   const handleInputFocus = useCallback((inputName) => {
//     setActiveInput(inputName);
//     if (inputName === 'source' && source) debouncedFetchPredictions(source);
//     else if (inputName === 'destination' && destination) debouncedFetchPredictions(destination);
//   }, [source, destination, debouncedFetchPredictions]);

//   const handleInputBlur = useCallback(() => {
//     setTimeout(() => {
//       setPredictions([]);
//       setActiveInput(null);
//     }, 200);
//   }, []);

//   const useCurrentLocation = useCallback(() => {
//     if (fullLocation) {
//       setSource(fullLocation);
//       setPredictions([]);
//     }
//   }, [fullLocation]);

//   const clearSource = useCallback(() => {
//     setSource("");
//     setPredictions([]);
//   }, []);

//   const clearDest = useCallback(() => {
//     setDestination("");
//     setPredictions([]);
//   }, []);

//   // Map interactions
//   const handleMarkerPress = useCallback((site) => {
//     setSelectedSite(site);
//     if (mapRef.current && site.coordinates) {
//       mapRef.current.animateToRegion(
//         {
//           latitude: site.coordinates.latitude,
//           longitude: site.coordinates.longitude,
//           latitudeDelta: 0.1,
//           longitudeDelta: 0.1,
//         },
//         500
//       );
//     }
//   }, []);

//   const handleNavigateToSite = useCallback((site) => {
//     if (!site || !site.coordinates) return;
//     const { latitude, longitude } = site.coordinates;
//     const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
//     Linking.openURL(url).catch((err) => console.error('Failed to open Google Maps', err));
//   }, []);

//   const handleSiteCardPress = useCallback((site) => {
//     setSelectedSite(site);
//     navigation.navigate(strings.maptab, {
//       screen: strings.stationdetails,
//       params: { station: site }
//     });
//   }, [navigation]);

//   const focusOnUserLocation = useCallback(() => {
//     if (currentLocation && mapRef.current) {
//       mapRef.current.animateToRegion({
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: 0.1,
//         longitudeDelta: 0.1,
//       });
//     }
//   }, [currentLocation]);

//   // ------------------ Memoize markers to avoid re-rendering on unrelated state changes ------------------
//   const markers = useMemo(() => {
//     if (!Array.isArray(stations)) return null;
//     return stations.map((site, index) => {
//       if (!site || !site.coordinates) return null;
//       return (
//         <Marker
//           key={site.id?.toString() || index}
//           coordinate={site.coordinates}
//           title={site.name}
//           description={site.address}
//           onPress={() => handleMarkerPress(site)}
//           tracksViewChanges={false} // important perf win after initial render
//         >
//           <View>
//              <Image
//                                     source={require('../../assets/images/evstation.png')}
//                                     style={{
//                                       width: 40,
//                                       height: 50,
//                                       // tintColor: site.available > 0 ? pallette.primary : '#e80a0aff'
//                                     }}
//                                     resizeMode="contain"
//                                   />
//             <View
//               style={[
//                 styles.availabilityBadge,
//                 { backgroundColor: site.available > 0 ? '#E6F4EA' : '#FFEBEB' },
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.availabilityText,
//                   { color: site.available > 0 ? '#4CAF50' : '#F44336' },
//                 ]}
//               >
//                 {site.available}/{site.totalPorts || 0}
//               </Text>
//             </View>
//           </View>
//         </Marker>
//       );
//     });
//   }, [stations, handleMarkerPress]);

//   // ------------------ Predictions select handler ------------------
//   const onSelectPrediction = useCallback(({ place_id, description }) => {
//     fetchPlaceDetails(place_id, description, activeInput === 'source');
//   }, [fetchPlaceDetails, activeInput]);

//   // ------------------ Render ------------------
//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         style={StyleSheet.absoluteFillObject}
//         provider={PROVIDER_GOOGLE}
//         initialRegion={{
//           latitude: currentLocation?.latitude || 17.385,
//           longitude: currentLocation?.longitude || 78.4867,
//           latitudeDelta: 5,
//           longitudeDelta: 5,
//         }}
//         showsUserLocation={true}
//         showsMyLocationButton={false}
//         onPress={() => setSelectedSite(null)}
//       >
//         {routeCoords.length > 0 && (
//           <Polyline
//             coordinates={routeCoords}
//             strokeWidth={4}
//             strokeColor={pallette.l1}
//           />
//         )}

//         {markers}
//       </MapView>

//       <View style={styles.searchContainer}>
//         {isExpanded ? (
//           <>
//             <TouchableOpacity
//               style={styles.backButton}
//               onPress={() => {
//                 setIsExpanded(false);
//                 setSource(fullLocation || "");
//                 setDestination("");
//                 setRouteCoords([]);
//                 setPredictions([]);
//                 setActiveInput(null);
//                 setSelectedSite(null);
//               }}
//               hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#333" />
//             </TouchableOpacity>

//             <SearchBar
//               source={source}
//               destination={destination}
//               onSourceFocus={() => handleInputFocus('source')}
//               onDestFocus={() => handleInputFocus('destination')}
//               onUseCurrentLocation={useCurrentLocation}
//               onClearSource={clearSource}
//               onClearDest={clearDest}
//               onChangeSource={(text) => {
//                 setSource(text);
//                 setActiveInput('source');
//                 debouncedFetchPredictions(text);
//               }}
//               onChangeDest={(text) => {
//                 setDestination(text);
//                 setActiveInput('destination');
//                 debouncedFetchPredictions(text);
//               }}
//             />

//             {predictions.length > 0 && activeInput && (
//               <PredictionsList predictions={predictions} onSelect={onSelectPrediction} />
//             )}

//             <TouchableOpacity
//               style={[
//                 styles.findButton,
//                 (!source || !destination) && styles.findButtonDisabled,
//               ]}
//               onPress={handleFindChargers}
//               disabled={!source || !destination || isFetchingRoute}
//             >
//               {isFetchingRoute ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={styles.findButtonText}>Find Chargers</Text>
//               )}
//             </TouchableOpacity>
//           </>
//         ) : (
//           <TouchableOpacity
//             style={styles.collapsedSearchBar}
//             onPress={() => setIsExpanded(true)}
//             activeOpacity={0.7}
//           >
//             <Ionicons name="search" size={20} color="#888" />
//             <Text style={styles.placeholderText}>Search your Destination</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <View style={styles.actionButtons}>
//         <TouchableOpacity style={styles.actionButton} onPress={focusOnUserLocation}>
//           <Icon name="my-location" size={24} color={pallette.primary} />
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => navigation.navigate(strings.hometab, { screen: strings.stationslist })}
//         >
//           <Icon name="view-list" size={24} color={pallette.primary} />
//         </TouchableOpacity>
//       </View>

//       {selectedSite && (
//         <View style={styles.selectedStationCard}>
//           <SiteCard
//             site={selectedSite}
//             onNavigatePress={handleNavigateToSite}
//           />
//         </View>
//       )}

//       {(loading || isFetchingRoute) && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="green" />
//         </View>
//       )}

//       {noChargers && !loading && (
//         <View style={styles.messageBox}>
//           <Text style={styles.messageText}>No chargers found along this route </Text>
//         </View>
//       )}

//       {error && !loading && (
//         <View style={[styles.messageBox, styles.errorBox]}>
//           <Text style={styles.messageText}>Error: {error}</Text>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   searchContainer: {
//     position: "absolute",
//     top: Platform.OS === 'ios' ? 50 : 50,
//     left: 10,
//     right: 10,
//     zIndex: 10,
//   },
//   collapsedSearchBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     paddingHorizontal: 15,
//     paddingVertical: 12,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   placeholderText: {
//     marginLeft: 10,
//     fontSize: 14,
//     color: "#888",
//   },
//   expandedContainer: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 15,
//     elevation: 3,
//   },
//   backButton: {
//     position: "absolute",
//     top: 15,
//     left: 15,
//     zIndex: 1,
//   },
//   inputsContainer: {
//     marginTop: 10,
//     marginLeft: 30,
//   },
//   inputRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginVertical: 8,
//   },
//   input: {
//     flex: 1,
//     fontSize: 14,
//     color: "#333",
//     paddingVertical: Platform.OS === "ios" ? 10 : 8,
//     marginLeft: 8,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#ddd",
//     marginLeft: 24,
//     marginRight: 10,
//     marginVertical: 5,
//   },
//   predictionsList: {
//     maxHeight: 150,
//     marginTop: 5,
//     borderWidth: 1,
//     borderColor: "#eee",
//     borderRadius: 8,
//     backgroundColor: "#fff",
//   },
//   predictionItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     borderBottomWidth: 1,
//     borderColor: "#eee",
//   },
//   predictionText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: "#333",
//     flex: 1,
//   },
//   findButton: {
//     backgroundColor: pallette.primary,
//     borderRadius: 10,
//     paddingVertical: 12,
//     alignItems: "center",
//     marginTop: 15,
//   },
//   findButtonDisabled: {
//     backgroundColor: "#aaa",
//   },
//   findButtonText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   loadingContainer: {
//     position: "absolute",
//     top: "50%",
//     alignSelf: "center",
//   },
//   messageBox: {
//     position: "absolute",
//     bottom: 40,
//     alignSelf: "center",
//     backgroundColor: "white",
//     padding: 12,
//     borderRadius: 8,
//     elevation: 5,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   errorBox: {
//     backgroundColor: "#ffebee",
//   },
//   messageText: {
//     fontSize: 14,
//     color: "#333",
//   },
//   actionButtons: {
//     position: 'absolute',
//     bottom: h * 0.18,
//     right: w * 0.04,
//     zIndex: 10,
//   },
//   actionButton: {
//     backgroundColor: pallette.white,
//     width: w * 0.1,
//     height: w * 0.1,
//     borderRadius: w * 0.05,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: h * 0.01,
//     shadowColor: pallette.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   selectedStationCard: {
//     position: 'absolute',
//     bottom: h * 0.03,
//     left: w * 0.04,
//     right: w * 0.04,
//     zIndex: 10,
//   },
//  availabilityBadge: { position: 'absolute',  borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
//   availabilityText: {
//     fontSize: 10,
//     fontFamily: semibold,
//   },
// });

// export default RouteScreen;