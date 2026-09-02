import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

import RootScroll from '../../components/scroll-view';
import Header from '../../components/header-with-skip';
import {h, w} from '../../constants/dimensions';
import {pallette} from '../../utils/pallette';
import {adjust} from '../../helpers/common-functions';
import {regular, semibold} from '../../utils/fonts';
import { registerUser, updateProfile, getUserDetails } from '../../redux/AuthSlice';
import { useAuth } from '../../hooks/useAuth';

/**
 * Input field component for form inputs
 */
interface InputProps extends TextInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onValueChange: (val: string) => void;
}

const InputField: React.FC<InputProps> = ({
  label,
  value,
  placeholder,
  onValueChange,
  ...props
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholder={placeholder || label}
      placeholderTextColor={pallette.grey}
      style={styles.input}
      value={value}
      onChangeText={onValueChange}
      {...props}
    />
  </View>
);

/**
 * Profile Screen Component
 * 
 * Handles both user registration and profile editing with form validation
 * and API integration for creating or updating user profiles.
 */
const ProfileScreen: React.FC = ({navigation, route}: any) => {
  const isEditMode = route?.params?.from === 'account';
  const { mobileNumber: routeMobileNumber } = route.params || {};
  // STATE-1: auth from Redux
  const { userId } = useAuth();
  const dispatch = useDispatch();
  
  const { loading, error, mobileNumber: reduxMobileNumber, user } = useSelector((state: any) => state.auth);

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');

  /**
   * Initialize form data based on mode (edit vs register)
   */
  useEffect(() => {
    if (isEditMode && user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      if (user.mobileNumber) {
        setMobile(`+91 ${user.mobileNumber}`);
      } else if (user.phone) {
        setMobile(`+91 ${user.phone}`);
      } else {
        setMobile('');
      }
    } else {
      const actualMobileNumber = routeMobileNumber || reduxMobileNumber;
      if (actualMobileNumber) {
        setMobile(`+91 ${actualMobileNumber}`);
      }
    }
  }, [user, routeMobileNumber, reduxMobileNumber, isEditMode]);

  /**
   * Fetch user details when in edit mode
   */
  useEffect(() => {
    if (isEditMode && userId) {
      dispatch(getUserDetails(userId));
    }
  }, [userId, isEditMode, dispatch]);

  /**
   * Show error toast when there's an error
   */
  useEffect(() => {
    if (error) {
      Toast.show({type: 'error', text1: error});
    }
  }, [error]);

  /**
   * Validate email format
   */
  const validateEmail = (email: string) => {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return emailRegex.test(email);
  };

  /**
   * Validate all form inputs
   */
  const validateInputs = () => {
    if (!username || username.length < 3) {
      return 'Please enter a valid username (min 3 characters)';
    }
    if (!email || !validateEmail(email)) {
      return 'Please enter a valid email';
    }
    if (!mobile || mobile.replace(/\D/g, '').length !== 12) {
      return 'Enter a valid 10-digit mobile number';
    }
    return null;
  };

  /**
   * Handle registration or profile update
   */
  const handleRegister = () => {
    const validationError = validateInputs();
    if (validationError) {
      Toast.show({type: 'error', text1: validationError});
      return;
    }

    const cleanMobileNumber = mobile.replace('+91', '').replace(/\s/g, '').trim();

    if (isEditMode) {
      if (!userId) {
        Toast.show({type: 'error', text1: 'User ID not available for update'});
        return;
      }

      const profileData = {
        userId: userId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: cleanMobileNumber,
      };

      dispatch(updateProfile(profileData))
        .unwrap()
        .then((response: any) => {
          dispatch(getUserDetails(userId));
          Toast.show({type: 'success', text1: 'Profile updated successfully!'});
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        })
        .catch((err: any) => {
          Toast.show({type: 'error', text1: err?.message || 'Profile update failed'});
        });
    } else {
      const registerData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: cleanMobileNumber,
        deviceDetails: {},
      };

      dispatch(registerUser(registerData))
        .unwrap()
        .then((response: any) => {
          if (response.success) {
            Toast.show({type: 'success', text1: 'Registration successful!'});

            // Navigate to Login with skipToOtp flag
            setTimeout(() => {
              navigation.navigate('Login', {
                mobile: cleanMobileNumber,
                skipToOtp: true
              });
            }, 1500);
          } else {
            throw new Error(response || 'Registration failed');
          }
        })
        .catch((err: any) => {
          Toast.show({type: 'error', text1: err || 'Registration failed. Please try again.'});
        });
    }
  };

  /**
   * Handle back button press
   */
  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <RootScroll>
      <Header
        onback={handleBackPress}
        active={1}
        onSkip={() => {}}
        skippable={false}
        hastitle={true}
        title={isEditMode ? 'Edit Profile' : 'Registration'}
      />
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <Image
            source={require('../../assets/images/account/avatar.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatar}>
            <Image
              source={require('../../assets/images/account/camera.png')}
              style={styles.cameraIcon}
            />
          </TouchableOpacity>
        </View>

        <InputField
          label="Username"
          value={username}
          onValueChange={setUsername}
          placeholder="Enter username"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <InputField
          label="Email"
          value={email}
          onValueChange={setEmail}
          keyboardType="email-address"
          placeholder="Enter email"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <InputField
          style={{color: pallette.grey, fontFamily: semibold}}
          label="Mobile"
          value={mobile}
          onValueChange={setMobile}
          placeholder="+91 Enter Phone Number"
          keyboardType="phone-pad"
          maxLength={14}
          editable={!isEditMode}
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={[
            styles.otpButton, 
            {backgroundColor: loading ? pallette.mediumgrey : pallette.primary}
          ]}>
          {loading ? (
            <ActivityIndicator color={pallette.white} size="small" />
          ) : (
            <Text style={styles.otpButtonText}>
              {isEditMode ? 'Update Profile' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <Toast position="top" visibilityTime={3000} />
    </RootScroll>
  );
};

const styles = StyleSheet.create({
  container: {padding: 20},
  title: {fontSize: adjust(30), color: pallette.black, fontFamily: semibold},
  avatarContainer: {alignItems: 'center', marginVertical: 20},
  avatar: {width: 100, height: 100, borderRadius: 50},
  editAvatar: {position: 'absolute', bottom: -(h * 0.005), left: w * 0.5},
  cameraIcon: {height: h * 0.05, width: w * 0.06, resizeMode: 'contain'},
  inputContainer: {marginVertical: h * 0.015},
  label: {
    color: pallette.black,
    fontSize: adjust(12),
    fontFamily: semibold,
    marginBottom: 5,
  },
  input: {
    height: h * 0.06,
    paddingVertical: h * 0.01,
    paddingHorizontal: w * 0.04,
    borderRadius: w * 0.04,
    color: pallette.black,
    fontSize: adjust(14),
    fontFamily: regular,
    borderColor: pallette.primary,
    backgroundColor: pallette.lightgrey,
  },
  otpButton: {
    height: h * 0.065,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: w * 0.04,
    marginVertical: h * 0.02,
  },
  otpButtonText: {
    color: pallette.white,
    fontSize: adjust(12),
    fontFamily: regular,
  },
});

export default ProfileScreen;