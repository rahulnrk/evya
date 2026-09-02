import {StyleSheet, Image, View, Text, Pressable} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import strings from '../utils/strings';
import {Home} from '../screens/home';
import {Maps} from '../screens/map';
import {Scan} from '../screens/scan-qr';
import {Wallet} from '../screens/wallet';
import {Devices} from '../screens/devices';
import {h, w} from '../constants/dimensions';
import {adjust} from '../helpers/common-functions';
import {medium} from '../utils/fonts';
import {pallette} from '../utils/pallette';
import {MyFranchises, RequestFranchise} from '../screens/franchises';

import BookChargerScreen from '../screens/station-details/book-a-charger-screen';
import ConnectCharger from '../screens/station-details/connect-charger-screen';
import MyBookings from '../screens/account/my-bookings-screen';
import CheckIn from '../screens/station-details/check-in-screen';
import Charging from '../screens/station-details/charging-screen';
import BookingDetails from '../screens/account/booking-details-screen';
import RecentTransactions from '../screens/wallet/recent-transaction-list-screen';
import Account from '../screens/account/account-screen';
import { Store } from '../screens/store';
import { Address, AddressScreen } from '../screens/address';
import { AddVehicleScreen } from '../screens/add-vehicle';
import { ProfileScreen } from '../screens/account';
import { StationDetails } from '../screens/station-details';

import EVChargingStations from '../screens/map/map-card';
import BookingSuccessPopup from '../extra/BookingSuccessPopup';
import HelpScreen from '../extra/help';
import StationsList from '../screens/map/StationList';
// import RouteScreen from '../screens/home/routescreen';
import FeedBackCheckIn from '../screens/station-details/feedbackcheck';
import WebViewScreen from '../screens/home/WebViewScreen';
import VehicleScreen from '../screens/devices/vehicle';
import AddMoney from '../screens/wallet/AddMoney';
import AboutEvya from '../screens/station-details/AboutEvya';
import PrivacyPolicy from '../screens/station-details/PrivacyPolicy';
import { useCharging } from '../contexts/ChargingContext';
import PaymentPage from '../screens/station-details/Paymentmethods';
import FavouriteStation from '../screens/station-details/FavouriteStation';
import WebMapSection from '../screens/map/WebMapSection';
import RFIDScreen from '../screens/wallet/RFIDScreen';
import RFIDTabs from '../screens/account/rfid/RFIDTabs';
import AddFleet from '../screens/add fleet and driver/AddFleet';
// import AddDriver from '../screens/add fleet and driver/AddDriver';
// import BookingSuccessPopup from '../screens/station-details/BookingSuccessPopup';

const Stack = createNativeStackNavigator();

const HomeNav = () => {
  const {chargingSession} = useCharging();
  return (
    <Stack.Navigator screenOptions={{headerShown: false}} >  
      <Stack.Screen name={strings.home} component={Home} />
      <Stack.Screen name={strings.franchises} component={MyFranchises} />
      <Stack.Screen name={strings.account} component={Account} />
      <Stack.Screen name={strings.reqfranchise} component={RequestFranchise} />
      <Stack.Screen name={strings.devices} component={Devices} />
      <Stack.Screen name={strings.addvehicle} component={AddVehicleScreen} />
      <Stack.Screen name={strings.profile} component={ProfileScreen} />
      <Stack.Screen name={strings.help}component={HelpScreen}/>
      <Stack.Screen name={strings.stationslist}component={StationsList}/>
      <Stack.Screen name={strings.stationdetails} component={StationDetails}/>
      <Stack.Screen name={strings.feedbackcheckin} component={FeedBackCheckIn}/>
      <Stack.Screen name={strings.bookcharger} component={BookChargerScreen} />
      {/* <Stack.Screen name={strings.bookingsuccess} component={BookingSuccessPopup} /> */}
      <Stack.Screen name={strings.connectcharger} component={ConnectCharger} />
      <Stack.Screen name={strings.BookingSuccessPopup} component={BookingSuccessPopup}/>
      <Stack.Screen name={strings.mybookings} component={MyBookings} />
      <Stack.Screen name="WebViewScreen"  component={WebViewScreen} options={{ headerShown: false }} />
      <Stack.Screen name={strings.bookingdetails} component={BookingDetails} />
      <Stack.Screen name={strings.checkin} component={CheckIn} />
      <Stack.Screen name={strings.charging} component={Charging} />
      <Stack.Screen name={strings.Vehiclepage} component={VehicleScreen}/>
      <Stack.Screen name={strings.aboutevya} component={AboutEvya} />
      <Stack.Screen name={strings.privacypolicy} component={PrivacyPolicy}/>
      <Stack.Screen name={strings.address}component={AddressScreen}/>
      <Stack.Screen name={strings.paymentmethods}component={PaymentPage}/>
      <Stack.Screen name={strings.favstations}component={FavouriteStation}/>
      <Stack.Screen name="WebMapSection"  component={WebMapSection}  />
      <Stack.Screen name={strings.rfid}component={RFIDScreen}/>
      <Stack.Screen name={strings.rfids}component={RFIDTabs}/>
      <Stack.Screen name={strings.addfleet} component={AddFleet}/>
      {/* <Stack.Screen name={strings.adddriver} component={AddDriver}/> */}
    </Stack.Navigator>
  );
};
const MapNav = () => {
  return (
     <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen 
  name={strings.map} 
  component={WebViewScreen} 
  initialParams={{ 
    url: "https://web.evyaa.com/mapsearch", 
    title: "Route" 
  }} 
/>
      {/* <Stack.Screen name={strings.routescreen} component={RouteScreen} /> */}
     
      
    </Stack.Navigator>
  );
};
const ScanNav = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={strings.scan} component={Scan} />
    </Stack.Navigator>
  );
};
const WalletNav = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={strings.wallet} component={Wallet} />
      <Stack.Screen name={strings.recenttransactions} component={RecentTransactions} />
      <Stack.Screen name={strings.addmoney} component={AddMoney}/>
      <Stack.Screen name={strings.rfid}component={RFIDScreen}/>
    </Stack.Navigator>
  );
};

const StoreNav = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={strings.store} component={Store} />
    </Stack.Navigator>
  )
}

const Tab = createBottomTabNavigator();

const tabs = [
  {
    name: strings.hometab,
    component: HomeNav,
    title: strings.home,
    activeicon: require('../assets/images/icons/homeactive.png'),
    inactiveicon: require('../assets/images/icons/homeinactive.png'),
  },
  {
    name: strings.maptab,
    component: MapNav,
    title: strings.map,
    activeicon: require('../assets/images/icons/mapactive.png'),
    inactiveicon: require('../assets/images/icons/mapinactive.png'),
  },
  {
    name: strings.scantab,
    component: ScanNav,
    title: strings.scan,
    activeicon: require('../assets/images/icons/scanner.png'),
    inactiveicon: require('../assets/images/icons/scanner.png'),
  },
  {
    name: strings.wallettab,
    component: WalletNav,
    title: strings.wallet,
    activeicon: require('../assets/images/icons/walletactive.png'),
    inactiveicon: require('../assets/images/icons/walletinactive.png'),
  },
  {
    name: strings.storetab,
    component: StoreNav,
    title: strings.store,
    activeicon: require('../assets/images/icons/storeactive.png'),
    inactiveicon: require('../assets/images/icons/storeinactive.png'),
  },
];

const TabNav = () => {
  return (
    <Tab.Navigator >
      {tabs.map((tab, index) => (
        <Tab.Screen
        key={tab.name}
          name={tab?.name}
          component={tab?.component}
          options={{
              // PERF-2: keep tab stacks mounted so map WebViews (evyaweb) stay warm
              unmountOnBlur: false,
            tabBarIcon: ({focused}) => (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor:
                      tab?.title == strings.scan
                        ? pallette.primary
                        : pallette.white,
                    paddingVertical: tab?.title == strings.scan ? h * 0.015 : 0,
                    position:
                      tab?.title == strings.scan ? 'absolute' : undefined,
                    borderRadius: tab?.title == strings.scan ? w * 0.04 : 0,
                  },
                ]}>
                {tab?.title == strings.scan ? (
                  <Image
                    source={tab?.activeicon}
                    style={[styles.icon, {height: h * 0.04}]}
                  />
                ) : (
                  <Image
                    source={focused ? tab?.activeicon : tab?.inactiveicon}
                    style={styles.icon}
                  />
                )}
              </View>
            ),
            headerShown: false,
            tabBarLabel: ({focused}) =>
              tab?.title != strings.scan ? (
                <Text
                  style={[
                    styles.label,
                    {color: focused ? pallette.primary : pallette.grey},
                  ]}>
                  {tab?.title}
                </Text>
              ) : null,
            tabBarStyle: {
              height: h * 0.08,
              elevation: 0,
              borderTopWidth: 0,
            },
            tabBarButton: props => (
              <Pressable {...props} android_ripple={{color: 'transparent'}} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default TabNav;

const styles = StyleSheet.create({
  iconContainer: {},
  icon: {
    height: h * 0.025,
    resizeMode: 'contain',
    width: w * 0.15,
  },
  label: {
    fontSize: adjust(12),
    fontFamily: medium,
  },
});
