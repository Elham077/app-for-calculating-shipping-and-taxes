import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { initDB } from "@/helper/db";

export default function RootLayout() {
  const createDbIfNeeded = async (db:any) => {
    console.log("Initializing database...");
    await initDB(); // پاس دادن دیتابیس فعال (db ignored because initDB expects no args)
  };

  return (
    <>
      <SQLiteProvider databaseName="local.db" onInit={createDbIfNeeded}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(screen)" options={{ headerShown: false }} />
        </Stack>
      </SQLiteProvider>
      <StatusBar style="auto" />
    </>
  );
}
