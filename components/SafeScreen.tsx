import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SafeScreenProps {
  children: ReactNode;
  style?: ViewStyle;
}

export default function SafeScreen({ children, style }: SafeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface Styles {
  container: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: "#fff", // می‌توانید رنگ دلخواه را تغییر دهید
  },
});
