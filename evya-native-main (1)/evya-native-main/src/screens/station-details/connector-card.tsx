// import React from "react";
// import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
// import { h, w } from "../../constants/dimensions";
// import { pallette } from "../../utils/pallette";

// interface ConnectorCardProps {
//   slot: string;
//   status: string;
//   price: string;
//   power: string;
//   selected: any;
//   onPress: () => void; // ✅ new
// }

// const ConnectorCard: React.FC<ConnectorCardProps> = ({
//   slot,
//   status,
//   price,
//   power,
//   selected,
//   onPress,
// }) => {
//   return (
//     <TouchableOpacity
//   onPress={onPress}
//   activeOpacity={0.8}
//   disabled={status !== "Available"} // ✅ disable press if not available
//   style={[
//     styles.card,
//     selected?.slot === slot && { borderWidth: 2, borderColor: pallette.primary },
//     status !== "Available" && { opacity: 0.6 }, // ✅ dim non-available
//   ]}
// >
//   <View
//     style={[
//       styles.header,
//       {
//         backgroundColor:
//           selected?.slot === slot
//             ? "green"
//             : status === "Available"
//             ? pallette.primary
//             : status === "Inactive"
//             ? pallette.grey
//             : pallette.gold,
//       },
//     ]}
//   >
//     <Text style={styles.slot}>
//       {/* {`Port ${slot}`} {selected?.slot === `Port ${slot}` && `• Selected`} */}
//     </Text>
//     <Text style={styles.status}>{status}</Text>
//   </View>

//   <View style={styles.content}>
//     <View style={styles.column}>
//       <Image
//         source={require("../../assets/images/chargers/c1.png")}
//         style={styles.icon}
//       />
//       <Text style={styles.boldText}>CCS2</Text>
//     </View>
//     <View style={styles.column}>
//       <Text style={styles.label}>Price</Text>
//       <Text style={styles.boldText}>{price}</Text>
//     </View>
//     <View style={styles.column}>
//       <Text style={styles.label}>Level 1 (AC)</Text>
//       <Text style={styles.boldText}>{power}</Text>
//     </View>
//   </View>
// </TouchableOpacity>

//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     borderRadius: 10,
//     overflow: "hidden",
//     shadowColor: pallette.black,
//     shadowOpacity: 0.1,
//     shadowRadius: 5,
//     margin: 10,
//     backgroundColor: pallette.white,
//   },
//   header: {
//     padding: 10,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderTopLeftRadius: 10,
//     borderTopRightRadius: 10,
//   },
//   slot: {
//     color: pallette.white,
//     fontWeight: "bold",
//   },
//   status: {
//     color: pallette.white,
//     fontWeight: "bold",
//   },
//   content: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     padding: 15,
//     backgroundColor: pallette.lightgrey,
//     borderRadius: 10,
//   },
//   column: {
//     height: h * 0.05,
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   label: {
//     color: "gray",
//     fontSize: 12,
//   },
//   boldText: {
//     fontWeight: "bold",
//     fontSize: 16,
//   },
//   icon: {
//     width: w * 0.04,
//     height: w * 0.05,
//     marginBottom: 5,
//   },
// });

// export default ConnectorCard;