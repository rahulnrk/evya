import React, {ReactNode, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {adjust} from '../../helpers/common-functions';
import {regular, semibold} from '../../utils/fonts';
import {h, w} from '../../constants/dimensions';
import {pallette} from '../../utils/pallette';
import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import Toast from 'react-native-toast-message';
import StationsService from '../../axios/Apis';
import {useAuth} from '../../hooks/useAuth';
import {getUserDetails} from '../../redux/AuthSlice';
import AlertMessage from '../../extra/alertmessage';

const AddressScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {address: addresses} = useSelector((state: any) => state.auth);
  // STATE-1: auth from Redux
  const {userId} = useAuth();

  // Mode & form state
  const [existingAddress, setExistingAddress] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMode, setCurrentMode] = useState<'list' | 'form'>('list');

  // Address input states
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [userState, setUserState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [addressName, setAddressName] = useState('Home');
  const [loading, setLoading] = useState(false);
  const [alertComponent, setAlertComponent] = useState<ReactNode>(null);
  /**
   * Populate form when editing an address
   */
  useEffect(() => {
    if (existingAddress && currentMode === 'form') {
      setAddress(existingAddress.address || '');
      setCity(existingAddress.city || '');
      setUserState(existingAddress.state || '');
      setCountry(existingAddress.country || 'India');
      setPincode(existingAddress.zipCode || existingAddress.pincode || '');
      setAddressName(existingAddress.addressName || 'Home');
    } else if (currentMode === 'form' && !isEditMode) {
      resetForm();
    }
  }, [existingAddress, currentMode, isEditMode]);

  /**
   * Reset address form fields
   */
  const resetForm = () => {
    setAddress('');
    setCity('');
    setUserState('');
    setCountry('India');
    setPincode('');
    setAddressName('Home');
  };

  /**
   * Validate address fields
   */
  const validateAddress = () => {
    if (!address.trim()) return 'Please enter your address';
    if (!city.trim()) return 'Please enter your city';
    if (!userState.trim()) return 'Please enter your state';
    if (!country.trim()) return 'Please enter your country';
    if (!pincode || pincode.length !== 6)
      return 'Please enter a valid 6-digit pincode';
    return null;
  };

  /**
   * Refresh user details after CRUD operation
   */
  const refreshUserData = async () => {
    dispatch(getUserDetails(userId));
  };

  /**
   * Add a new address
   */
  const handleAddAddress = async () => {
    const validationError = validateAddress();
    if (validationError) {
      Toast.show({type: 'error', text1: validationError});
      return;
    }

    setLoading(true);
    try {
      const data = {
        userId,
        address: address.trim(),
        city: city.trim(),
        state: userState.trim(),
        country: country.trim(),
        zipCode: pincode,
        addressName,
      };

      const response = await StationsService.addAddress(userId, data);
      if (response.success || response.status === 'success') {
        Toast.show({type: 'success', text1: 'Address saved successfully!'});
        await refreshUserData();
        setTimeout(() => {
          setCurrentMode('list');
          resetForm();
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to save address');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1:
          error.response?.data?.message ||
          error.message ||
          'Failed to save address. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing address
   */
  const handleUpdateAddress = async () => {
    const validationError = validateAddress();
    if (validationError) {
      Toast.show({type: 'error', text1: validationError});
      return;
    }

    setLoading(true);
    try {
      const data = {
        userId,
        id: existingAddress.id,
        address: address.trim(),
        city: city.trim(),
        state: userState.trim(),
        country: country.trim(),
        zipCode: pincode,
        addressName,
      };

      const response = await StationsService.updateUserDetails(data);
      if (response.success || response.status === 'success') {
        Toast.show({type: 'success', text1: 'Address updated successfully!'});
        await refreshUserData();
        setTimeout(() => {
          setCurrentMode('list');
          setExistingAddress(null);
          setIsEditMode(false);
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to update address');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1:
          error.response?.data?.message ||
          error.message ||
          'Failed to update address. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save button handler — adds or updates address
   */
  const handleSaveAddress = () => {
    if (isEditMode && existingAddress?.id) handleUpdateAddress();
    else handleAddAddress();
  };

  /**
   * Confirm address deletion
   */
/**
 * Confirm address deletion
 */
const handleDeleteAddress = (id: number) => {
  setAlertComponent(
    <AlertMessage
      message="Are you sure you want to delete this?"
      showConfirm={true}
      onClose={async (confirmed: boolean) => {
        setAlertComponent(null);
        if (!confirmed) return;
        try {
          setLoading(true);
          
          const response = await StationsService.deleteAddress(id);
          console.log(response);
          if (response.status==200) {
            Toast.show({type: 'success', text1: 'Address deleted successfully!'});
            await refreshUserData();
          } else {
            throw new Error(response.message || 'Failed to delete address');
          }
        } catch {
          Toast.show({
            type: 'error',
            text1: 'Failed to delete address. Please try again.',
          });
        } finally {
          setLoading(false);
        }
      }}
    />
  );
};
  
  /**
   * Edit address setup
   */
  const handleEditAddress = (item: any) => {
    setExistingAddress(item);
    setIsEditMode(true);
    setCurrentMode('form');
  };

  /**
   * Initialize form for adding new address
   */
  const handleAddNewAddress = () => {
    setExistingAddress(null);
    setIsEditMode(false);
    resetForm();
    setCurrentMode('form');
  };

  /**
   * Render each saved address card
   */
  const renderAddressItem = ({item}: any) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressType}>{item.addressName || 'Home'}</Text>
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditAddress(item)}>
            {/* <Text style={styles.editButtonText}>Edit</Text> */}
          </TouchableOpacity>
                    <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {handleDeleteAddress(item.id),console.log(item)}}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.addressText}>{item.address}</Text>
      <View style={styles.addressDetails}>
        <Text style={styles.addressDetail}>
          {[item.city, item.state, item.country].filter(Boolean).join(', ')}
        </Text>
        {item.zipCode && (
          <Text style={styles.addressDetail}>Pincode: {item.zipCode}</Text>
        )}
      </View>
    </View>
  );

  /**
   * Empty state when no addresses are found
   */
  const renderEmptyAddresses = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No addresses saved yet</Text>
      <Text style={styles.emptySubText}>
        Add your first address to get started
      </Text>
    </View>
  );

  /**
   * Render address form UI
   */
  const renderForm = () => (
    <View style={styles.container}>
      {/* Address Type Selection */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Address Type</Text>
        <View style={styles.addressTypeContainer}>
          {['Home', 'Work'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.addressTypeButton,
                addressName === type && styles.addressTypeButtonActive,
              ]}
              onPress={() => setAddressName(type)}>
              <Text
                style={[
                  styles.addressTypeText,
                  addressName === type && styles.addressTypeTextActive,
                ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Address Fields */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Complete Address</Text>
        <TextInput
          placeholder="Enter your complete address"
          placeholderTextColor={pallette.grey}
          style={[styles.input, styles.multilineInput]}
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.flex1, styles.rightMargin]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            placeholder="Enter city"
            placeholderTextColor={pallette.grey}
            style={styles.input}
            value={city}
            onChangeText={setCity}
          />
        </View>
        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            placeholder="Enter state"
            placeholderTextColor={pallette.grey}
            style={styles.input}
            value={userState}
            onChangeText={setUserState}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.flex1, styles.rightMargin]}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            placeholder="Enter country"
            placeholderTextColor={pallette.grey}
            style={styles.input}
            value={country}
            onChangeText={setCountry}
          />
        </View>
        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>Pincode</Text>
          <TextInput
            placeholder="6-digit pincode"
            placeholderTextColor={pallette.grey}
            style={styles.input}
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSaveAddress}
        disabled={loading}
        style={[styles.saveButton, loading && styles.disabledButton]}>
        {loading ? (
          <ActivityIndicator color={pallette.white} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditMode ? 'Update Address' : 'Save Address'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Back Button
      <TouchableOpacity
        onPress={() => {
          setCurrentMode('list');
          setExistingAddress(null);
          setIsEditMode(false);
        }}
        style={styles.backButton}>
        <Text style={styles.backButtonText}>Back to Address List</Text>
      </TouchableOpacity> */}
    </View>
  );

  /**
   * Render saved addresses list
   */
  const renderList = () => (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.title}></Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewAddress}>
          <Text style={styles.addButtonText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        ListEmptyComponent={renderEmptyAddresses}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );

  return (
    <RootScroll>
      <Header
        onback={() => {
          if (currentMode === 'form') {
            setCurrentMode('list');
            setExistingAddress(null);
            setIsEditMode(false);
          } else {
            navigation.goBack();
          }
        }}
        active={1}
        hastitle
        skippable={false}
        title={
          currentMode === 'list'
            ? 'My Addresses'
            : isEditMode
            ? 'Edit Address'
            : 'Add Address'
        }
      />
      {currentMode === 'list' ? renderList() : renderForm()}
      {alertComponent}
      <Toast position="top" visibilityTime={3000} />
    </RootScroll>
  );
};

/* ======================= STYLES ======================= */
const styles = StyleSheet.create({
  container: {flex: 1,paddingHorizontal:20,  backgroundColor: pallette.white},
  title: {
    fontSize: adjust(24),
    color: pallette.black,
    fontFamily: semibold,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {marginVertical: h * 0.015},
  label: {
    color: pallette.black,
    fontSize: adjust(12),
    fontFamily: semibold,
    marginBottom: 5,
  },
  input: {
    height: h * 0.06,
    borderRadius: w * 0.04,
    paddingHorizontal: w * 0.04,
    color: pallette.black,
    fontSize: adjust(14),
    fontFamily: regular,
    borderWidth: 1,
    borderColor: pallette.lightgrey,
    backgroundColor: pallette.lightgrey,
  },
  multilineInput: {height: h * 0.12, textAlignVertical: 'top'},
  saveButton: {
    height: h * 0.065,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: w * 0.04,
    marginVertical: h * 0.02,
    backgroundColor: pallette.primary,
  },
  disabledButton: {backgroundColor: pallette.grey, opacity: 0.6},
  saveButtonText: {
    color: pallette.white,
    fontSize: adjust(12),
    fontFamily: regular,
  },
  backButton: {
    height: h * 0.065,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: w * 0.04,
    marginVertical: h * 0.01,
    backgroundColor: pallette.mediumgrey,
  },
  backButtonText: {
    color: pallette.black,
    fontSize: adjust(12),
    fontFamily: regular,
  },
  row: {flexDirection: 'row', justifyContent: 'space-between'},
  flex1: {flex: 1},
  rightMargin: {marginRight: 10},
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: pallette.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: pallette.white,
    fontSize: adjust(12),
    fontFamily: semibold,
  },
  listContainer: {paddingBottom: 20},
  addressCard: {
    backgroundColor: pallette.white,
    borderWidth: 1,
    borderColor: pallette.lightgrey,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  addressHeader: {flexDirection: 'row', justifyContent: 'space-between'},
  addressType: {fontSize: adjust(16), fontFamily: semibold, color: pallette.primary},
  addressActions: {flexDirection: 'row'},
  // editButton: {
  //   paddingHorizontal: 12,
  //   paddingVertical: 4,
  //   backgroundColor: pallette.primary + '20',
  //   borderRadius: 6,
  //   marginRight: 8,
  // },
  // editButtonText: {
  //   color: pallette.primary,
  //   fontSize: adjust(12),
  //   fontFamily: regular,
  // },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: pallette.red,

    borderRadius: 6,
  },
  deleteButtonText: {
    color: pallette.white,
    fontSize: adjust(12),
    fontFamily: regular,
  },
  addressText: {
    fontSize: adjust(14),
    fontFamily: regular,
    color: pallette.black,
    marginVertical: 6,
    lineHeight: 20,
  },
  addressDetails: {
    borderTopWidth: 1,
    borderTopColor: pallette.lightgrey,
    paddingTop: 8,
  },
  addressDetail: {
    fontSize: adjust(12),
    fontFamily: regular,
    color: pallette.grey,
  },
  emptyContainer: {alignItems: 'center', paddingVertical: 60},
  emptyText: {
    fontSize: adjust(16),
    fontFamily: semibold,
    color: pallette.grey,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: adjust(14),
    fontFamily: regular,
    color: pallette.grey,
    textAlign: 'center',
  },
  addressTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: pallette.lightgrey,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: pallette.white,
  },
  addressTypeButtonActive: {
    borderColor: pallette.primary,
    backgroundColor: pallette.primary + '20',
  },
  addressTypeText: {
    fontSize: adjust(14),
    fontFamily: regular,
    color: pallette.black,
  },
  addressTypeTextActive: {
    color: pallette.primary,
    fontFamily: semibold,
  },
});

export default AddressScreen;
