import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${BRAND_NAME}`,
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p className="text-sm text-slate-500">最終更新: 2026-09-07</p>

      <h2 className="mt-6 text-lg font-semibold">収集する情報</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>利用者が入力した投稿URL（メディア解決処理のため一時的にワーカーへ送信）</li>
        <li>アクセスログ（IPアドレス、User-Agent、日時）— レート制限・不正防止目的</li>
        <li>広告配信に伴うCookie等（AdSense設定時）</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">利用目的</h2>
      <p className="text-sm">サービス提供、障害対応、不正利用防止、広告表示のため。</p>

      <h2 className="mt-6 text-lg font-semibold">保存期間</h2>
      <p className="text-sm">
        投稿URLは解決処理に必要な間のみ扱い、永続的なメディアアーカイブは行いません（実装依存の一時キャッシュを除く）。
      </p>

      <h2 className="mt-6 text-lg font-semibold">第三者提供</h2>
      <p className="text-sm">
        法令に基づく場合を除き、個人を特定できる情報を販売しません。ホスティング・広告・解析のため委託先がデータを処理する場合があります。
      </p>

      <h2 className="mt-6 text-lg font-semibold">お問い合わせ</h2>
      <p className="text-sm">本ポリシーに関するお問い合わせは、リポジトリの Issues または運営者連絡先までご連絡ください。</p>
    </article>
  );
}
