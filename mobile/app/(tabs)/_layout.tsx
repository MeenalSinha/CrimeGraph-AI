import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "600", fontSize: 14 },
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Command Center",
          tabBarLabel: "Overview",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: "Investigations",
          tabBarLabel: "Cases",
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: "Intelligence Graph",
          tabBarLabel: "Network",
          tabBarIcon: ({ color, size }) => <Ionicons name="git-network-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarLabel: "Alerts",
          tabBarIcon: ({ color, size }) => <Ionicons name="warning-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
