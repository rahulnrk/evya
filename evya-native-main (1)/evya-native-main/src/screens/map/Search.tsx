// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   Text,
//   ActivityIndicator,
//   StyleSheet,
//   Alert,
//   Dimensions,
//   Keyboard,
//   Linking,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import { useDispatch, useSelector } from 'react-redux';
// import { pallette } from '../../utils/pallette';
// import { adjust } from '../../helpers/common-functions';
// import { regular, semibold, medium, bold } from "../../utils/fonts";
// import { fetchStations } from '../../redux/stationsSlice';

// const { width, height } = Dimensions.get('window');

// // Google Maps API Key - move to env for security
// const GOOGLE_API_KEY = "REDACTED_GOOGLE_MAPS_API_KEY";

// const SearchComponent = ({ onSelectSite }) => {
//   const dispatch = useDispatch();
//   const { loading: stationsLoading, error: stationsError } = useSelector(
//     (state) => state.stations
//   );

//   const [searchQuery, setSearchQuery] = useState('');
//   const [predictions, setPredictions] = useState([]);
//   const [isFetchingPredictions, setIsFetchingPredictions] = useState(false);



//   useEffect(() => {
//     return () => {
//       setSearchQuery('');
//       setPredictions([]);
//     };
//   }, []);

//   // Show error alerts
//   useEffect(() => {
//     if (stationsError) {
//       Alert.alert("Error", stationsError);
//     }
//   }, [stationsError]);

//   // Fetch Autocomplete predictions
//   const fetchPredictions = useCallback(async (input) => {
//     if (!input || input.length < 3) {
//       setPredictions([]);
//       return;
//     }

//     setIsFetchingPredictions(true);
//     try {
//       const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
//         input
//       )}&key=${GOOGLE_API_KEY}`;
//       const res = await fetch(url);
//       const json = await res.json();

//       if (json.predictions) {
//         setPredictions(json.predictions);
//       }
//     } catch (err) {
//       console.log("Autocomplete error:", err);
//     } finally {
//       setIsFetchingPredictions(false);
//     }
//   }, []);

//   const handleSearchChange = (text) => {
//     setSearchQuery(text);
//     if (text.length >= 3) {
//       fetchPredictions(text);
//     } else {
//       setPredictions([]);
//     }
//   };

//   const handleSearch = () => {
//     if (searchQuery.trim().length > 0) {
//       dispatch(fetchStations({ search: searchQuery.trim() }));
//       setPredictions([]);
//       Keyboard.dismiss();
//     }
//   };

//   const handleSelectPrediction = (prediction) => {
//     setSearchQuery(prediction.description);
//     setPredictions([]);
//     // optionally trigger search
//     // dispatch(fetchStations({ search: prediction.description }));
//   };

//   const handleClearSearch = () => {
//     setSearchQuery('');
//     setPredictions([]);
//     dispatch(fetchStations({ search: '' }));
//   };

//   const renderPredictionItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.predictionItem}
//       onPress={() => handleSelectPrediction(item)}
//       activeOpacity={0.7}
//     >
//       <Ionicons name="location-outline" size={18} color="#333" />
//       <Text style={styles.predictionText} numberOfLines={1}>
//         {item.description}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       {/* Search bar */}
//       <View style={styles.searchContainer}>
//         <Icon name="search" size={20} color={pallette.grey} style={{ marginRight: 8 }} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Address"
//           placeholderTextColor={pallette.grey}
//           value={searchQuery}
//           onChangeText={handleSearchChange}
//           returnKeyType="search"
//           onSubmitEditing={handleSearch}
//         />

//         <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
//           <Text style={styles.searchButtonText}>Search</Text>
//         </TouchableOpacity>

//         {searchQuery !== '' && (
//           <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
//             <Text style={styles.clearText}>X</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Predictions dropdown */}
//       {predictions.length > 0 && (
//         <View style={styles.predictionsDropdown}>
//           {isFetchingPredictions ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color={pallette.primary} />
//               <Text style={styles.loadingText}>Loading predictions...</Text>
//             </View>
//           ) : (
//             <FlatList
//               data={predictions}
//               keyExtractor={(item) => item.place_id}
//               keyboardShouldPersistTaps="handled"
//               renderItem={renderPredictionItem}
//             />
//           )}
//         </View>
//       )}

//       {/* Show loading state for stations */}
//       {stationsLoading && (
//         <View style={styles.dropdown}>
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={pallette.primary} />
//             <Text style={styles.loadingText}>Searching...</Text>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: "absolute",
//     top: 20,
//     left: 0,
//     right: 0,
//     zIndex: 1000,
//     backgroundColor: "transparent",
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: pallette.white,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     shadowColor: pallette.black,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 5,
//     marginHorizontal: width * 0.04,
//     marginTop: height * 0.05,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: adjust(16),
//     color: pallette.black,
//     fontFamily: regular,
//     padding: 2,
//   },
//   searchButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//   },
//   searchButtonText: {
//     color: pallette.primary,
//     fontFamily: bold,
//     fontSize: adjust(14),
//   },
//   clearButton: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 8,
//     marginLeft: 4,
//   },
//   clearText: {
//     fontSize: 16,
//     color: pallette.red,
//     fontFamily: bold,
//   },
//   dropdown: {
//     position: 'absolute',
//     top: 400,
//     left: width * 0.04,
//     right: width * 0.04,
//     // backgroundColor: '#fff',
//     // borderRadius: 8,
//     // zIndex: 1001,
//     // elevation: 10,
//     overflow: 'hidden',
//   },
//   predictionsDropdown: {
//     position: 'absolute',
//     top: 100,
//     left: width * 0.04,
//     right: width * 0.04,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     maxHeight: height * 0.4,
//     zIndex: 1002,
//     elevation: 10,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#eee',
//   },
//   predictionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   predictionText: {
//     marginLeft: 12,
//     fontSize: adjust(14),
//     color: '#333',
//     flex: 1,
//   },
//   loadingContainer: {
//     padding: 24,
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: adjust(14),
//     color: pallette.grey,
//     fontFamily: medium,
//   },
// });

// export default SearchComponent;
