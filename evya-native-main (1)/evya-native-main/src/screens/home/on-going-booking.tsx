import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {pallette} from '../../utils/pallette';
import {h, w} from '../../constants/dimensions';
import {adjust} from '../../helpers/common-functions';
import {regular, semibold, medium} from '../../utils/fonts';
import Toast from 'react-native-toast-message';

interface OnGoingBookingProps {
  stationName: string;
  address: string;
  date: string;
  timeSlot: string;
  onNavigatePress: () => void;
  onBookingPress: () => void;
  show: boolean;
  
  // Charging status data
  percentage?: number;
  chargingTime?: string;
  cost?: string;
  units?: number;
  status?: string;
  
  // Refresh function from Charging component
  onRefreshData?: () => Promise<void>;
}

/**
 * Compact OnGoingBooking Component
 * Displays ongoing booking/charging information with real charging stats
 */
const OnGoingBooking: React.FC<OnGoingBookingProps> = ({
  stationName,
  address,
  date,
  timeSlot,
  onNavigatePress,
  onBookingPress,
  show,
  
  // Charging status props
  percentage = 0,
  chargingTime = '0:00',
  cost = '₹0.00',
  units = 0,
  status = 'Available',
  
  // Refresh function
  onRefreshData,
}) => {
  const [reloading, setReloading] = useState(false);

  if (!show) return null;

  // Truncate address to show only first part
  const truncateAddress = (addr: string, maxLength: number = 25) => {
    if (addr.length <= maxLength) return addr;
    return addr.substring(0, maxLength) + '...';
  };

  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'Charging':
      case 'Finishing':
        return {
          bgColor: 'rgba(57, 4, 248, 0.2)',
          textColor: pallette.white,
        };
      case 'Completed':
        return {
          bgColor: 'rgba(33, 150, 243, 0.2)',
          textColor: pallette.primary,
        };
      case 'Stopped':
      case 'Error':
        return {
          bgColor: 'rgba(244, 67, 54, 0.2)',
          textColor: pallette.red,
        };
      default:
        return {
          bgColor: 'rgba(255, 255, 255, 0.2)',
          textColor: pallette.white,
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleRefreshData = useCallback(async () => {
    if (reloading || !onRefreshData) return;
    
    setReloading(true);
    
    try {
      await onRefreshData();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Charging data refreshed!',
        position: 'top',
        visibilityTime: 2000,
      });
      
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to refresh charging data',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setReloading(false);
    }
  }, [reloading, onRefreshData]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onBookingPress}
      activeOpacity={0.8}>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.gradient}
        colors={[pallette.l1, pallette.l2, pallette.primary]}>
        
        {/* Compact Station Info */}
        <View style={styles.mainContent}>
          {/* Top Row: Station Name & Battery */}
          <View style={styles.topRow}>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName} numberOfLines={1}>
                {stationName}
              </Text>
              <Text style={styles.stationAddress} numberOfLines={1}>
                {truncateAddress(address)}
              </Text>
            </View>
            
            {/* Battery Percentage */}
            <View style={styles.batteryContainer}>
              <Icon name="battery-charging-outline" size={adjust(10)} color={pallette.white} />
              <Text style={styles.batteryText}>{percentage}%</Text>
            </View>
          </View>

          {/* Middle Row: Date, Time & Status */}
          <View style={styles.middleRow}>
            <View style={styles.timeContainer}>
              <Icon name="time-outline" size={adjust(10)} color={pallette.white} />
              <Text style={styles.timeText}>
                {date} • {timeSlot}
              </Text>
            </View>
            
            {/* Status Badge - Only show if not "Available" */}
            {status !== 'Available' && (
              <View style={[styles.statusIndicator, {backgroundColor: statusConfig.bgColor}]}>
                <Text style={[styles.statusText, {color: statusConfig.textColor}]}>
                  {status}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Row: Compact Stats */}
          <View style={styles.statsContainer}>
            {/* Units Used */}
            <View style={styles.statItem}>
              <Icon name="flash-outline" size={adjust(9)} color={pallette.white} />
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{units.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Units</Text>
              </View>
            </View>
            
            {/* Divider */}
            <View style={styles.statDivider} />
            
            {/* Charging Time */}
            <View style={styles.statItem}>
              <Icon name="hourglass-outline" size={adjust(9)} color={pallette.white} />
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{chargingTime}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
            </View>
            
            {/* Divider */}
            <View style={styles.statDivider} />
            
            {/* Current Cost */}
            <View style={styles.statItem}>
              <Icon name="cash-outline" size={adjust(9)} color={pallette.white} />
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{cost}</Text>
                <Text style={styles.statLabel}>Cost</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Navigation Button */}
          {/* <TouchableOpacity
            style={styles.navButton}
            onPress={onNavigatePress}
            activeOpacity={0.7}>
            <Icon
              name="navigate-outline"
              color={pallette.white}
              size={w * 0.04}
            />
          </TouchableOpacity>
           */}
          {/* Refresh Button - ALWAYS show refresh button, no arrow */}
          {/* <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshData}
            disabled={reloading || !onRefreshData}
            activeOpacity={0.7}>
            {reloading ? (
              <ActivityIndicator size="small" color={pallette.white} />
            ) : (
              <Icon
                name="refresh-outline"
                color={pallette.white}
                size={w * 0.045}
              />
            )}
          </TouchableOpacity>
           */}
          {/* NO ARROW ICON - Removed completely */}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default OnGoingBooking;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: w * 0.036,
    marginVertical: h * 0.008,
    shadowColor: pallette.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: w * 0.025,
    borderRadius: w * 0.025,
    minHeight: h * 0.15,
  },
  mainContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: h * 0.002,
  },
  stationInfo: {
    flex: 1,
    marginRight: 6,
  },
  stationName: {
    color: pallette.white,
    fontSize: adjust(13),
    fontFamily: semibold,
    marginBottom: 1,
  },
  stationAddress: {
    color: pallette.white,
    fontSize: adjust(10),
    fontFamily: regular,
    opacity: 0.9,
    lineHeight: adjust(12),
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  batteryText: {
    fontSize: adjust(10),
    fontFamily: medium,
    color: pallette.white,
    marginLeft: 3,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: h * 0.008,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: adjust(10),
    fontFamily: medium,
    color: pallette.white,
    marginLeft: 4,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: adjust(9),
    fontFamily: semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextContainer: {
    marginLeft: 4,
    alignItems: 'flex-start',
  },
  statValue: {
    color: pallette.white,
    fontSize: adjust(11),
    fontFamily: semibold,
    marginBottom: 1,
  },
  statLabel: {
    color: pallette.white,
    fontSize: adjust(8),
    fontFamily: regular,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: w * 0.015,
  },
  navButton: {
    padding: w * 0.015,
    marginRight: w * 0.015,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: w * 0.012,
  },
  refreshButton: {
    padding: w * 0.015,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: w * 0.012,
    opacity: 1, // Always visible
  },
});