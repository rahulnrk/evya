// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   SafeAreaView,
//   View,
//   Text,
//   TouchableOpacity,
//   Dimensions,
//   ActivityIndicator,
//   Alert,
//   Linking,
//   StyleSheet,
//   Image,
// } from 'react-native';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useDispatch, useSelector } from 'react-redux';
// import { h, w } from '../../constants/dimensions';
// import { pallette } from '../../utils/pallette';
// import { adjust } from '../../helpers/common-functions';
// import { medium, semibold } from "../../utils/fonts";
// import strings from '../../utils/strings';
// import { useLocation } from '../../contexts/LocationContext';
// import { fetchStations } from '../../redux/stationsSlice';
// import SearchComponent from './Search';
// import SiteCard from './SiteCard'; 
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import ErrorMessage from '../../extra/errormessages';

// const { width, height } = Dimensions.get('window');

// const MapsScreen = () => {
//   const mapRef = useRef(null);
//   const dispatch = useDispatch();
//   const { currentLocation, displayLocation, loading: locationLoading, error: locationError } = useLocation();
//   const navigation = useNavigation();
  
//   // Redux stations state
//   const { stations: sites = [], loading: stationsLoading, error: stationsError } = useSelector(
//     (state) => state.stations || {}
//   );

//   const [selectedSite, setSelectedSite] = useState(null);
//   const [isCardVisible, setIsCardVisible] = useState(false);

//   const region = {
//     latitude: currentLocation?.latitude || 17.413,
//     longitude: currentLocation?.longitude || 78.4713,
//     latitudeDelta: 0.4,
//     longitudeDelta: 0.01,
//   };

//   // ✅ Fetch stations every time screen is focused
//   useFocusEffect(
//     useCallback(() => {
//       if (currentLocation) {
//         dispatch(fetchStations({ location: currentLocation }));
//       }
//     }, [dispatch, currentLocation])
//   );

//   useEffect(() => {
//     if (stationsError) {
//       Alert.alert('Error', stationsError);
//     }
//   }, [stationsError]);

//   // Animate to first site when stations change
//   useEffect(() => {
//     if (sites.length > 0 && mapRef.current) {
//       const first = sites[0];
//       if (first.coordinates) {
//         mapRef.current.animateToRegion(
//           {
//             latitude: first.coordinates.latitude,
//             longitude: first.coordinates.longitude,
//             latitudeDelta: 0.4,
//             longitudeDelta: 0.01,
//           },
//           1000
//         );
//       }
//     }
//   }, [sites]);

//   const handleSelectSiteFromSearch = (site) => {
//     if (!site) return;
//     setSelectedSite(site);
//     setIsCardVisible(true);

//     if (mapRef.current && site.coordinates) {
//       mapRef.current.animateToRegion(
//         {
//           latitude: site.coordinates.latitude,
//           longitude: site.coordinates.longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         },
//         1000
//       );
//     }
//   };

//   const handleNavigateToSite = (site) => {
//     if (!site?.coordinates) return;
//     const { latitude, longitude } = site.coordinates;
//     const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
//     Linking.openURL(url).catch((err) => console.error('Failed to open Google Maps', err));
//   };

//   const handleMarkerPress = (site) => {
//     setSelectedSite(site);
//     setIsCardVisible(true);
    
//     if (mapRef.current && site.coordinates) {
//       mapRef.current.animateToRegion(
//         {
//           latitude: site.coordinates.latitude,
//           longitude: site.coordinates.longitude,
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         },
//         500
//       );
//     }
//   };

//   const handleMapPress = () => {
//     setSelectedSite(null);
//     setIsCardVisible(false);
//   };

//   const focusOnUserLocation = () => {
//     if (currentLocation && mapRef.current) {
//       mapRef.current.animateToRegion({
//         latitude: currentLocation.latitude,
//         longitude: currentLocation.longitude,
//         latitudeDelta: 0.0922,
//         longitudeDelta: 0.0421,
//       });
//     }
//   };

//   if (locationLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="green" />
//       </View>
//     );
//   }

//   if (locationError) {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <Icon name="error-outline" size={48} color={pallette.red} />
//         <Text style={styles.errorText}>{locationError}</Text>
//         <TouchableOpacity
//           style={styles.retryButton}
//           onPress={() => {
//             if (currentLocation) dispatch(fetchStations({ location: currentLocation }));
//           }}
//         >
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.mapContainer}>
//         {sites.length === 0 && !stationsLoading && !stationsError && (
//           <ErrorMessage message="No Chargers Found check the applied filters" />
//         )}

//         <SearchComponent
//           onSelectSite={handleSelectSiteFromSearch}
//           onNavigateToSite={handleNavigateToSite}
//         />

//         <MapView
//           ref={mapRef}
//           style={styles.map}
//           provider={PROVIDER_GOOGLE}
//           initialRegion={region}
//           showsUserLocation={true}
//           showsMyLocationButton={false}
//           onPress={handleMapPress}
//         >
//           {Array.isArray(sites) &&
//             sites.map((site, index) =>
//               site?.coordinates ? (
//                 <Marker
//                   key={site.id || index}
//                   coordinate={site.coordinates}
//                   title={site.name}
//                   description={site.address}
//                   onPress={() => handleMarkerPress(site)}
//                 >
//                   <View style={styles.markerContainer}>
//                     <Image
//                       source={require('../../assets/images/chargers/hpcl.png')}
//                       style={{
//                         width: 40,
//                         height: 50,
//                       }}
//                       resizeMode="contain"
//                     />
//                     <View
//                       style={[
//                         styles.availabilityBadge,
//                         { backgroundColor: site.available > 0 ? '#E6F4EA' : '#FFEBEB' },
//                       ]}
//                     >
//                       <Text
//                         style={[
//                           styles.availabilityText,
//                           { color: site.available > 0 ? '#4CAF50' : '#F44336' },
//                         ]}
//                       >
//                         {site.available}/{site.totalPorts || 0}
//                       </Text>
//                     </View>
//                   </View>
//                 </Marker>
//               ) : null
//             )}
//         </MapView>

//         {selectedSite && isCardVisible && (
//           <View style={styles.selectedStationCard}>
//             <SiteCard
//               site={selectedSite}
//               onNavigatePress={() => handleNavigateToSite(selectedSite)}
//               showDistance={true}
//               distance="12.6 km"
//               onClose={() => setIsCardVisible(false)}
//             />
//           </View>
//         )}

//         <View style={styles.actionButtons}>
//           <TouchableOpacity style={styles.actionButton} onPress={focusOnUserLocation}>
//             <Icon name="my-location" size={24} color={pallette.primary} />
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => navigation.navigate(strings.hometab, { screen: strings.stationslist })}
//           >
//             <Icon name="view-list" size={24} color={pallette.primary} />
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => navigation.navigate(strings.maptab, { screen: strings.routescreen })}
//           >
//             <Icon name="directions" size={24} color={pallette.primary} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: pallette.white },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   errorText: { marginTop: 16, fontSize: adjust(14), color: pallette.red, textAlign: 'center', fontFamily: medium },
//   retryButton: { marginTop: 20, backgroundColor: pallette.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
//   retryButtonText: { color: pallette.white, fontSize: adjust(14), fontFamily: semibold },
//   mapContainer: { flex: 1, position: 'relative' },
//   map: { width: '100%', height: '100%' },
//   actionButtons: { position: 'absolute', bottom: h * 0.18, right: w * 0.04, zIndex: 10 },
//   loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  
//     zIndex: 999,        // Increase zIndex
//   elevation: 999,
//     shadowColor: pallette.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
  
//   },
//   availabilityBadge: { position: 'absolute',  borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
//   availabilityText: { fontSize: adjust(10), fontFamily: semibold },
// });
// export default MapsScreen;