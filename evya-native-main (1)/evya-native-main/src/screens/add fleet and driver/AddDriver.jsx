// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
// } from 'react-native';
// import Header from '../../components/header-with-skip';
// import { pallette } from '../../utils/pallette';

// const AddDriver = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     mobile: '',
//     address: '',
//     fleetCode: '',
//     licence: '',
//   });

//   const handleChange = (field, value) => {
//     setFormData({
//       ...formData,
//       [field]: value,
//     });
//   };

//   const handleSubmit = () => {
//     console.log(formData);
//   };

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
     
//  <Header
//         onback={''}
//         active={1}
//         onSkip={() => {}}
//         skippable={false}
//         hastitle={true}
//         title={ 'Registration'}
//       />
//       {/* Name */}
//       <View style={styles.inputBox}>
//         <Text style={styles.label}>Name</Text>
//         <TextInput
//           placeholder="Enter Name"
//           value={formData.name}
//           onChangeText={(text) => handleChange('name', text)}
//           style={styles.input}
//         />
//       </View>

//       {/* Email */}
//       <View style={styles.inputBox}>
//         <Text style={styles.label}>Email</Text>
//         <TextInput
//           placeholder="Enter Email"
//           keyboardType="email-address"
//           value={formData.email}
//           onChangeText={(text) => handleChange('email', text)}
//           style={styles.input}
//         />
//       </View>

//       {/* Mobile Number */}
//       <View style={styles.inputBox}>
//         <Text style={styles.label}>Mobile Number</Text>
//         <TextInput
//           placeholder="Enter Mobile Number"
//           keyboardType="phone-pad"
//           maxLength={10}
//           value={formData.mobile}
//           onChangeText={(text) => handleChange('mobile', text)}
//           style={styles.input}
//         />
//       </View>

//       {/* Address */}
//       <View style={styles.inputBox}>
//         <Text style={styles.label}>Address</Text>
//         <TextInput
//           placeholder="Enter Address"
//           value={formData.address}
//           onChangeText={(text) => handleChange('address', text)}
//           style={styles.input}
//         />
//       </View>

//       {/* Fleet Code */}
//       <View style={styles.inputBox}>
//         <Text style={styles.label}>Fleet Code</Text>
//         <TextInput
//           placeholder="Enter Fleet Code"
//           value={formData.fleetCode}
//           onChangeText={(text) => handleChange('fleetCode', text)}
//           style={styles.input}
//         />
//       </View>

//       {/* Licence */}
//       <View style={styles.inputBox}>
//         <Text style={styles.label}>Licence Number</Text>
//         <TextInput
//           placeholder="Enter Licence Number"
//           value={formData.licence}
//           onChangeText={(text) => handleChange('licence', text)}
//           style={styles.input}
//         />
//       </View>

//       {/* Button */}
//       <TouchableOpacity style={styles.button} onPress={handleSubmit}>
//         <Text style={styles.buttonText}>Submit</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// };

// export default AddDriver;

// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: '#fff',
//     flexGrow: 1,
//   },

//   title: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//   },

//   inputBox: {
//     marginBottom: 15,
//   },

//   label: {
//     fontSize: 14,
//     marginBottom: 6,
//     fontWeight: '600',
//   },

//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 10,
//     paddingHorizontal: 15,
//     height: 50,
//     fontSize: 15,
//   },

//   button: {
//     backgroundColor: pallette.primary,
//     padding: 15,
//     borderRadius: 10,
//     marginTop: 15,
//   },

//   buttonText: {
//     color: '#fff',
//     textAlign: 'center',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });