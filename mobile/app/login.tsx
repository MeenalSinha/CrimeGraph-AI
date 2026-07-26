import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { api, setToken } from "@/lib/api";
import { colors } from "@/lib/theme";

const DEMO_ACCOUNTS = ["admin", "commissioner", "inspector", "analyst", "viewer"];

export default function LoginScreen() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    try {
      const r = await api.login(username, password);
      await setToken(r.access_token);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Login failed", "Check your username and password, or that the backend is reachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CG</Text>
        </View>
        <Text style={styles.title}>CRIMEGRAPH AI</Text>
        <Text style={styles.subtitle}>INTELLIGENCE DIVISION -- MOBILE</Text>

        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholderTextColor={colors.muted}
        />

        <TouchableOpacity style={styles.button} onPress={login} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
        </TouchableOpacity>

        <Text style={styles.demoLabel}>DEMO ACCOUNTS (password: demo1234)</Text>
        <View style={styles.demoRow}>
          {DEMO_ACCOUNTS.map((a) => (
            <TouchableOpacity key={a} style={styles.demoChip} onPress={() => setUsername(a)}>
              <Text style={styles.demoChipText}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base, alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 380, backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 10, padding: 24 },
  badge: { width: 44, height: 44, borderRadius: 6, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  badgeText: { color: colors.base, fontWeight: "700", fontSize: 16 },
  title: { color: colors.white, fontSize: 16, fontWeight: "700", letterSpacing: 1.5 },
  subtitle: { color: colors.muted, fontSize: 10, letterSpacing: 1.5, marginBottom: 20 },
  label: { color: colors.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: "rgba(0,0,0,0.3)", borderColor: colors.line, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, color: colors.white, fontSize: 13 },
  button: { backgroundColor: colors.accent, borderRadius: 6, paddingVertical: 12, alignItems: "center", marginTop: 18 },
  buttonText: { color: colors.base, fontWeight: "700", fontSize: 13 },
  demoLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  demoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  demoChip: { borderColor: colors.line, borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  demoChipText: { color: colors.muted, fontSize: 10 },
});
