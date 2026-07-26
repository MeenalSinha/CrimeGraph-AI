import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getToken } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function Index() {
  const [checked, setChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getToken().then((t) => {
      setHasToken(!!t);
      setChecked(true);
    });
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.base, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={hasToken ? "/(tabs)" : "/login"} />;
}
