import SafeScreen from "@/components/SafeScreen";
import React from "react";
import {
  ScrollView,
  StyleSheet,
} from "react-native";
import ManagementScreen from "@/components/ManagementScreen";

// ========== CONSTANTS ==========
const COLORS = {
  primary: "#007AFF",
  danger: "#FF3B30",
  success: "#34C759",
  text: {
    primary: "#1a1a1a",
    secondary: "#666",
    tertiary: "#999",
  },
  background: {
    primary: "#fff",
    secondary: "#f5f5f5",
    tertiary: "#fafafa",
  },
  border: "#e0e0e0",
} as const;
const ShippingScreen = () => {
  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        <ManagementScreen mode="shipping"/>
      </ScrollView>
    </SafeScreen>
  );
};

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
});

export default ShippingScreen;
