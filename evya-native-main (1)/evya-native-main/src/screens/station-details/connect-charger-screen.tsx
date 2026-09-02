import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {h, w} from '../../constants/dimensions';
import {bold, medium} from '../../utils/fonts';
import {adjust, nav} from '../../helpers/common-functions';
import {pallette} from '../../utils/pallette';
import strings from '../../utils/strings';
import Icon from 'react-native-vector-icons/Ionicons';
import NeedHelpPopup from '../../extra/NeedHelpScreen';
import StationsService from '../../axios/Apis';
import AlertMessage from '../../extra/alertmessage';

const CHARGING_STATUS = {
  WAITING: 0,
  PREPARING: 1,
  SUSPENDED_EV: 2,
  STARTING: 3,
  CHARGING: 4,
} as const;

const TIMING = {
  STATUS_TIMEOUT: 120000,
  POLLING_INTERVAL: 3000,
};

const StatusRow = ({
  status,
  targetStatus,
  loadingText,
  successText,
  iconName,
  isTimedOut,
}) => {
  const isCompleted = status >= targetStatus;
  const isLoading = status === targetStatus - 1;
  const isError = isTimedOut && isLoading;

  return (
    <View style={styles.statusRow}>
      {isLoading ? (
        <ActivityIndicator
          size={w * 0.05}
          color={isError ? pallette.red : pallette.primary}
        />
      ) : isCompleted ? (
        <Icon name={iconName} size={20} color={pallette.primary} />
      ) : (
        <ActivityIndicator size={w * 0.05} color={pallette.grey} />
      )}

      <Text
        style={[
          styles.statusText,
          isCompleted ? styles.completedStatus : styles.pendingStatus,
          isError && styles.errorStatus,
        ]}>
        {isError ? 'Error - Timeout' : isCompleted ? successText : loadingText}
      </Text>
    </View>
  );
};

const ConnectCharger = ({route, navigation}) => {
  const [currentStatus, setCurrentStatus] = useState(CHARGING_STATUS.WAITING);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [statusTimeouts, setStatusTimeouts] = useState({});
  const [isProcessingStart, setIsProcessingStart] = useState(false);

  const pollingIntervalRef = useRef(null);
  const startTimerRef = useRef(null);
  const timeoutRefs = useRef({});
  const successRef = useRef(false); // 🚨 BLOCK FUTURE ALERTS AFTER SUCCESS

  const {station, connector, charger, updatedPayload, chargingDetails} =
    route.params || {};
  const portId = connector?.portId;

  const clearAllTimers = () => {
    Object.values(timeoutRefs.current).forEach(t => clearTimeout(t));
    timeoutRefs.current = {};

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
  };

  const safeShowAlert = msg => {
    if (successRef.current) return; // 🚨 DO NOT SHOW ALERT AFTER SUCCESS
    setAlertMessage(msg);
    setShowAlert(true);
  };

  const startStatusTimer = status => {
    if (successRef.current) return;

    if (timeoutRefs.current[status]) clearTimeout(timeoutRefs.current[status]);

    timeoutRefs.current[status] = setTimeout(() => {
      setStatusTimeouts(prev => ({...prev, [status]: true}));
      handleStatusTimeout(status);
    }, TIMING.STATUS_TIMEOUT);
  };

  const handleStatusTimeout = status => {
    if (successRef.current) return;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (status === CHARGING_STATUS.WAITING)
      safeShowAlert('Connector not connected properly. Please reconnect.');

    else if (status === CHARGING_STATUS.PREPARING)
      safeShowAlert('EV not accepting connector. Please try again.');
  };

  const fetchPreparingStatus = async () => {
    try {
      const res = await StationsService.portstatus(portId);
      return res.data === 'Preparing' || res.data?.isPreparing;
    } catch (err) {
      return false;
    }
  };

  const startPreparingPolling = () => {
    pollingIntervalRef.current = setInterval(async () => {
      if (successRef.current) return;

      const preparing = await fetchPreparingStatus();
      if (preparing) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;

        setCurrentStatus(CHARGING_STATUS.PREPARING);

        setTimeout(() => {
          setCurrentStatus(CHARGING_STATUS.SUSPENDED_EV);
        }, 2000);
      }
    }, TIMING.POLLING_INTERVAL);
  };

  useEffect(() => {
    startStatusTimer(CHARGING_STATUS.WAITING);
    startPreparingPolling();

    return () => {
      clearAllTimers();
      successRef.current = true; // 🚨 block alerts after leaving screen
    };
  }, []);

  useEffect(() => {
    if (currentStatus <= CHARGING_STATUS.SUSPENDED_EV) {
      startStatusTimer(currentStatus);
    }
  }, [currentStatus]);

  useEffect(() => {
    if (currentStatus === CHARGING_STATUS.SUSPENDED_EV) {
      clearAllTimers();

      startTimerRef.current = setTimeout(() => {
        setCurrentStatus(CHARGING_STATUS.STARTING);
        startChargingTransaction();
      }, 2000);
    }
  }, [currentStatus]);

  const startChargingTransaction = async () => {
    if (isProcessingStart || successRef.current) return;

    clearAllTimers();
    setIsProcessingStart(true);

    Toast.show({
      type: 'info',
      text1: "Charging is starting, don't go back.",
    });

    try {
      const res = await StationsService.occprequests(updatedPayload);

      if (res.data?.statusCode === 200 && res.data?.status === 'Accepted') {
        successRef.current = true; // 🚨 IMPORTANT
        clearAllTimers();

        setShowAlert(false);
        setAlertMessage('');
        Toast.hide();

        setCurrentStatus(CHARGING_STATUS.CHARGING);

        nav(navigation, strings.charging, {
          station,
          connector,
          charger,
          transactionId: res.data.transactionId,
          chargingDetails,
        });

        return;
      }
      else if(res.data?.status === 'Rejected')
      {
      safeShowAlert(res.data?.message||'Charging start rejected. Try again.');}
    } catch (err) {
      safeShowAlert('Network error. Try again.');
    } finally {
      setIsProcessingStart(false);
    }
  };

  const handleAlertConfirm = confirmed => {
    setShowAlert(false);

    if (confirmed && !successRef.current) {
      clearAllTimers();
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/carcharging.png')}
        style={styles.chargingImage}
      />

      <Text style={styles.screenTitle}>Connect charger to your vehicle</Text>

      <View style={styles.statusContainer}>
        <StatusRow
          status={currentStatus}
          targetStatus={CHARGING_STATUS.PREPARING}
          loadingText={'Checking connector status...'}
          successText="Connector prepared"
          iconName="checkmark-circle"
          isTimedOut={statusTimeouts[CHARGING_STATUS.WAITING]}
        />

        <StatusRow
          status={currentStatus}
          targetStatus={CHARGING_STATUS.SUSPENDED_EV}
          loadingText="Waiting for EV acceptance..."
          successText="EV accepted connector"
          iconName="checkmark-circle"
          isTimedOut={statusTimeouts[CHARGING_STATUS.PREPARING]}
        />

        <StatusRow
          status={currentStatus}
          targetStatus={CHARGING_STATUS.STARTING}
          loadingText="Preparing to start charging..."
          successText="Remote start sent"
          iconName="checkmark-circle"
          isTimedOut={false}
        />

        <StatusRow
          status={currentStatus}
          targetStatus={CHARGING_STATUS.CHARGING}
          loadingText="Charging is starting..."
          successText="Charging started"
          iconName="checkmark-circle"
          isTimedOut={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.actionButton, styles.primaryButton]}
        onPress={() => setIsHelpVisible(true)}>
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          Need Help
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={() => {
          if (!successRef.current)
            safeShowAlert('Are you sure you want to cancel?');
        }}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          Cancel Charging
        </Text>
      </TouchableOpacity>

      <NeedHelpPopup visible={isHelpVisible} onClose={() => setIsHelpVisible(false)} />

      <AlertMessage
        message={alertMessage}
        visible={showAlert}
        onClose={handleAlertConfirm}
      />

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', padding: 20},
  chargingImage: {
    width: w * 0.9,
    height: h * 0.3,
    resizeMode: 'contain',
  },
  screenTitle: {
    fontSize: adjust(22),
    fontFamily: bold,
    marginTop: 10,
    textAlign: 'center',
  },
  statusContainer: {
    width: '100%',
    marginTop: 20,
    backgroundColor: pallette.lightgrey,
    padding: 20,
    borderRadius: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  statusText: {fontSize: adjust(14), fontFamily: medium},
  completedStatus: {color: pallette.primary},
  pendingStatus: {color: pallette.grey},
  errorStatus: {color: pallette.red},
  actionButton: {
    width: w * 0.9,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  primaryButton: {backgroundColor: pallette.primary},
  secondaryButton: {borderWidth: 1, borderColor: pallette.primary},
  buttonText: {fontSize: adjust(14), fontFamily: medium},
  primaryButtonText: {color: pallette.white},
  secondaryButtonText: {color: pallette.primary},
});

export default ConnectCharger;
