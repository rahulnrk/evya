// import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
// import React, {useContext, useState} from 'react';
// import Header from '../../components/header-with-skip';
// import RootScroll from '../../components/scroll-view';
// import {h, onBoard, w} from '../../constants/dimensions';
// import {adjust, nav, storeValue} from '../../helpers/common-functions';
// import {pallette} from '../../utils/pallette';
// import {bold, medium} from '../../utils/fonts';
// import Icon from 'react-native-vector-icons/FontAwesome6';
// import {AppContext} from '../../contexts/app-context';
// import strings from '../../utils/strings';

// const OnBoarding = ({navigation}: any) => {
//   const context = useContext(AppContext);
//   const board = context?.onboard;
//   const loggedin = context?.contextState.isAuthenticated;
//   const [active, setActive] = useState(0);
//   const saveOnBoarded = () => {
//     console.log('called');
//     storeValue(onBoard, 'yes')
//     board
//     loggedin ? nav(navigation, strings.app) : nav(navigation, strings.auth);
//   };
//   return (
//     <RootScroll>
//       <Header onback={setActive} active={active} onSkip={saveOnBoarded} />
//       <View style={styles.imageContainer}>
//         <Image
//           source={
//             active == 0
//               ? require(`../../assets/images/onboarding/on1.png`)
//               : active == 1
//               ? require(`../../assets/images/onboarding/on2.png`)
//               : active == 2
//               ? require(`../../assets/images/onboarding/on3.png`)
//               : active == 3
//               ? require(`../../assets/images/onboarding/on4.png`)
//               : require(`../../assets/images/onboarding/on5.png`)
//           }
//           style={styles.image}
//         />
//       </View>
//       <View style={styles.textContainer}>
//         <Text style={styles.heading}>
//           {`Quick Charge
//  \n Find the right charger for your car. 
// `}
//         </Text>
//         <Text style={styles.subHeading}>
//           {`Hassle-Free Charging
// , \n Plug. Power. Go.`}
//         </Text>
//       </View>
//       <View style={styles.paginationContainer}>
//         <View style={styles.row}>
//           {[1, 2, 3, 4, 5].map((_, index) => (
//             <View
//               key={index}
//               style={{
//                 height: 7,
//                 width: index == active ? w * 0.08 : 7,
//                 borderRadius: 5,
//                 backgroundColor:
//                   index == active ? pallette.primary : pallette.grey,
//                 marginHorizontal: w * 0.01,
//                 marginTop: w * 0.04,
//               }}
//             />
//           ))}
//         </View>
//         <TouchableOpacity
//           onPress={() =>
//             active < 4 ? setActive(prev => prev + 1) : saveOnBoarded()
//           }
//           style={styles.button}>
//           <Icon name={'chevron-right'} size={w * 0.03} color={pallette.white} />
//         </TouchableOpacity>
//       </View>
//     </RootScroll>
//   );
// };

// export default OnBoarding;

// const styles = StyleSheet.create({
//   imageContainer: {
//     height: h * 0.45,
//     width: w * 0.8,
//     alignSelf: 'center',
//     marginTop: h * 0.05,
//   },
//   image: {
//     height: '100%',
//     width: '100%',
//     resizeMode: 'contain',
//   },
//   textContainer: {
//     height: h * 0.2,
//     width: w * 0.8,
//     alignSelf: 'center',
//     marginTop: h * 0.05,
//   },
//   heading: {
//     fontSize: adjust(22),
//     color: pallette.black,
//     fontFamily: bold,
//     textAlign: 'center',
//   },
//   subHeading: {
//     fontSize: adjust(14),
//     color: pallette.grey,
//     fontFamily: medium,
//     textAlign: 'center',
//   },
//   paginationContainer: {
//     height: h * 0.1,
//     width: w * 0.9,
//     alignSelf: 'center',
//     justifyContent: 'space-between',
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: h * 0.05,
//   },
//   row: {
//     flexDirection: 'row',
//   },
//   button: {
//     height: w * 0.12,
//     width: w * 0.12,
//     backgroundColor: pallette.primary,
//     borderRadius: w * 0.02,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useContext, useState } from "react";
import Header from "../../components/header-with-skip";
import RootScroll from "../../components/scroll-view";
import { h, onBoard, w } from "../../constants/dimensions";
import { adjust, nav, storeValue } from "../../helpers/common-functions";
import { pallette } from "../../utils/pallette";
import { bold, medium } from "../../utils/fonts";
import Icon from "react-native-vector-icons/FontAwesome6";
import { AppContext } from "../../contexts/app-context";
import strings from "../../utils/strings";

const onboardingData = [
  {
    image: require("../../assets/images/onboarding/on1.png"),
    title: "Quick Charge",
    subtitle: "Find the right charger for your car."
  },
  {
    image: require("../../assets/images/onboarding/on2.png"),
    title: "Hassle-Free Charging",
    subtitle: "Plug. Power. Go."
  },
  {
    image: require("../../assets/images/onboarding/on3.png"),
    title: "Partner with Us",
    subtitle: "Start your EV franchise journey with Evya."
  },
  {
    image: require("../../assets/images/onboarding/on4.png"),
    title: "Your Feedback Matters",
    subtitle: "Rate, review & help us improve."
  },
  {
    image: require("../../assets/images/onboarding/on5.png"),
    title: "Get Started",
    subtitle: "Sign in and start charging in seconds."
  }
];

const OnBoarding = ({ navigation }: any) => {
  const context = useContext(AppContext);
  const board = context?.onboard;
  const loggedin = context?.contextState.isAuthenticated;
  const [active, setActive] = useState(0);

  const saveOnBoarded = () => {
    storeValue(onBoard, "yes");
    board;
    loggedin ? nav(navigation, strings.app) : nav(navigation, strings.auth);
  };

  const current = onboardingData[active];

  return (
    <RootScroll>
      <Header onback={setActive} active={active} onSkip={saveOnBoarded} />

      {/* IMAGE */}
      <View style={styles.imageContainer}>
        <Image source={current.image} style={styles.image} />
      </View>

      {/* TEXT */}
      <View style={styles.textContainer}>
        <Text style={styles.heading}>{current.title}</Text>
        <Text style={styles.subHeading}>{current.subtitle}</Text>
      </View>

      {/* PAGINATION + BUTTON */}
      <View style={styles.paginationContainer}>
        <View style={styles.row}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={{
                height: 7,
                width: index === active ? w * 0.08 : 7,
                borderRadius: 5,
                backgroundColor:
                  index === active ? pallette.primary : pallette.grey,
                marginHorizontal: w * 0.01,
                marginTop: w * 0.04
              }}
            />
          ))}
        </View>
        <TouchableOpacity
          onPress={() =>
            active < onboardingData.length - 1
              ? setActive((prev) => prev + 1)
              : saveOnBoarded()
          }
          style={styles.button}
        >
          <Icon name={"chevron-right"} size={w * 0.03} color={pallette.white} />
        </TouchableOpacity>
      </View>
    </RootScroll>
  );
};

export default OnBoarding;

const styles = StyleSheet.create({
  imageContainer: {
    height: h * 0.45,
    width: w * 0.8,
    alignSelf: "center",
    marginTop: h * 0.05
  },
  image: {
    height: "100%",
    width: "100%",
    resizeMode: "contain"
  },
  textContainer: {
    height: h * 0.15,
    width: w * 0.8,
    alignSelf: "center",
    marginTop: h * 0.04,
    alignItems: "center",
    justifyContent: "center"
  },
  heading: {
    fontSize: adjust(22),
    color: pallette.black,
    fontFamily: bold,
    textAlign: "center",
    marginBottom: h * 0.01
  },
  subHeading: {
    fontSize: adjust(14),
    color: pallette.grey,
    fontFamily: medium,
    textAlign: "center"
  },
  paginationContainer: {
    height: h * 0.1,
    width: w * 0.9,
    alignSelf: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginTop: h * 0.05
  },
  row: {
    flexDirection: "row"
  },
  button: {
    height: w * 0.12,
    width: w * 0.12,
    backgroundColor: pallette.primary,
    borderRadius: w * 0.02,
    justifyContent: "center",
    alignItems: "center"
  }
});
