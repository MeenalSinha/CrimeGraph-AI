import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import CacheBadge from "@/components/CacheBadge";

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [brief, setBrief] = useState<any>(null);
  const [cacheInfo, setCacheInfo] = useState({ fromCache: false, cachedAt: null as number | null });
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .caseDetail(id)
      .then((r) => {
        setBrief(r.data);
        setCacheInfo({ fromCache: r.fromCache, cachedAt: r.cachedAt });
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.red }}>Case not found, and no cached copy is available offline.</Text>
      </View>
    );
  }

  if (!brief) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <CacheBadge fromCache={cacheInfo.fromCache} cachedAt={cacheInfo.cachedAt} />

      <View style={styles.panel}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={styles.firId}>{brief.fir_id}</Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskBadgeText}>Risk {brief.case_risk_score}/100</Text>
          </View>
        </View>
        <Text style={styles.summary}>{brief.summary}</Text>
        <View style={styles.metaGrid}>
          <Meta label="Crime Type" value={brief.crime_type} />
          <Meta label="Ward" value={brief.ward} />
          <Meta label="Severity" value={`${brief.severity}/5`} />
          <Meta label="Weapon" value={brief.weapon} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>AI INVESTIGATION SUGGESTIONS</Text>
      <View style={styles.panel}>
        {brief.next_steps?.map((s: string, i: number) => (
          <Text key={i} style={styles.listItem}>
            {String(i + 1).padStart(2, "0")}. {s}
          </Text>
        ))}
      </View>

      {brief.missing_evidence?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>MISSING EVIDENCE FLAGS</Text>
          <View style={styles.panel}>
            {brief.missing_evidence.map((s: string, i: number) => (
              <Text key={i} style={[styles.listItem, { color: colors.accent }]}>! {s}</Text>
            ))}
          </View>
        </>
      )}

      {brief.suspect && (
        <>
          <Text style={styles.sectionTitle}>SUSPECT LINKED</Text>
          <View style={styles.panel}>
            <Text style={styles.rowTitle}>{brief.suspect.name}</Text>
            <Text style={styles.rowSub}>{brief.suspect.person_id} -- risk {brief.suspect.risk_score} -- {brief.suspect.prior_case_count} prior cases</Text>
            {brief.suspect.gang_affiliation ? <Text style={[styles.rowSub, { color: colors.accent }]}>Gang: {brief.suspect.gang_affiliation}</Text> : null}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "48%", marginBottom: 8 }}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base },
  center: { flex: 1, backgroundColor: colors.base, alignItems: "center", justifyContent: "center", padding: 20 },
  panel: { backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 16 },
  firId: { color: colors.white, fontSize: 16, fontWeight: "700" },
  riskBadge: { borderColor: colors.accent + "66", borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  riskBadgeText: { color: colors.accent, fontSize: 10 },
  summary: { color: "#C9D4E8", fontSize: 12.5, lineHeight: 18, marginBottom: 12 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  metaLabel: { color: colors.muted, fontSize: 9 },
  metaValue: { color: colors.white, fontSize: 12, marginTop: 2 },
  sectionTitle: { color: colors.white, fontSize: 11, letterSpacing: 1, marginBottom: 8, fontWeight: "600" },
  listItem: { color: "#C9D4E8", fontSize: 12, lineHeight: 20 },
  rowTitle: { color: colors.white, fontSize: 13, fontWeight: "600" },
  rowSub: { color: colors.muted, fontSize: 11, marginTop: 4 },
});
