import React, { useEffect, useCallback, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { CommonActions } from "@react-navigation/native";

import { w } from "../../constants/dimensions";
import { pallette } from "../../utils/pallette";
import { nav } from "../../helpers/common-functions";
import strings from "../../utils/strings";
import { getUserDetails } from '../../redux/AuthSlice';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch } from '../../redux/store';

/**
 * Interface for menu item configuration
 */
interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  gap?: boolean;
}

/**
 * Interface for component props
 */
interface AccountTabsProps {
  navigation: any;
}

/**
 * Account Tabs — STATE-1: auth from Redux via useAuth
 */
const AccountTabs: React.FC<AccountTabsProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { userId, user, logout: authLogout } = useAuth();

  /**
   * Navigation menu items configuration
   */
  const menuItems: MenuItem[] = [
    { 
      id: "1", 
      title: "My Bookings", 
      icon: "calendar-check", 
      onPress: () => nav(navigation, strings.mybookings) 
    },
    { 
      id: "2", 
      title: "Favourite Stations", 
      icon: "heart", 
      onPress: () =>nav(navigation, strings.favstations) ,  
     
    },
    { 
      id: "3", 
      title: "My Vehicles", 
      icon: "car-alt", 
      onPress: () => nav(navigation, strings.devices) 
    },
    { 
      id: "4", 
      title: "My Address", 
      icon: "map-marker-alt", 
      onPress: () => nav(navigation, strings.address)
    },
    // { 
    //   id: "5", 
    //   title: "Profile", 
    //   icon: "user-alt", 
    //   onPress: () => nav(navigation, strings.profile, { from: 'account' }) 
    // },
    { 
      id: "6", 
      title: "Payment Methods", 
      icon: "credit-card", 
      onPress: () => nav(navigation, strings.paymentmethods), 
      
    },
    { 
      id: "7", 
      title: "RFID", 
      icon: "id-card", 
      onPress: () => nav(navigation, strings.rfids), 
      
    },

    { 
      id: "7", 
      title: "Help Center", 
      icon: "headset", 
      onPress: () => nav(navigation, strings.help) 
    },
    { 
      id: "8", 
      title: "Privacy Policy", 
      icon: "clipboard-list", 
      onPress: () => nav(navigation, strings.privacypolicy) 
    },
    { 
      id: "9", 
      title: "About Evya", 
      icon: "info-circle", 
      onPress: () => nav(navigation, strings.aboutevya), 
     
    },
     { 
      id: "10", 
      title: "Join As Fleet", 
      icon: "taxi", 
      onPress: () => nav(navigation, strings.addfleet), 
     
    }, 
    // { 
    //   id: "11", 
    //   title: "Join As Driver", 
    //   icon: "id-card", 
    //   onPress: () => nav(navigation, strings.adddriver), 
     
    // },
  ];

  /**
   * Fetch user details when component mounts or userId changes
   */
  useEffect(() => {
    if (userId && (!user || Object.keys(user).length === 0)) {
      dispatch(getUserDetails(userId));
    }
  }, [userId, user, dispatch]);

  /**
   * Handle user logout process
   * Clears storage, resets state, and navigates to landing page
   */
  const handleLogout = useCallback(async () => {
    try {
      // STATE-1: single logout path — Redux + persist purge via useAuth
      await authLogout();
      
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: strings.landing }],
          }),
        );
      }, 100);
      
    } catch (error) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: strings.landing }],
        }),
      );
    }
  }, [authLogout, navigation]);

  /**
   * Get display data for user profile section
   */
  const getDisplayData = () => {
    if (!user) {
      return { username: "Guest User", mobileNumber: "" };
    }

    const username = user.username || user.name || "Guest User";
    const mobileNumber = user.mobileNumber || user.phone || "";

    return { username, mobileNumber };
  };

  const { username, mobileNumber } = getDisplayData();

  // PERF-5: virtualize account menu
  const renderMenuItem = useCallback(
    ({ item }: { item: MenuItem }) => (
      <TouchableOpacity
        style={[styles.menuItem, { marginBottom: item.gap ? 20 : 8 }]}
        onPress={item.onPress}
      >
        <FontAwesome5
          name={item.icon}
          size={18}
          color="#444"
          style={styles.menuIcon}
        />
        <Text style={styles.menuText}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={18} color="#999" />
      </TouchableOpacity>
    ),
    [],
  );

  const listHeader = useMemo(
    () => (
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => nav(navigation, strings.profile, { from: 'account' })}
      >
        <Image
          source={require('../../assets/images/account/avatar.png')}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{username}</Text>
          <Text style={styles.phoneNumber}>
            {mobileNumber ? `+91 ${mobileNumber}` : "Add phone number"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    ),
    [username, mobileNumber, navigation],
  );

  const listFooter = useMemo(
    () => (
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={18} color="#D9534F" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    ),
    [handleLogout],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id}
        renderItem={renderMenuItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Styles kept exactly the same as original
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom:10
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
  },
  profileImage: {
    width: w * 0.2,
    height: w * 0.2,
    borderRadius: 25,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  phoneNumber: {
    fontSize: 14,
    color: "#666",
  },
  menuList: {
    marginTop: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: pallette.lightgrey,
    padding: 14,
    marginBottom: 8,
  },
  menuIcon: {
    width: 24,
    textAlign: "center",
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    color: '#000',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: w * 0.04,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D9534F",
    marginLeft: 6,
  },
});

export default AccountTabs;