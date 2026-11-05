import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { getBannerUnitId, useTestAds, TEST_BANNER_ANDROID, TEST_BANNER_IOS } from "../constants/config";
import { colors } from "../theme";

type Props = {
  placement: "home" | "results";
};

/**
 * AdMob banner. Requires a development/production build (not Expo Go).
 * Falls back to a placeholder when the native module is unavailable or load fails.
 */
export function AdBanner({ placement }: Props) {
  const [failed, setFailed] = useState(false);
  const [Ads, setAds] = useState<{
    BannerAd: React.ComponentType<{
      unitId: string;
      size: string;
      onAdFailedToLoad?: (e: unknown) => void;
    }>;
    BannerAdSize: { LARGE_ANCHORED_ADAPTIVE_BANNER: string; ANCHORED_ADAPTIVE_BANNER: string; BANNER: string };
    TestIds: { BANNER: string; ADAPTIVE_BANNER: string };
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("react-native-google-mobile-ads");
        if (!mounted) return;
        try {
          await mod.default().initialize();
        } catch {
          // initialize may fail in Expo Go; still try to render if possible
        }
        setAds({
          BannerAd: mod.BannerAd as never,
          BannerAdSize: mod.BannerAdSize as never,
          TestIds: mod.TestIds as never,
        });
      } catch {
        if (mounted) setFailed(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (failed || !Ads) {
    return (
      <View style={styles.placeholder} accessibilityLabel={`広告プレースホルダー (${placement})`}>
        <Text style={styles.placeholderText}>広告エリア（AdMob）</Text>
        <Text style={styles.hint}>
          実機/開発ビルドで表示されます · {placement === "home" ? "ホーム" : "結果"}
        </Text>
      </View>
    );
  }

  const unitId = useTestAds()
    ? Ads.TestIds.ADAPTIVE_BANNER || Ads.TestIds.BANNER
    : getBannerUnitId() || (Platform.OS === "ios" ? TEST_BANNER_IOS : TEST_BANNER_ANDROID);

  const { BannerAd, BannerAdSize } = Ads;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER || BannerAdSize.ANCHORED_ADAPTIVE_BANNER || BannerAdSize.BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: "100%",
    marginVertical: 8,
  },
  placeholder: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: colors.slate50,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  placeholderText: {
    color: colors.slate500,
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    marginTop: 4,
    color: colors.slate400,
    fontSize: 11,
  },
});
