import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeScreenProps {
  children: ReactNode;
}

export default function SafeScreen({ children }: SafeScreenProps) {
  const insets = useSafeAreaInsets();

  return <View style={[styles.container, { paddingTop: insets.top }]}>{children}</View>;
}

interface Styles {
  container: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
});
