import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import CacheBadge from "@/components/CacheBadge";

const STATUS_COLOR: Record<string, string> = {
  "Under Investigation": colors.accent,
  "Chargesheet Filed": colors.blue,
  Closed: colors.emerald,
  Cold: colors.muted,
};

export default function CasesScreen() {
  const [cases, setCases] = useState<any[]>([]);
  const [cacheInfo, setCacheInfo] = useState({ fromCache: false, cachedAt: null as number | null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.cases();
      setCases(r.data.cases || []);
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
        data={cases}
        keyExtractor={(item) => item.fir_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={<CacheBadge fromCache={cacheInfo.fromCache} cachedAt={cacheInfo.cachedAt} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No cases available -- pull to refresh once connected.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/cases/${item.fir_id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.firId}>{item.fir_id}</Text>
              <Text style={styles.crimeType}>{item.crime_type} -- {item.ward}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={[styles.statusPill, { borderColor: STATUS_COLOR[item.status] || colors.line }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] || colors.muted }]}>{item.status}</Text>
              </View>
              <Text style={styles.severity}>Severity {item.severity}/5</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.panel,
    borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8,
  },
  firId: { color: colors.blue, fontSize: 13, fontWeight: "600" },
  crimeType: { color: colors.muted, fontSize: 11, marginTop: 2 },
  statusPill: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 9 },
  severity: { color: colors.muted, fontSize: 10, marginTop: 4 },
  emptyText: { color: colors.muted, fontSize: 12, padding: 16, textAlign: "center" },
});
