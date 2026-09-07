import { Platform } from "react-native";

/** Base URL for Next.js `/api` (no trailing slash). Example: http://10.0.2.2:3000/api */
const rawApi =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (Platform.OS === "android" ? "http://10.0.2.2:3000/api" : "http://127.0.0.1:3000/api");

export const API_BASE_URL = rawApi;

/** Deployed or local web origin for terms/privacy WebBrowser links */
export const WEB_ORIGIN =
  process.env.EXPO_PUBLIC_WEB_ORIGIN?.replace(/\/$/, "") ||
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://127.0.0.1:3000");

export const BRAND_NAME = process.env.EXPO_PUBLIC_SITE_NAME || "メディア保存";
export const BRAND_TAGLINE = "公開投稿の画像・動画をアプリで保存";

export const SUPPORTED_PLATFORMS = ["X (Twitter)", "Instagram", "TikTok", "YouTube"] as const;

/** Google AdMob sample App IDs (always safe for test builds) */
export const TEST_ADMOB_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";
export const TEST_ADMOB_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";

/** Google sample banner unit IDs */
export const TEST_BANNER_ANDROID = "ca-app-pub-3940256099942544/6300978111";
export const TEST_BANNER_IOS = "ca-app-pub-3940256099942544/2934735716";

export function getBannerUnitId(): string {
  const fromEnv =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS
      : process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return Platform.OS === "ios" ? TEST_BANNER_IOS : TEST_BANNER_ANDROID;
}

export function useTestAds(): boolean {
  return process.env.EXPO_PUBLIC_ADMOB_USE_TEST !== "0";
}
