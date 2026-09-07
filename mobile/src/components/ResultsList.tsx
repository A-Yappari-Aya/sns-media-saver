import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { MediaItem, ResolveSuccess } from "../types";
import { colors } from "../theme";
import { AdBanner } from "./AdBanner";

function formatDuration(sec?: number) {
  if (sec == null || Number.isNaN(sec)) return null;
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function formatSize(bytes?: number) {
  if (bytes == null || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function metaLine(item: MediaItem) {
  const parts: string[] = [];
  if (item.type) parts.push(item.type);
  if (item.width && item.height) parts.push(`${item.width}×${item.height}`);
  const dur = formatDuration(item.duration);
  if (dur) parts.push(dur);
  const size = formatSize(item.filesize);
  if (size) parts.push(size);
  if (item.ext) parts.push(item.ext);
  return parts.join(" · ");
}

async function downloadAndShare(item: MediaItem, index: number) {
  const remote = item.downloadUrl || item.url;
  const ext = item.ext || "bin";
  const base = (item.title || `media-${index + 1}`)
    .replace(/[^\w\-一-龥ぁ-んァ-ヶ]/g, "_")
    .slice(0, 40);
  try {
    const destination = new File(Paths.cache, `${base}.${ext}`);
    const file = await File.downloadFileAsync(remote, destination, { idempotent: true });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        dialogTitle: "メディアを保存 / 共有",
        mimeType:
          item.type === "image"
            ? `image/${ext}`
            : item.type === "video"
              ? `video/${ext}`
              : undefined,
      });
      return;
    }
  } catch {
    // fall through to open URL
  }
  await Linking.openURL(remote);
}

export function ResultsList({ data }: { data: ResolveSuccess }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onDownload(item: MediaItem, index: number) {
    const key = item.id || String(index);
    setBusyId(key);
    try {
      await downloadAndShare(item, index);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("ダウンロード失敗", msg || "保存に失敗しました。ブラウザで開いてみてください。", [
        { text: "ブラウザで開く", onPress: () => Linking.openURL(item.downloadUrl || item.url) },
        { text: "閉じる", style: "cancel" },
      ]);
    } finally {
      setBusyId(null);
    }
  }

  async function onDownloadAll() {
    for (let i = 0; i < data.items.length; i++) {
      await onDownload(data.items[i], i);
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerCard}>
        <Text style={styles.platform}>{data.platform}</Text>
        <Text style={styles.title}>{data.title || "メディアが見つかりました"}</Text>
        {!!data.author && <Text style={styles.author}>@{data.author}</Text>}
        <Text style={styles.source} numberOfLines={2}>
          {data.sourceUrl}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={onDownloadAll}>
          <Text style={styles.primaryBtnText}>全部ダウンロード / 共有</Text>
        </Pressable>
      </View>

      <AdBanner placement="results" />

      {data.items.map((item, i) => {
        const key = item.id || String(i);
        const busy = busyId === key;
        return (
          <View key={key} style={styles.card}>
            <View style={styles.thumbWrap}>
              {item.thumbnail || item.type === "image" ? (
                <Image
                  source={{ uri: item.thumbnail || item.url }}
                  style={styles.thumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbFallbackText}>{item.type || "media"}</Text>
                </View>
              )}
            </View>
            <Text style={styles.meta}>{metaLine(item)}</Text>
            <Pressable
              style={[styles.secondaryBtn, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => onDownload(item, i)}
            >
              {busy ? (
                <ActivityIndicator color={colors.brand700} />
              ) : (
                <Text style={styles.secondaryBtnText}>ダウンロード / 共有</Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, gap: 12 },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: 16,
  },
  platform: {
    color: colors.brand600,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: { marginTop: 4, fontSize: 18, fontWeight: "700", color: colors.slate900 },
  author: { marginTop: 2, color: colors.slate500, fontSize: 13 },
  source: { marginTop: 6, color: colors.slate400, fontSize: 11 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: colors.brand600,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    overflow: "hidden",
    paddingBottom: 12,
  },
  thumbWrap: { aspectRatio: 16 / 9, backgroundColor: colors.slate100 },
  thumb: { width: "100%", height: "100%" },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  thumbFallbackText: { color: colors.slate400 },
  meta: { paddingHorizontal: 12, paddingTop: 10, color: colors.slate600, fontSize: 13 },
  secondaryBtn: {
    marginTop: 10,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brand200,
    backgroundColor: colors.brand50,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.brand700, fontWeight: "700", fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
});
