// import {
//   FlatList,
//   Image,
//   StyleSheet,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import {h, w} from '../../constants/dimensions';
// import EVChargingCard from '../map/map-card';
// import {pallette} from '../../utils/pallette';

// const Banners = ({banners}: {banners: any}) => {
//   return (
//     <FlatList
//       data={banners}
//       renderItem={({item, index}) => (
//         <TouchableOpacity style={styles.chargerCard}>
//           <EVChargingCard />
//         </TouchableOpacity>
//       )}
//       keyExtractor={(item, index) => index.toString()}
//       horizontal
//       showsHorizontalScrollIndicator={false}
//     />
//   );
// };

// export default Banners;

// const styles = StyleSheet.create({
//   chargerCard: {
//     width: w * 0.8,
//     height: h * 0.18,
//     marginLeft: w * 0.03,
//     backgroundColor: pallette.white,
//     borderRadius: w * 0.05,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: h * 0.01,
//     elevation: 5,
//     marginBottom: h * 0.05
//   },
// });
