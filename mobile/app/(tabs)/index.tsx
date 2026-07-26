import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { colors, riskBandColor } from "@/lib/theme";
import CacheBadge from "@/components/CacheBadge";

export default function DashboardScreen() {
  const [kpis, setKpis] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [cacheInfo, setCacheInfo] = useState({ fromCache: false, cachedAt: null as number | null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [k, h] = await Promise.all([api.kpis(), api.hotspots()]);
      setKpis(k.data);
      setHotspots(h.data.hotspots || []);
      setCacheInfo({ fromCache: k.fromCache || h.fromCache, cachedAt: k.cachedAt ?? h.cachedAt });
    } catch {
      // no network and no cache -- screen just shows empty state below
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <CacheBadge fromCache={cacheInfo.fromCache} cachedAt={cacheInfo.cachedAt} />

      <View style={styles.kpiGrid}>
        <KpiCard label="Total Incidents (7d)" value={kpis?.total_incidents?.value} change={kpis?.total_incidents?.change_pct} />
        <KpiCard label="Active Investigations" value={kpis?.active_investigations?.value} change={kpis?.active_investigations?.change_pct} />
        <KpiCard label="Wanted Persons" value={kpis?.wanted_persons?.value} change={kpis?.wanted_persons?.change_pct} />
        <KpiCard label="High Risk Areas" value={kpis?.high_risk_areas?.value} change={kpis?.high_risk_areas?.change_pct} />
      </View>

      <Text style={styles.sectionTitle}>WARD RISK RANKING</Text>
      <View style={styles.panel}>
        {hotspots.slice(0, 8).map((h) => (
          <View key={h.ward} style={styles.hotspotRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotspotWard}>{h.ward}</Text>
              <Text style={styles.hotspotSub}>{h.likely_crime_types?.[0]?.crime_type}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.hotspotScore, { color: riskBandColor[h.risk_band] || colors.blue }]}>
                {h.risk_score}
              </Text>
              <Text style={styles.hotspotBand}>{h.risk_band}</Text>
            </View>
          </View>
        ))}
        {hotspots.length === 0 && <Text style={styles.emptyText}>No data available -- pull to refresh once connected.</Text>}
      </View>
    </ScrollView>
  );
}

function KpiCard({ label, value, change }: { label: string; value: any; change?: number }) {
  const positive = (change ?? 0) >= 0;
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Text style={styles.kpiValue}>{value ?? "--"}</Text>
        {change !== undefined && (
          <Text style={{ color: positive ? colors.emerald : colors.red, fontSize: 10 }}>
            {positive ? "+" : ""}{change}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  kpiCard: { flexBasis: "47%", backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 12 },
  kpiLabel: { color: colors.muted, fontSize: 9, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" },
  kpiValue: { color: colors.white, fontSize: 20, fontWeight: "700" },
  sectionTitle: { color: colors.white, fontSize: 11, letterSpacing: 1, marginBottom: 8, fontWeight: "600" },
  panel: { backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 4 },
  hotspotRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 10, borderBottomColor: colors.line, borderBottomWidth: 1 },
  hotspotWard: { color: colors.white, fontSize: 13, fontWeight: "500" },
  hotspotSub: { color: colors.muted, fontSize: 10, marginTop: 2 },
  hotspotScore: { fontSize: 15, fontWeight: "700" },
  hotspotBand: { color: colors.muted, fontSize: 9 },
  emptyText: { color: colors.muted, fontSize: 12, padding: 16, textAlign: "center" },
});
