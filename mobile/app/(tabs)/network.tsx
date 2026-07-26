import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import CacheBadge from "@/components/CacheBadge";

export default function NetworkScreen() {
  const [centrality, setCentrality] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [cacheInfo, setCacheInfo] = useState({ fromCache: false, cachedAt: null as number | null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, g] = await Promise.all([api.centrality(), api.communities()]);
      setCentrality(c.data.ranking || []);
      setCommunities(g.data.communities || []);
      setCacheInfo({ fromCache: c.fromCache || g.fromCache, cachedAt: c.cachedAt ?? g.cachedAt });
    } catch {
      // handled by empty states below
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
      <Text style={styles.note}>
        Full interactive graph exploration is available on the web dashboard. This view gives field
        officers the two most operationally useful summaries on the go.
      </Text>

      <Text style={styles.sectionTitle}>TOP INFLUENCE -- CENTRALITY RANKING</Text>
      <View style={styles.panel}>
        {centrality.map((c) => (
          <View key={c.person_id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{c.label}</Text>
              <Text style={styles.rowSub}>{c.gang || "No gang flagged"}</Text>
            </View>
            <Text style={styles.rowScore}>{c.influence_score}</Text>
          </View>
        ))}
        {centrality.length === 0 && <Text style={styles.emptyText}>No data available.</Text>}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>DETECTED CLUSTERS</Text>
      <View style={styles.panel}>
        {communities.map((c) => (
          <View key={c.community_id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{c.community_id}</Text>
              <Text style={styles.rowSub}>
                {c.suspected_gang ? `Suspected: ${c.suspected_gang}` : "Unlabeled"} -- {c.person_of_interest_count} POIs
              </Text>
            </View>
            <Text style={styles.rowScore}>{c.size}</Text>
          </View>
        ))}
        {communities.length === 0 && <Text style={styles.emptyText}>No data available.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 16 },
  sectionTitle: { color: colors.white, fontSize: 11, letterSpacing: 1, marginBottom: 8, fontWeight: "600" },
  panel: { backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderBottomColor: colors.line, borderBottomWidth: 1 },
  rowTitle: { color: colors.white, fontSize: 12.5, fontWeight: "500" },
  rowSub: { color: colors.muted, fontSize: 10, marginTop: 2 },
  rowScore: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  emptyText: { color: colors.muted, fontSize: 12, padding: 16, textAlign: "center" },
});
