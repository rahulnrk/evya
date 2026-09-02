import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { pallette } from "../utils/pallette";

interface AlertMessageProps {
  message: string;
  onClose?: (confirmed: boolean) => void;
  showConfirm?: boolean; // new prop for confirmation
}

const AlertMessage = ({ message, onClose, showConfirm = false }: AlertMessageProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
    }
  }, [message]);

  const handleClose = (confirmed: boolean) => {
    setVisible(false);
    onClose && onClose(confirmed);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.container}>
        <View style={styles.messageBox}>
          <Text style={styles.text}>{message}</Text>
          <View style={styles.buttonRow}>
            {showConfirm ? (
              <>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "gray" }]}
                  onPress={() => handleClose(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor:  pallette.primary }]}
                  onPress={() => handleClose(true)}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: pallette.primary }]}
                onPress={() => handleClose(true)}
              >
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  messageBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: 280,
    alignItems: "center",
  },
  text: {
    color: "black",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default AlertMessage;
