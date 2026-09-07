import { API_BASE_URL } from "../constants/config";
import type { ResolveResponse } from "../types";

export async function resolveMediaUrl(url: string): Promise<ResolveResponse> {
  const endpoint = `${API_BASE_URL}/resolve`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url: url.trim() }),
  });

  let data: ResolveResponse;
  try {
    data = (await res.json()) as ResolveResponse;
  } catch {
    return {
      ok: false,
      code: "BAD_RESPONSE",
      error: "サーバー応答の解析に失敗しました。",
    };
  }
  return data;
}
