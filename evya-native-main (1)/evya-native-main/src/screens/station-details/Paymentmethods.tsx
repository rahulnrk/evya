import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { pallette } from "../../utils/pallette";
import { regular, medium, semibold } from "../../utils/fonts";
import { adjust } from "../../helpers/common-functions";
import Header from "../../components/header-with-skip";
import strings from "../../utils/strings";
import Icon from "react-native-vector-icons/FontAwesome5";
import AlertMessage from '../../extra/alertmessage';

// =============================================================================
// MAIN COMPONENT: PAYMENT PAGE
// =============================================================================

const PaymentPage: React.FC = () => {
  const navigation = useNavigation();

  // State management
  const [selectedMethod, setSelectedMethod] = useState<string>("wallet");
  const [walletBalance, setWalletBalance] = useState(0);
    const [alertComponent, setAlertComponent] = useState<any>(null);

  /**
   * Mock wallet balance - replace with actual API call
   */
  useEffect(() => {
    // Simulate API call to fetch wallet balance
    setWalletBalance(1250.50);
  }, []);

  /**
   * Payment methods data
   */
  const paymentMethods = [
    {
      id: "wallet",
      title: "Evya Wallet",
      description: "Pay using your wallet balance",
      icon: "wallet",
      balance: walletBalance,
      isAvailable: true,
      iconColor: pallette.primary
    },
    {
      id: "upi",
      title: "UPI Payment",
      description: "Pay using UPI apps",
      icon: "mobile-alt",
      isAvailable: false,
      iconColor: pallette.grey
    },
    {
      id: "card",
      title: "Credit/Debit Card",
      description: "Pay using your card",
      icon: "credit-card",
      isAvailable: false,
      iconColor: pallette.grey
    },
    {
      id: "netbanking",
      title: "Net Banking",
      description: "Pay using net banking",
      icon: "university",
      isAvailable: false,
      iconColor: pallette.grey
    }
  ];

  /**
   * Handle payment method selection
   */
  const handleMethodSelect = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method?.isAvailable) {
      setSelectedMethod(methodId);
    } else {
      Alert.alert(
        "Coming Soon",
        "This payment method will be available soon. Please use Evya Wallet for now.",
        [{ text: "OK" }]
      );
    }
  };
  const handleRFID = () => {

  setAlertComponent(
    <AlertMessage
      message="Are you sure you want to request RFID?"
      showConfirm={true}
      onClose={(confirmed:any) => {

        setAlertComponent(null);

        if (confirmed) {
          navigation.navigate(strings.rfid);
        }

      }}
    />
  );

};

  /**
   * Handle proceed to payment
   */
  const handleProceedToPay = () => {
    if (selectedMethod === "wallet") {
      navigation.navigate("WalletPayment", {
        walletBalance: walletBalance
      });
    }
  };

  /**
   * Handle back navigation
   */
  const handleBackPress = (): void => {
    navigation.goBack();
  };

  /**
   * Handle add money to wallet
   */
  const handleAddMoney = () => {
    navigation.navigate(strings.wallettab, {
      screen: strings.addmoney
    });
  };

  // PERF-5: FlatList for payment methods
  const renderMethod = useCallback(
    ({ item: method }: { item: (typeof paymentMethods)[0] }) => (
      <TouchableOpacity
        style={[
          styles.paymentMethodCard,
          selectedMethod === method.id && styles.selectedMethod,
          !method.isAvailable && styles.disabledMethod,
          method.id === "wallet" && styles.walletMethod,
        ]}
        onPress={() => handleMethodSelect(method.id)}
        disabled={!method.isAvailable}
      >
        <View style={styles.methodLeft}>
          <View
            style={[
              styles.methodIconContainer,
              selectedMethod === method.id && styles.selectedIconContainer,
            ]}
          >
            <Icon
              name={method.icon}
              size={adjust(18)}
              color={
                selectedMethod === method.id
                  ? pallette.white
                  : method.iconColor
              }
            />
          </View>
          <View style={styles.methodInfo}>
            <View style={styles.methodHeader}>
              <Text style={styles.methodTitle}>{method.title}</Text>
              {method.id === "wallet" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                  <TouchableOpacity style={styles.rfidButton} onPress={handleRFID}>
                    <Text style={styles.rfidText}>Request RFID</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.methodDescription}>{method.description}</Text>
          </View>
        </View>

        <View style={styles.methodRight}>
          {!method.isAvailable ? (
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          ) : (
            <View
              style={[
                styles.radioButton,
                selectedMethod === method.id && styles.radioButtonSelected,
              ]}
            >
              {selectedMethod === method.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
    [selectedMethod],
  );

  const listHeader = (
    <View style={styles.section}>
      <Text style={styles.sectionSubtitle}>
        Use your preferred payment method to enjoy the Evya experience
      </Text>
    </View>
  );

  const listFooter = (
    <>
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Icon name="info-circle" size={adjust(16)} color={pallette.primary} />
          <Text style={styles.infoTitle}>About Evya Wallet</Text>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            Fast and secure payments for all your charging sessions
          </Text>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            Instant refunds to your wallet in case of cancellations
          </Text>
        </View>
        <View style={styles.infoItem}>
          <View style={styles.infoDot} />
          <Text style={styles.infoText}>
            Track all your transactions in one place
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addMoneyCard} onPress={handleAddMoney}>
        <View style={styles.addMoneyIconContainer}>
          <Icon name="plus-circle" size={adjust(20)} color={pallette.primary} />
        </View>
        <View style={styles.addMoneyInfo}>
          <Text style={styles.addMoneyTitle}>Add Money to Wallet</Text>
          <Text style={styles.addMoneyDescription}>
            Top up your wallet for faster payments
          </Text>
        </View>
        <Icon name="chevron-right" size={adjust(16)} color={pallette.grey} />
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <Header
        onback={handleBackPress}
        onSkip={() => {}}
        active={1}
        skippable={false}
        hastitle={true}
        title={'Payment Methods'}
      />

      <FlatList
        style={styles.content}
        contentContainerStyle={styles.scrollContentContainer}
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={renderMethod}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
      />
      {alertComponent}

      {/* Proceed Button */}
      {/* <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            selectedMethod !== "wallet" && styles.disabledButton
          ]}
          onPress={handleProceedToPay}
          disabled={selectedMethod !== "wallet"}
        >
          <Text style={styles.proceedButtonText}>
            Proceed with {selectedMethod === "wallet" ? "Wallet" : "Payment"}
          </Text>
          <Icon name="arrow-right" size={adjust(16)} color={pallette.white} style={styles.proceedIcon} />
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: pallette.white,
    paddingTop: 24,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: adjust(12),
    color: pallette.black,
    fontFamily: semibold,
  },
  availableMethodsBadge: {
    backgroundColor: pallette.lightprimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availableMethodsText: {
    fontSize: adjust(12),
    color: pallette.primary,
    fontFamily: medium,
  },
  sectionSubtitle: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: regular,
    marginBottom: 20,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: pallette.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: pallette.lightgrey,
    shadowColor: pallette.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  walletMethod: {
    borderColor: pallette.lightprimary,
    shadowColor: pallette.primary,
    shadowOpacity: 0.1,
  },
  selectedMethod: {
    borderColor: pallette.primary,
    backgroundColor: pallette.lightprimary,
  },
  disabledMethod: {
    opacity: 0.6,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: pallette.lightgrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: pallette.primary,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodTitle: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: medium,
    marginRight: 8,
  },
  rfidButton: {
  backgroundColor: pallette.primary,
  paddingHorizontal: 5,
  paddingVertical: 2,
  borderRadius: 5,
},
rfidText: {
  color: pallette.white,
  fontFamily: medium,
  fontSize: adjust(10),
},
  recommendedBadge: {
    backgroundColor: pallette.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: adjust(10),
    color: pallette.primary,
    fontFamily: medium,
  },
  methodDescription: {
    fontSize: adjust(11),
    color: pallette.grey,
    fontFamily: regular,
  },
  walletBalance: {
    fontSize: adjust(12),
    color: pallette.primary,
    fontFamily: medium,
    marginTop: 4,
  },
  methodRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comingSoonContainer: {
    backgroundColor: pallette.lightgrey,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  comingSoonText: {
    fontSize: adjust(10),
    color: pallette.grey,
    fontFamily: medium,
    fontStyle: 'italic',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: pallette.mediumgrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: pallette.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: pallette.primary,
  },
  infoSection: {
    backgroundColor: pallette.lightprimary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: pallette.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: semibold,
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: pallette.primary,
    marginTop: 6,
    marginRight: 12,
  },
  infoText: {
    fontSize: adjust(11),
    color: pallette.black,
    fontFamily: regular,
    flex: 1,
    lineHeight: 18,
  },
  addMoneyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pallette.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: pallette.lightgrey,
    marginBottom: 20,
    shadowColor: pallette.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addMoneyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: pallette.lightprimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addMoneyInfo: {
    flex: 1,
  },
  addMoneyTitle: {
    fontSize: adjust(14),
    color: pallette.black,
    fontFamily: medium,
    marginBottom: 4,
  },
  addMoneyDescription: {
    fontSize: adjust(11),
    color: pallette.grey,
    fontFamily: regular,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: pallette.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: pallette.lightgrey,
    shadowColor: pallette.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  proceedButton: {
    backgroundColor: pallette.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: pallette.mediumgrey,
  },
  proceedButtonText: {
    fontSize: adjust(16),
    color: pallette.white,
    fontFamily: semibold,
    marginRight: 8,
  },
  proceedIcon: {
    marginLeft: 4,
  },
});

export default PaymentPage;