import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e5ea",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="DollarScreen"
        options={{
          title: "دالر",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="dollar" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CarScreen"
        options={{
          title: "خودروها",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="car" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ShippingScreen"
        options={{
          title: "حمل و نقل",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="truck" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}