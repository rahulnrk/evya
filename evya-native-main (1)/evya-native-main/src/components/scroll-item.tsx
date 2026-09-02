import { FlatList, Image, StyleSheet, Text, View } from 'react-native'
import React, { useRef } from 'react'
import { w } from '../constants/dimensions';
import { pallette } from '../utils/pallette';

const ScrollItem = ({
    data,
    setActiveindex,
    height,
    width,
    onChangeBanner,
    resizemode,
    radius
  }: {
    data: any;
    setActiveindex?: Function;
    height?: number;
    width?: number;
    onChangeBanner?: any;
    resizemode?: string;
    radius?: number;
  }) => {
    const flatListRef = useRef(null);
  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={({item}) => (
        <View style={styles.item}>

        </View>
      )}
      keyExtractor={item => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      onMomentumScrollEnd={event => {
        const newIndex = Math.round(
          event.nativeEvent.contentOffset.x /
            event.nativeEvent.layoutMeasurement.width,
        );
        setActiveindex(newIndex);
        // onChangeBanner()
      }}
      initialNumToRender={1}
      viewabilityConfig={{viewAreaCoveragePercentThreshold: 50}}
    />
  )
}

export default ScrollItem

const styles = StyleSheet.create({
    item: {
        padding: w * 0.02,
        margin: w * 0.02,
        backgroundColor: pallette.lightgrey
    }
})