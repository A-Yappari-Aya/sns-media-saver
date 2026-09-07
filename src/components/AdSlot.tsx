"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  slotEnv: "TOP" | "RESULT";
  className?: string;
};

export function AdSlot({ slotEnv, className = "" }: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const slot =
    slotEnv === "TOP"
      ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP || ""
      : process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT || "";
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* ignore */
    }
  }, [client, slot]);

  if (!client || !slot) {
    return (
      <div
        className={`flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 ${className}`}
        aria-label="広告プレースホルダー"
      >
        広告スペース（AdSense 未設定）
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
