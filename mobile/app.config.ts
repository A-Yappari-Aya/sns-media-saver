import type { ExpoConfig, ConfigContext } from "expo/config";

const TEST_ANDROID = "ca-app-pub-3940256099942544~3347511713";
const TEST_IOS = "ca-app-pub-3940256099942544~1458002511";

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidAppId =
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID?.trim() || TEST_ANDROID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID?.trim() || TEST_IOS;

  return {
    ...config,
    name: "メディア保存",
    slug: "sns-media-saver",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "mediasaver",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mediasaver.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSUserTrackingUsageDescription:
          "広告の配信品質向上のため、トラッキング許可をお願いする場合があります。",
      },
    },
    android: {
      package: "com.mediasaver.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      permissions: ["com.google.android.gms.permission.AD_ID"],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-web-browser",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId,
          iosAppId,
          userTrackingUsageDescription:
            "広告の配信品質向上のため、トラッキング許可をお願いする場合があります。",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || undefined,
      },
    },
  };
};
