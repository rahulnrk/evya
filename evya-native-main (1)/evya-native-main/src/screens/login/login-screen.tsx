import React, {useContext, useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import RootScroll from '../../components/scroll-view';
import {h, ID, w} from '../../constants/dimensions';
import Header from './header';
import Logo from '../../helpers/logo';
import {adjust, nav, storeValue} from '../../helpers/common-functions';
import {pallette} from '../../utils/pallette';
import {semibold, regular, medium} from '../../utils/fonts';
import {AppContext} from '../../contexts/app-context';
import strings from '../../utils/strings';
import Toast from 'react-native-toast-message';
import { 
  sendOtp, 
  verifyOtp, 
  setMobileNumber, 
  setTimer, 
  clearError, 
  resetAuthState, 
  getUserDetails 
} from '../../redux/AuthSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NeedHelpPopup from '../../extra/NeedHelpScreen';
import StationsService from '../../axios/Apis';


// Define RootState type based on your store structure
interface RootState {
  auth: {
    mobileNumber: string;
    timer: number;
    loading: boolean;
    otpSent: boolean;
    otpVerified: boolean;
    userId: string | null;
    error: string | null;
    user: any;
  };
}

interface LoginProps {
  navigation: any;
}

const Login: React.FC<LoginProps> = ({navigation, route}) => {
  // Context for authentication
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('Login must be used within AppProvider');
  }
  const { login } = context;

  // Redux state and dispatch
  const dispatch = useDispatch();
  const { 
    mobileNumber,
    timer, 
    loading, 
    otpSent, 
    otpVerified, 
    userId,
    error,
    user 
  } = useSelector((state: RootState) => state.auth);

  // Local state management
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputs = useRef<TextInput[]>([]);
  const [active, setActive] = useState<number>(0);
  const [mobile, setMobile] = useState<string>('');
  const [disabled, setDisabled] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [otpErrorMsg, setOtpErrorMsg] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
const [showHelp,setShowHelp]= useState(false);
 const [terms,setTerms]=useState(false);
  // Derived loading states
  const loadingOtp = loading && !otpSent;
  const loadingVerify = loading && otpSent;
  const { mobile: routeMobile, skipToOtp } = route?.params || {};
  useEffect(() => {
    if (routeMobile && !mobile) {
      const formattedMobile = `+91 ${routeMobile}`;
      setMobile(formattedMobile);
      
      // Auto-send OTP if skipToOtp flag is set
      if (skipToOtp) {
        const phoneNo = routeMobile.replace(/\D/g, '').slice(-10);
        dispatch(sendOtp(phoneNo));
        dispatch(setMobileNumber(phoneNo));
      }
    }
  }, [routeMobile, skipToOtp]);

  /**
   * Handles successful OTP verification and user login
   */
  useEffect(() => {
    const handleLoginAfterOtp = async () => {
      if (otpVerified && userId) {
        try {
          setVerifying(true);
          
          // STATE-1: Redux owns session (redux-persist); no direct AsyncStorage ID write
          const userIdString = userId.toString();
          const loginSuccess = await login(userIdString);
          
          if (loginSuccess) {
            // Fetch user details to check if they have vehicles
            const userDetails = await dispatch(getUserDetails(userId)).unwrap();
            
            Toast.show({
              type: 'success',
              text1: 'Login Successful',
              text2: 'You have successfully logged in.',
            });

            setTimeout(() => {
              // Check if user has any vehicles
              if (userDetails?.vehicles && userDetails.vehicles.length > 0) {
                // Existing user with vehicles - go to home
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: strings.app,
                      key: `home-${Date.now()}`,
                    },
                  ],
                });
              } else {
                //                 navigation.navigate(strings.addvehicle, {
                //   from: 'login'
                // });

                // New user or user with no vehicles - go to Add Vehicle screen
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: strings.addvehicle,
                      params: { 
                        from: 'login',
                        newUser: true
                      },
                    },
                  ],
                });
              }
            }, 500);
          }
        } catch (err) {
          console.log('Login after OTP error:', err);
          Toast.show({
            type: 'error',
            text1: 'Login Error',
            text2: 'An error occurred during login.',
          });
        } finally {
          setVerifying(false);
        }
      }
    };

    handleLoginAfterOtp();
  }, [otpVerified, userId, login, navigation, dispatch]);

  /**
   * Updates active screen when OTP is sent
   */
  useEffect(() => {
    if (otpSent || skipToOtp) {
      setActive(1);
    }
  }, [otpSent, skipToOtp]);

  /**
   * Handles authentication errors from Redux
   */
  useEffect(() => {
    if (error) {
      console.log('Auth error:', error);
      
      // Extract error code from error string
      const errorCodeMatch = error.match(/errorCode[:\s]*(\d+)/i) || error.match(/(\d+)/);
      const errorCode = errorCodeMatch ? errorCodeMatch[1] : null;
      
      if (errorCode === '1306' || error.includes('Invalid mobile number') || error.includes('not registered')) {
        Toast.show({
          type: 'error',
          text1: 'User not registered',
          text2: 'Please register first.',
        });
        setTimeout(() => {
          const phoneForRegistration = mobileNumber || mobile.replace(/\D/g, '').slice(-10);
          nav(navigation, strings.profile, { 
            from: 'registration', 
            mobile: phoneForRegistration 
          });
        }, 500);
      } else if (error.includes('Invalid OTP') || error.includes('incorrect')) {
        Toast.show({
          type: 'error',
          text1: 'Invalid OTP',
          text2: 'Please enter the correct OTP.',
        });
        // Clear OTP fields
        setOtp(Array(6).fill(''));
        // Focus first input
        setTimeout(() => inputs.current[0]?.focus(), 100);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error,
        });
      }
      dispatch(clearError());
    }
  }, [error, dispatch, navigation, mobile, mobileNumber]);

  /**
   * Timer countdown for OTP resend
   */
  useEffect(() => {
    if (timer > 0 && otpSent) {
      const interval = setInterval(() => {
        dispatch(setTimer(timer - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, otpSent, dispatch]);

  /**
   * Handles OTP input changes and auto-focus
   */
  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpErrorMsg('');

    if (value && index < newOtp.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  /**
   * Handles backspace navigation in OTP fields
   */
  const handleBackspacePress = (index: number) => {
    if (!otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  /**
   * Validates and sends OTP to the provided mobile number
   */
  const handleGetOtp = async () => {
    const phoneNo = mobile.replace(/\D/g, '').slice(-10);

    if (phoneNo.length !== 10 || !/^\d+$/.test(phoneNo)) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    
    setErrorMsg('');
    
    try {
      console.log('Sending OTP for:', phoneNo);
      const result = await dispatch(sendOtp(phoneNo)).unwrap();
      console.log('OTP sent successfully:', result);
      dispatch(setMobileNumber(phoneNo));
    } catch (error) {
      console.log('Send OTP error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to send OTP',
        text2: 'Please try again.'
      });
    }
  };

  /**
   * Verifies the entered OTP
   */
  const handleVerifyOtp = async () => {
    const isOtpComplete = otp.every(digit => digit !== '');
    const otpValue = otp.join('');
    const phoneNo = (mobileNumber || mobile).replace(/\D/g, '').slice(-10);

    if (!isOtpComplete) {
      setOtpErrorMsg('Please enter all 6 digits of the OTP');
      return;
    }

    if (otpValue.length !== 6) {
      setOtpErrorMsg('OTP must be 6 digits');
      return;
    }

    if (phoneNo.length !== 10) {
      setOtpErrorMsg('Phone number missing — go back and re-enter');
      return;
    }

    setOtpErrorMsg('');
    dispatch(verifyOtp({ phoneNo, otp: otpValue }));
  };

  /**
   * Resends OTP if timer has expired
   */
  const handleResendOtp = () => {
    if (timer === 0) {
      const phoneNo = mobileNumber || mobile.replace(/\D/g, '').slice(-10);
      if (phoneNo.length === 10) {
        dispatch(sendOtp(phoneNo));
      }
    }
  };

  /**
   * Handles back navigation and state reset
   */
  const handleBackPress = () => {
    if (active === 1) {
      setActive(0);
      setOtp(Array(6).fill(''));
      setOtpErrorMsg('');
      dispatch(resetAuthState());
    } else {
      navigation.goBack();
    }
  };
  const handleCreateTicket = async (data: any) => {
  console.log("Sending ticket:", data);

  try {
    // BUG-7: pre-login tickets carry phone so support can trace (userId may not exist yet)
    const phone = (mobileNumber || mobile || '').replace(/\D/g, '').slice(-10);
    await StationsService.createTicket({
      ...data,
      type: "Ticket",
      userId: userId || 0,
      mobileNumber: phone || data?.mobileNumber,
      comment: [data?.comment, phone ? `Phone: ${phone}` : null].filter(Boolean).join(' | '),
      status: "Open",
      orgId: 1,
      priority: "High",
    });

    Toast.show({
      type: "success",
      text1: "Ticket Created Successfully",
    });

  } catch (error) {
    console.log("Ticket error", error);

    Toast.show({
      type: "error",
      text1: "Failed to create ticket"
    });
  }

  setShowHelp(false);
};

  return (
    <RootScroll>
      <View style={styles.container}>
        <Header active={active} onback={handleBackPress} />
        
        <View style={styles.logoContainer}>
          <Logo type="H" style={styles.logo} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>
            {active < 1 ? 'Login' : 'OTP Verification'}
          </Text>
        </View>

        {active < 1 ? (
          // Phone Number Input Screen
          <View>
            <Text style={styles.labelText}>Phone Number</Text>
            <TextInput
              placeholder={'+91 Enter Phone Number'}
              placeholderTextColor={pallette.grey}
              style={styles.mobileInput}
              maxLength={14}
              value={mobile}
              keyboardType="phone-pad"
              onChangeText={val => {
                // Format mobile number with +91 prefix
                let formattedVal = val;
                if (val.length <= 3) {
                  formattedVal = '+91 ';
                } else if (!val.startsWith('+91 ')) {
                  formattedVal = '+91 ' + val.replace(/\D/g, '');
                }
                
                setMobile(formattedVal);
                setErrorMsg('');
                const onlyDigits = formattedVal.replace(/\D/g, '');
                setDisabled(onlyDigits.length !== 12); // +91 + 10 digits = 12
              }}
            />
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}



<View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
  
  <TouchableOpacity
  onPress={() => setTerms(!terms)}
  style={styles.terms}
>
  {terms && <View style={{ width: 12, height: 12, backgroundColor: pallette.primary,borderRadius:30}} />}
</TouchableOpacity>
  <Text style={styles.acceptanceText} numberOfLines={1}>
    {" "}By continuing, I accept{" "}
    
    <Text
      style={styles.linkText}
      onPress={() => navigation.navigate(strings.privacypolicy)}
    >
      Terms of Service and Privacy Policy
    </Text>
  </Text>

</View>
            <TouchableOpacity
              onPress={handleGetOtp}
              disabled={disabled || loadingOtp||!terms}
              style={[
                styles.otpButton,
                {
                  backgroundColor:
                    disabled || loadingOtp
                      ? pallette.mediumgrey
                      : pallette.primary,
                },
              ]}>
              {loadingOtp  ? (
                <ActivityIndicator color={pallette.white} size="small" />
              ): !terms?(<Text style={styles.otpButtonText}>Accept Terms of Service and Privacy Policy</Text>): (
                <Text style={styles.otpButtonText}>Get OTP</Text>
              )}
            </TouchableOpacity>
            
           
          </View>
        ) : (
          // OTP Verification Screen
          <View>
            <Text style={styles.otpSentText}>
              A verification OTP has been sent to +91 {mobileNumber || mobile.replace(/\D/g, '').slice(-10)}
            </Text>
            
            <View style={styles.row}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.box,
                    {
                      borderWidth: otp[index] ? 1 : 0,
                      borderColor: otpErrorMsg ? 'red' : pallette.primary,
                      backgroundColor: otpErrorMsg ? '#FFE6E6' : pallette.lightgrey,
                    },
                  ]}
                  maxLength={1}
                  keyboardType="numeric"
                  onChangeText={value => {
                    setOtpErrorMsg('');
                    // Only allow numbers
                    if (/^\d?$/.test(value)) {
                      handleOtpChange(value, index);
                    }
                  }}
                  value={digit}
                  ref={input => {
                    if (input) {
                      inputs.current[index] = input;
                    }
                  }}
                  onSubmitEditing={
                    index === otp.length - 1 ? handleVerifyOtp : undefined
                  }
                  onKeyPress={({nativeEvent: {key}}) =>
                    key === 'Backspace' && handleBackspacePress(index)
                  }
                />
              ))}
            </View>
            
            {otpErrorMsg ? (
              <Text style={styles.errorText}>{otpErrorMsg}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={loadingVerify || otp.join('').length !== 4}
              style={[
                styles.otpButton, 
                {
                  backgroundColor: (loadingVerify || otp.join('').length !== 4) 
                    ? pallette.mediumgrey 
                    : pallette.primary
                }
              ]}>
              {loadingVerify ? (
                <ActivityIndicator color={pallette.white} size="small" />
              ) : (
                <Text style={styles.otpButtonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.otpSentText}>
  Didn't receive OTP?{" "}

  {timer > 0 ? (
    <Text>
      You can resend in{" "}
      <Text style={{ color: pallette.primary }}>
        {timer}s
      </Text>
    </Text>
  ) : (
    <>
      <Text
        style={styles.linkText}
        onPress={handleResendOtp}
      >
        Resend OTP
      </Text>

      <Text style={{ color: pallette.grey }}> | </Text>

      <Text
        style={styles.linkText}
        onPress={() => setShowHelp(true)}
      >
        Help
      </Text>
    </>
  )}
</Text>
            
          </View>
        )}
      </View>
      <Toast position="top" visibilityTime={3000} />
     {/* vishal added */}
   <NeedHelpPopup
  visible={showHelp}
  onClose={() => setShowHelp(false)}
  onSubmit={handleCreateTicket}
/>
    </RootScroll>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: w * 0.04,
  },
  logoContainer: {
    height: h * 0.075,
    width: '100%',
  },
  logo: {
    height: '90%',
    width: '40%',
    resizeMode: 'contain',
  },
  textContainer: {
    width: '100%',
    marginTop: h * 0.05,
  },
  mainText: {
    fontSize: adjust(30),
    color: pallette.black,
    fontFamily: semibold,
  },
  labelText: {
    color: pallette.black,
    fontSize: adjust(14),
    fontFamily: semibold,
    marginTop: h * 0.03,
  },
  mobileInput: {
    height: h * 0.07,
    paddingVertical: h * 0.01,
    paddingHorizontal: w * 0.04,
    borderRadius: w * 0.04,
    color: pallette.black,
    fontSize: adjust(14),
    fontFamily: regular,
    marginVertical: h * 0.02,
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
  acceptanceText: {
    color: pallette.grey,
    fontSize: adjust(11),
    fontFamily: regular,
    marginVertical: h * 0.02,
    marginRight:h*0.04,
  },
  otpSentText: {
    color: pallette.black,
    fontSize: adjust(14),
    fontFamily: regular,
    marginTop: h * 0.03,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: h * 0.02,
  },
  box: {
    borderColor: pallette.primary,
    width: w * 0.2,
    textAlign: 'center',
    borderRadius: h * 0.015,
    backgroundColor: pallette.lightgrey,
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: medium,
    padding: h * 0.02,
  },
  errorText: {
    color: 'red',
    fontSize: adjust(12),
    marginTop: h * 0.005,
    fontFamily: regular,
  },
  linkText: {
  color: pallette.primary,
  textDecorationLine: 'underline',
  fontFamily: semibold,
},
terms:{
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: pallette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius:30,
  }
});