"use client";

import type { MediaItem, ResolveSuccess } from "@/lib/types";
import { AdSlot } from "./AdSlot";

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

function downloadOne(item: MediaItem, index: number) {
  const a = document.createElement("a");
  a.href = item.downloadUrl || item.url;
  a.download = item.title
    ? `${item.title.slice(0, 40)}.${item.ext || "bin"}`
    : `media-${index + 1}.${item.ext || "bin"}`;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function downloadAll(items: MediaItem[]) {
  for (let i = 0; i < items.length; i++) {
    downloadOne(items[i], i);
    await new Promise((r) => setTimeout(r, 400));
  }
}

export function Results({ data }: { data: ResolveSuccess }) {
  return (
    <section className="mt-8 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-600">{data.platform}</p>
            <h2 className="text-lg font-semibold text-slate-900">
              {data.title || "メディアが見つかりました"}
            </h2>
            {data.author && <p className="text-sm text-slate-500">@{data.author}</p>}
            <p className="mt-1 text-xs text-slate-400 break-all">{data.sourceUrl}</p>
          </div>
          <button
            type="button"
            onClick={() => downloadAll(data.items)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            全部ダウンロード
          </button>
        </div>
      </div>

      <AdSlot slotEnv="RESULT" />

      <ul className="grid gap-4 sm:grid-cols-2">
        {data.items.map((item, i) => (
          <li
            key={item.id || i}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative aspect-video bg-slate-100">
              {item.thumbnail || item.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail || item.url}
                  alt={item.title || `media ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  {item.type || "media"}
                </div>
              )}
            </div>
            <div className="space-y-2 p-3">
              <p className="text-sm text-slate-600">{metaLine(item)}</p>
              <button
                type="button"
                onClick={() => downloadOne(item, i)}
                className="w-full rounded-lg border border-brand-200 bg-brand-50 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                ダウンロード
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
