import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";

const WebViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { url, title } = route.params || {}; // receive url & optional title

  return (
    <View style={styles.container}>
  

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
};

export default WebViewScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
