import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";

const ErrorMessage = ({ message }) => {
  const [show, setShow] = useState(false); // controls actual render
  const duration = 3000;
  useEffect(() => {
    if (message) {
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false); // disappear after duration
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!show) return null;

  return (
    <Animated.View style={[styles.container]}>
      <View style={styles.messageBox}>
        <Text style={styles.text}>{message}</Text>
        {/* <TouchableOpacity style={styles.button} onPress={closeMessage}>
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity> */}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    zIndex: 999,
  },
  messageBox: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 250,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: "black",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    marginTop: 4,
    backgroundColor: "red",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default ErrorMessage;
