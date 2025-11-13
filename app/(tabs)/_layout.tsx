import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="cog" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Shipping"
        options={{
          title: "Shipping",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="ship" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ImaratTax"
        options={{
          title: "ImaratTax",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="money" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
