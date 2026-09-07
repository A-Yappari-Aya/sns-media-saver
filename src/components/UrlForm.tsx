"use client";

import { FormEvent, useState } from "react";
import type { ResolveResponse, ResolveSuccess } from "@/lib/types";
import { Results } from "./Results";

export function UrlForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolveSuccess | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as ResolveResponse;
      if (!data.ok) {
        setError(data.error || "取得に失敗しました。");
        return;
      }
      if (!data.items?.length) {
        setError("ダウンロード可能なメディアが見つかりませんでした。非公開や削除済みの可能性があります。");
        return;
      }
      setResult(data);
    } catch {
      setError("通信エラーが発生しました。ネットワークをご確認ください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="post-url" className="block text-sm font-medium text-slate-700">
          投稿URL
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="post-url"
            type="url"
            inputMode="url"
            placeholder="https://x.com/... または Instagram / TikTok / YouTube"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base outline-none ring-brand-500 focus:ring-2"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "取得中…" : "保存"}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {result && <Results data={result} />}
    </div>
  );
}
