import SafeScreen from "@/components/SafeScreen";
import React from "react";
import {
  ScrollView,
  StyleSheet,
} from "react-native";

import ManagementScreen from "@/components/ManagementScreen";
import { Colors } from "@/constants/theme";
const CarScreen: React.FC = () => {
  return (
    <SafeScreen>
      <ScrollView style={styles.container}>
        <ManagementScreen mode="cars"/>
      </ScrollView>
    </SafeScreen>
  );
};

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  }});

export default CarScreen;
