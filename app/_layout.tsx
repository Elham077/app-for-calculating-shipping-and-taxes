import { initDB, initFinalCarPricesTable } from "@/db/db";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const prepareDB = async () => {
      try {
        // آماده‌سازی جداول اصلی
        await initFinalCarPricesTable();
        // آماده‌سازی دیتابیس
        await initDB();
        setDbReady(true);
        console.log("Database ready!");
      } catch (error) {
        console.error("DB initialization failed:", error);
      }
    };
    prepareDB();
  }, []);

  if (!dbReady) {
    // نمایش لودینگ تا دیتابیس آماده شود
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <SQLiteProvider databaseName="local.db">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(screen)" options={{ headerShown: false }} />
        </Stack>
      </SQLiteProvider>
      <StatusBar style="auto" />
    </>
  );
}
