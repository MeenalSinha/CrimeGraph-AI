import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { colors, severityColor } from "@/lib/theme";
import CacheBadge from "@/components/CacheBadge";

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cacheInfo, setCacheInfo] = useState({ fromCache: false, cachedAt: null as number | null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.alerts();
      setAlerts(r.data.alerts || []);
      setCacheInfo({ fromCache: r.fromCache, cachedAt: r.cachedAt });
    } catch {
      // handled by empty state
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={alerts}
        keyExtractor={(_, i) => String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={<CacheBadge fromCache={cacheInfo.fromCache} cachedAt={cacheInfo.cachedAt} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No active alerts -- pull to refresh once connected.</Text>}
        renderItem={({ item }) => {
          const color = severityColor[item.severity] || colors.blue;
          return (
            <View style={[styles.card, { borderColor: color + "66", backgroundColor: color + "14" }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.time}>{item.created_minutes_ago}m ago</Text>
              </View>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.type}>{item.type.replace(/_/g, " ").toUpperCase()}{item.ward ? ` -- ${item.ward}` : ""}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base },
  card: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  title: { color: colors.white, fontSize: 13, fontWeight: "600", flex: 1 },
  time: { color: colors.muted, fontSize: 9 },
  message: { color: "#C9D4E8", fontSize: 11.5, marginTop: 4, lineHeight: 16 },
  type: { color: colors.muted, fontSize: 9, marginTop: 8, letterSpacing: 0.5 },
  emptyText: { color: colors.muted, fontSize: 12, padding: 16, textAlign: "center" },
});
