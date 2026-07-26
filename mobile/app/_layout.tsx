import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.panel },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: "600", fontSize: 14 },
          contentStyle: { backgroundColor: colors.base },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cases/[id]" options={{ title: "Case Detail" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
