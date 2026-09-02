// import React from "react";
// import { View, Text, StyleSheet, Image } from "react-native";
// import Icon from "react-native-vector-icons/MaterialIcons";

// const AmenitiesAndContact: React.FC = () => {
//   return (
//     <View style={styles.container}>
//       {/* Amenities Section */}
//       <Text style={styles.sectionTitle}>Amenities</Text>
//       <View style={styles.amenitiesContainer}>
//         {amenities.map((item, index) => (
//           <View key={index} style={styles.amenityItem}>
//             <Icon name={item.icon} size={24} color="gray" />
//             <Text style={styles.amenityText}>{item.label}</Text>
//           </View>
//         ))}
//       </View>

//       {/* Contact Details Section */}
//       <Text style={styles.sectionTitle}>Contact Details</Text>
//       <Text style={styles.subTitle}>Location</Text>
//       <Text style={styles.address}>
//         Road Number 12, Indian Oil Petrol Pump Indira Nagar, Gachibowli, Hyderabad - 500033
//       </Text>
//       {/* <Image source={require("./map-placeholder.png")} style={styles.map} /> */}
//       <Text style={styles.subTitle}>Contact Details</Text>
//       <View style={styles.contactRow}>
//         <Icon name="phone" size={16} color="green" />
//         <Text style={styles.phone}>+91 9876 5432 10</Text>
//       </View>
//       <View style={styles.contactRow}>
//         <Icon name="email" size={16} color="gray" />
//         <Text style={styles.email}>gogreen_ev_charging@evya.com</Text>
//       </View>
//     </View>
//   );
// };

// const amenities = [
//   { icon: "wc", label: "Restrooms" },
//   { icon: "weekend", label: "Lounge" },
//   { icon: "wifi", label: "Wi-Fi" },
//   { icon: "store", label: "Shopping" },
//   { icon: "local-cafe", label: "Cafe" },
//   { icon: "build", label: "Mechanic" },
// ];

// const styles = StyleSheet.create({
//   container: { padding: 16, backgroundColor: "#fff" },
//   sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
//   amenitiesContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
//   amenityItem: { alignItems: "center", width: "30%", marginVertical: 10 },
//   amenityText: { fontSize: 12, color: "gray", marginTop: 4 },
//   subTitle: { fontSize: 16, fontWeight: "bold", marginTop: 20 },
//   address: { fontSize: 14, color: "gray", marginVertical: 4 },
//   map: { width: "100%", height: 150, borderRadius: 10, marginVertical: 10 },
//   contactRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
//   phone: { fontSize: 14, color: "green", marginLeft: 8 },
//   email: { fontSize: 14, color: "gray", marginLeft: 8 },
// });

// export default AmenitiesAndContact;