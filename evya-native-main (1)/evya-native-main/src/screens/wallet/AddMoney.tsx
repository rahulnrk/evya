import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { pallette, regular, bold } from '../../utils/pallette';
import Header from '../../components/header-with-skip';
import StationsService from '../../axios/Apis';
import AlertMessage from '../../extra/alertmessage';
import ErrorMessage from '../../extra/errormessages';
import { WebView } from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../hooks/useAuth';

const AddMoney = () => {
  const navigation = useNavigation();
  // STATE-1: auth from Redux
  const { userId } = useAuth();

  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [alertMessage, setAlertMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // NEW STATES
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentMerchantOrderId, setCurrentMerchantOrderId] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const presetAmounts = [500, 1000, 2000];

  const handleNumberPress = (number) => {
    setCustomAmount(prev => (prev === '0' ? number : prev + number));
    setSelectedAmount(null);
  };

  const handleBackspace = () => {
    setCustomAmount(prev => (prev.length <= 1 ? '' : prev.slice(0, -1)));
  };

  const handleClear = () => {
    setCustomAmount('');
    setSelectedAmount(null);
  };

  const getCurrentAmount = () => selectedAmount || parseInt(customAmount) || 0;

  // CORRECTED PAYMENT FUNCTION
  const handleContinue = async () => {
    const amount = getCurrentAmount();

    if (amount < 50) {
      setAlertMessage('Minimum top-up amount is ₹50');
      return;
    }

    if (amount > 100000) {
      setAlertMessage('Maximum top-up amount is ₹1,00,000');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(''); // Clear any previous errors

    // BUG-8: do not invent order id client-side — server issues it
    try {
      const response = await StationsService.createPhonePePayment({
        amount: amount * 100,
        expireAfter: 1200,
        userId: userId,
      });

      if (!response?.success || !response?.redirectUrl) {
        throw new Error('Failed to initiate payment');
      }

      const merchantOrderId = response.orderId || response.merchantOrderId;
      if (!merchantOrderId) {
        throw new Error('Server did not return a payment order id');
      }
      setCurrentMerchantOrderId(merchantOrderId);

      // OPEN WEBVIEW MODAL
      setPaymentUrl(response.redirectUrl);
      setShowWebView(true);

      // Start polling after a delay
      setTimeout(() => {
        checkPaymentStatus(merchantOrderId, amount);
      }, 2000);

    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong');
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = (merchantOrderId, amount) => {
    let attempts = 0;
    let intervalId = null;

    const checkStatus = async () => {
      attempts++;

      try {
        const statusResponse = await StationsService.checkPhonePeStatus(merchantOrderId);
        
        if (statusResponse?.state === 'COMPLETED') {
          if (intervalId) clearInterval(intervalId);
          setIsProcessing(false);
          setPaymentSuccess(true);
          
          // Don't close WebView immediately, let user see success screen
          // Wait 5 seconds on the success screen before closing and navigating
          setTimeout(() => {
            setShowWebView(false);
            Toast.show({
                          type: 'success',
                          text1: 'Payment Successful',
                          text2: `₹${amount} added successfully.`,
                        });
                        

            navigation.navigate('Wallet', { refresh: true });
          }, 5000);
          
        } else if (statusResponse?.state === 'FAILED') {
          if (intervalId) clearInterval(intervalId);
          setIsProcessing(false);
          setShowWebView(false);
           Toast.show({
                          type: 'error',
                          text1: 'Payment failed',
                          text2: `Payment is been
                           not processed.Please Try Again.`,
                        });
        } else if (attempts >= 12) { // Increased attempts to 12 (60 seconds)
          if (intervalId) clearInterval(intervalId);
          setIsProcessing(false);
          setErrorMessage('Payment is being processed. Please check your wallet shortly.');
        }
      } catch (err) {
        console.error('Status check error:', err);
        if (attempts >= 12) {
          if (intervalId) clearInterval(intervalId);
          setIsProcessing(false);
          setErrorMessage('Unable to verify payment status. Please check your wallet.');
        }
      }
    };

    intervalId = setInterval(checkStatus, 5000);
  };

  const getDisplayAmount = () => {
    if (selectedAmount) return `₹ ${selectedAmount}`;
    if (customAmount) return `₹ ${customAmount}`;
    return '₹ 0';
  };

  const isContinueEnabled = getCurrentAmount() > 0;

  const handleCloseWebView = () => {
    if (paymentSuccess) {
      // If payment was successful, don't allow manual close
      setAlertMessage('Please wait while we process your payment...');
      return;
    }
    setShowWebView(false);
    setIsProcessing(false);
    setPaymentUrl('');
    setCurrentMerchantOrderId('');
    setPaymentSuccess(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Header 
          onback={() => navigation.goBack()} 
          active={1} 
          onSkip={() => {}} 
          skippable={false} 
          hastitle={true} 
          title={'Top Up Wallet'} 
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>Enter amount to add to your wallet</Text>
        
        {/* Amount Display */}
        <View style={styles.amountDisplay}>
          <Text style={styles.amountText}>{getDisplayAmount()}</Text>
        </View>
        
        {/* Preset Amounts */}
        <View style={styles.presetContainer}>
          {presetAmounts.map(amount => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.presetButton,
                selectedAmount === amount && styles.presetButtonSelected,
              ]}
              onPress={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              disabled={isProcessing}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  selectedAmount === amount && styles.presetButtonTextSelected,
                ]}
              >
                + ₹{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Keypad */}
        <View style={styles.keypadContainer}>
          {['123', '456', '789', 'C0⌫'].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.split('').map(char => {
                if (char === 'C') return (
                  <TouchableOpacity
                    key={char}
                    style={styles.keypadButton}
                    onPress={handleClear}
                    disabled={isProcessing}
                  >
                    <Text style={styles.keypadButtonText}>C</Text>
                  </TouchableOpacity>
                );
                if (char === '⌫') return (
                  <TouchableOpacity
                    key={char}
                    style={styles.keypadButton}
                    onPress={handleBackspace}
                    disabled={isProcessing}
                  >
                    <Text style={styles.keypadButtonText}>⌫</Text>
                  </TouchableOpacity>
                );
                return (
                  <TouchableOpacity
                    key={char}
                    style={styles.keypadButton}
                    onPress={() => handleNumberPress(char)}
                    disabled={isProcessing}
                  >
                    <Text style={styles.keypadButtonText}>{char}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        
        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!isContinueEnabled || isProcessing) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!isContinueEnabled || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={pallette.white} size="small" />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue to Pay ₹{getCurrentAmount()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* WEBVIEW MODAL */}
      <Modal 
        visible={showWebView} 
        animationType="slide"
        onRequestClose={handleCloseWebView}
      >
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: paymentUrl }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={pallette.primary} />
              </View>
            )}
            onShouldStartLoadWithRequest={(request) => {
              if (request.url.startsWith('upi://') || request.url.startsWith('paytm://') || request.url.startsWith('tez://')) {
                Linking.openURL(request.url);
                return false;
              }
              return true;
            }}
            onNavigationStateChange={(navState) => {
              const url = navState.url;
              
              if (url.includes('success') || url.includes('approved')) {
                // Mark payment as successful but DON'T close WebView
                setPaymentSuccess(true);
                setIsProcessing(false);
                
                // Wait 5 seconds on the success screen before closing and navigating
                setTimeout(() => {
                  setShowWebView(false);
                  setErrorMessage('Payment Successful!'); // Use AlertMessage for success
                  navigation.navigate('Wallet', { refresh: true });
                }, 5000);
              }
              
              if (url.includes('failed') || url.includes('cancel') || url.includes('declined')) {
                // Close immediately for failure
                setShowWebView(false);
                setIsProcessing(false);
                setErrorMessage('Payment Failed or Cancelled'); // Use ErrorMessage for errors
                setPaymentSuccess(false);
              }
            }}
          />
        </View>
      </Modal>

      <AlertMessage message={alertMessage} />
      <ErrorMessage message={errorMessage} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: pallette.white },
  header: { marginTop: 20 },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  subtitle: { fontSize: 16, fontFamily: regular, color: pallette.grey, textAlign: 'center', marginTop: 20 },
  amountDisplay: { alignItems: 'center', marginVertical: 30 },
  amountText: { fontSize: 48, fontFamily: bold, color: pallette.primary },
  presetContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  presetButton: {
    flex: 1, marginHorizontal: 8, paddingVertical: 16, backgroundColor: pallette.secondary,
    borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  presetButtonSelected: { borderColor: pallette.primary, backgroundColor: pallette.secondary },
  presetButtonText: { fontSize: 16, fontFamily: bold, color: pallette.black },
  presetButtonTextSelected: { color: pallette.primary },
  keypadContainer: { marginBottom: 20 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  keypadButton: { width: '30%', height: 60, backgroundColor: pallette.lightgrey, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keypadButtonText: { fontSize: 24, fontFamily: bold, color: pallette.black },
  continueButton: { backgroundColor: pallette.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  continueButtonDisabled: { backgroundColor: pallette.grey },
  continueButtonText: { fontSize: 18, fontFamily: bold, color: pallette.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AddMoney;