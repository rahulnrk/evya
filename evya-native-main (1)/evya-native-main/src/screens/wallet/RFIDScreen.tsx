import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput
} from 'react-native';
import Toast from 'react-native-toast-message';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import StationsService from '../../axios/Apis';
import {pallette, regular, bold} from '../../utils/pallette';
import Header from '../../components/header-with-skip';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RFIDScreen = () => {

  const navigation = useNavigation();
  const {user, address: addresses} = useSelector((state:any) => state.auth);

  const [useDefaultAddress, setUseDefaultAddress] = useState(true);

  const [userDetails, setUserDetails] = useState({
    username:'',
    email:'',
    mobile:'',
    address:'',
    rfidCount:'1'
  });

  // ✅ FORM VALIDATION
  const isFormValid = () => {
    return (
      userDetails.username?.trim() !== '' &&
      userDetails.email?.trim() !== '' &&
      userDetails.mobile?.trim() !== '' &&
      userDetails.address?.trim() !== '' &&
      userDetails.rfidCount?.trim() !== ''
    );
  };

  // 🔹 RFID Request API
  const handleRequestRFID = async () => {

    try {

      const payload = {
        firstName: userDetails.username,
        lastName: "",
        mobile: userDetails.mobile,
        email: userDetails.email,
        rfidCount: Number(userDetails.rfidCount),
        orgId: 1,
        address: userDetails.address,
        orderId: ""
      };

      const response = await StationsService.requestRFID(user?.id, payload);

      if (response.success || response.status === "success") {

        Toast.show({
          type: 'success',
          text1: 'RFID request submitted successfully!'
        });

        setTimeout(() => {
          navigation.goBack();
        }, 1200);

      } else {
        throw new Error(response.message || "RFID request failed");
      }

    } catch (error) {

      Toast.show({
        type: 'error',
        text1: 'Failed to request RFID. Please try again.'
      });

    }

  };

  useEffect(() => {

    let fullAddress = '';

    if (useDefaultAddress && addresses && addresses.length > 0) {

      const addr = addresses.find((a:any) => a.isDefault) || addresses[0];

      fullAddress =
        (addr.address || '') + ', ' +
        (addr.city || '') + ', ' +
        (addr.state || '') + ', ' +
        (addr.country || '') + ' - ' +
        (addr.zipCode || '');

    }

    if (user) {
      setUserDetails({
        username: user.username || '',
        email: user.email || '',
        mobile: user.mobileNumber || '',
        address: fullAddress,
        rfidCount: '1'
      });
    }

  }, [user, addresses, useDefaultAddress]);

  return (

    <View style={styles.container}>
      {/* <StatusBar barStyle="dark-content" backgroundColor={pallette.white}/> */}

      <Header 
        title={'Request RFID'}
         onback={() => navigation.goBack()}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
      />

      <View style={styles.content}>

        <Text style={styles.label}>User Name</Text>
        <TextInput
          style={styles.box}
          value={userDetails.username}
          onChangeText={(text)=>
            setUserDetails({...userDetails, username:text})
          }
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.box}
          value={userDetails.email}
          onChangeText={(text)=>
            setUserDetails({...userDetails, email:text})
          }
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.box}
          keyboardType="numeric"
          value={userDetails.mobile}
          onChangeText={(text)=>
            setUserDetails({...userDetails, mobile:text})
          }
        />

        {/* Default Address Checkbox */}

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={()=>{
            const value = !useDefaultAddress;
            setUseDefaultAddress(value);

            if(!value){
              setUserDetails({...userDetails,address:''});
            }
          }}
        >

          <View style={styles.checkbox}>
            {useDefaultAddress && (
              <Ionicons name="checkmark" size={12} color={pallette.primary}/>
            )}
          </View>

          <Text style={styles.checkboxText}>Default Address</Text>

        </TouchableOpacity>

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.box}
          value={userDetails.address}
          onChangeText={(text)=>
            setUserDetails({...userDetails, address:text})
          }
        />

        <Text style={styles.label}>Number of RFID Cards</Text>
        <TextInput
          style={styles.box}
          keyboardType="numeric"
          value={userDetails.rfidCount}
          onChangeText={(text)=>
            setUserDetails({...userDetails, rfidCount:text})
          }
        />

        {/* BUTTON */}

        <TouchableOpacity
          style={[
            styles.button,
            {backgroundColor: isFormValid() ? pallette.primary : '#ccc'}
          ]}
          disabled={!isFormValid()}
          onPress={handleRequestRFID}
        >
          <Text style={styles.buttonText}>Request RFID Card</Text>
        </TouchableOpacity>

      </View>

      <Toast position="top" visibilityTime={3000} />

    </View>
  );
};

const styles = StyleSheet.create({

   container: { 
      flex: 1, 
      backgroundColor: pallette.white,
      marginTop: 25,
    },

  content:{
    padding:20
  },

  label:{
    fontSize:14,
    color:pallette.grey,
    marginTop:20,
    fontFamily:regular
  },

  box:{
    backgroundColor:pallette.lightgrey,
    padding:15,
    borderRadius:10,
    marginTop:8,
    fontSize:16,
    fontFamily:bold,
    color:pallette.black
  },

  checkboxRow:{
    flexDirection:'row',
    alignItems:'center',
    marginTop:20
  },

  checkbox:{
    width:16,
    height:16,
    borderRadius:3,
    borderWidth:1,
    borderColor:pallette.grey,
    justifyContent:'center',
    alignItems:'center',
    marginRight:8,
    backgroundColor:pallette.white
  },

  checkboxText:{
    fontSize:13,
    fontFamily:regular,
    color:pallette.black 
  },

  button:{
    marginTop:40,
    padding:16,
    borderRadius:12,
    alignItems:"center",
    backgroundColor: pallette.primary
  },

  buttonText:{
    color:pallette.white,
    fontSize:18,
    fontFamily:bold
  }

});

export default RFIDScreen;