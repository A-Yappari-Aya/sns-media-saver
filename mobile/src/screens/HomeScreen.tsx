import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { resolveMediaUrl } from "../api/resolve";
import { AdBanner } from "../components/AdBanner";
import { ResultsList } from "../components/ResultsList";
import {
  API_BASE_URL,
  BRAND_NAME,
  BRAND_TAGLINE,
  SUPPORTED_PLATFORMS,
  WEB_ORIGIN,
} from "../constants/config";
import type { ResolveSuccess } from "../types";
import { colors } from "../theme";

type LegalKind = "terms" | "privacy" | null;

const LEGAL_TEXT: Record<"terms" | "privacy", { title: string; body: string }> = {
  terms: {
    title: "利用規約",
    body: `${BRAND_NAME}は、利用者が指定した公開投稿URLから技術的に取得可能なメディア情報を表示し、端末への保存・共有を支援するツールです。\n\n各SNS・動画サービスの利用規約および適用法令を遵守してください。非公開・限定公開・有料・著作権侵害となるコンテンツの取得・再配布を目的とした利用は禁止します。本サービスは第三者プラットフォームの非公式な抽出手法に依存するため、予告なく動作しなくなる場合があります。取得結果の完全性・継続性・合法性について保証しません。利用は自己責任とします。`,
  },
  privacy: {
    title: "プライバシーポリシー",
    body: `収集する情報: 入力した投稿URL（メディア解決のため一時的にサーバーへ送信）、アクセスログ（レート制限・不正防止）、広告配信に伴う識別子（AdMob設定時）。\n\n投稿URLは解決処理に必要な間のみ扱い、永続的なメディアアーカイブは行いません。法令に基づく場合を除き、個人を特定できる情報を販売しません。`,
  },
};

export function HomeScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolveSuccess | null>(null);
  const [legal, setLegal] = useState<LegalKind>(null);

  async function openLegal(kind: "terms" | "privacy") {
    const path = kind === "terms" ? "/terms" : "/privacy";
    try {
      await WebBrowser.openBrowserAsync(`${WEB_ORIGIN}${path}`);
    } catch {
      setLegal(kind);
    }
  }

  async function onSubmit() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await resolveMediaUrl(url);
      if (!data.ok) {
        setError(data.error || "取得に失敗しました。");
        return;
      }
      if (!data.items?.length) {
        setError(
          "ダウンロード可能なメディアが見つかりませんでした。非公開や削除済みの可能性があります。",
        );
        return;
      }
      setResult(data);
    } catch {
      setError(
        `通信エラーが発生しました。API (${API_BASE_URL}) とネットワークをご確認ください。`,
      );
    } finally {
      setLoading(false);
    }
  }

  if (legal) {
    const doc = LEGAL_TEXT[legal];
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.legalHeader}>
          <Pressable onPress={() => setLegal(null)} hitSlop={12}>
            <Text style={styles.link}>← 戻る</Text>
          </Pressable>
          <Text style={styles.legalTitle}>{doc.title}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.legalBody}>
          <Text style={styles.legalText}>{doc.body}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.brand}>{BRAND_NAME}</Text>
          <Text style={styles.tagline}>{BRAND_TAGLINE}</Text>
          <Text style={styles.platforms}>{SUPPORTED_PLATFORMS.join(" / ")}</Text>

          <AdBanner placement="home" />

          <Text style={styles.label}>投稿URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://x.com/... または Instagram / TikTok / YouTube"
            placeholderTextColor={colors.slate400}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!loading}
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
          <Pressable
            style={[styles.submit, (loading || !url.trim()) && styles.submitDisabled]}
            disabled={loading || !url.trim()}
            onPress={onSubmit}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.submitText}>取得中…</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>保存</Text>
            )}
          </Pressable>

          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.brand600} />
              <Text style={styles.loadingHint}>メディア情報を取得しています…</Text>
            </View>
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result && <ResultsList data={result} />}

          <View style={styles.footer}>
            <Pressable onPress={() => openLegal("terms")}>
              <Text style={styles.link}>利用規約</Text>
            </Pressable>
            <Text style={styles.dot}>·</Text>
            <Pressable onPress={() => openLegal("privacy")}>
              <Text style={styles.link}>プライバシー</Text>
            </Pressable>
          </View>
          <Text style={styles.apiHint}>API: {API_BASE_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 20, paddingBottom: 40 },
  brand: { fontSize: 28, fontWeight: "800", color: colors.slate900 },
  tagline: { marginTop: 6, fontSize: 14, color: colors.slate600 },
  platforms: { marginTop: 4, fontSize: 12, color: colors.slate400 },
  label: { marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: "600", color: colors.slate700 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.slate900,
  },
  submit: {
    marginTop: 12,
    backgroundColor: colors.brand600,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingCard: {
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: "center",
    gap: 12,
  },
  loadingHint: { color: colors.slate500, fontSize: 14 },
  errorBox: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.red200,
    backgroundColor: colors.red50,
    padding: 14,
  },
  errorText: { color: colors.red700, fontSize: 14 },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  link: { color: colors.brand600, fontWeight: "600", fontSize: 14 },
  dot: { color: colors.slate400 },
  apiHint: {
    marginTop: 8,
    textAlign: "center",
    color: colors.slate400,
    fontSize: 10,
  },
  legalHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 8 },
  legalTitle: { fontSize: 22, fontWeight: "800", color: colors.slate900 },
  legalBody: { paddingHorizontal: 20, paddingBottom: 40 },
  legalText: { fontSize: 14, lineHeight: 22, color: colors.slate700 },
});
