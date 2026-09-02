import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Header from '../../components/header-with-skip';
import { pallette } from '../../utils/pallette';

const AddFleet = ({ navigation }) => {
  const [formData, setFormData] = useState({
    orgName: '',
    contactPerson: '',
    email: '',
    phone: '',
    fleetcode:'',
    address: '',
  });

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = () => {
    console.log(formData);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        onback={handleBackPress}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title="Add Fleet"
      />

      {/* Fleet Org Name */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>Fleet Org Name</Text>
        <TextInput
          placeholder="Enter Organization Name"
          value={formData.orgName}
          onChangeText={(text) => handleChange('orgName', text)}
          style={styles.input}
        />
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.label}>Fleet Code</Text>
        <TextInput
          placeholder="Enter Organization Secret Code"
          value={formData.orgName}
          onChangeText={(text) => handleChange('fleetcode', text)}
          style={styles.input}
        />
      </View>

      {/* Point of Contact */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>Point of Contact</Text>
        <TextInput
          placeholder="Enter Contact Person Name"
          value={formData.contactPerson}
          onChangeText={(text) => handleChange('contactPerson', text)}
          style={styles.input}
        />
      </View>

      {/* Email */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter Email"
          keyboardType="email-address"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          style={styles.input}
        />
      </View>

      {/* Phone */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>Phone</Text>
        <TextInput
          placeholder="Enter Phone Number"
          keyboardType="phone-pad"
          maxLength={10}
          value={formData.phone}
          onChangeText={(text) => handleChange('phone', text)}
          style={styles.input}
        />
      </View>

      {/* Address */}
      <View style={styles.inputBox}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          placeholder="Enter Address"
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
          style={[styles.input, { height: 90 }]}
          multiline
        />
      </View>
      

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddFleet;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },

  inputBox: {
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '600',
    color: '#222',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },

  button: {
    backgroundColor: pallette.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});