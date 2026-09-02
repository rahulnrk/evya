import React from "react";
import { View, StyleSheet } from "react-native";
import WebView from "react-native-webview";

const WebMapSection = () => {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri:'https://web.evyaa.com/mapsection'}}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default WebMapSection;