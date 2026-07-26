import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export default function CacheBadge({ fromCache, cachedAt }: { fromCache: boolean; cachedAt: number | null }) {
  if (!fromCache) return null;
  const minsAgo = cachedAt ? Math.max(0, Math.round((Date.now() - cachedAt) / 60000)) : null;
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        OFFLINE -- showing data cached {minsAgo !== null ? `${minsAgo}m ago` : "earlier"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,90,54,0.12)",
    borderColor: "rgba(255,90,54,0.4)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent2 },
  text: { color: colors.accent2, fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
});
