import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `利用規約 | ${BRAND_NAME}`,
};

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p className="text-sm text-slate-500">最終更新: 2026-09-07</p>

      <h2 className="mt-6 text-lg font-semibold">1. サービス概要</h2>
      <p>
        {BRAND_NAME}
        （以下「本サービス」）は、利用者が指定した公開投稿URLから、技術的に取得可能なメディア情報を表示し、ブラウザ経由での保存を支援するツールです。
      </p>

      <h2 className="mt-6 text-lg font-semibold">2. 免責・禁止事項</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>各SNS・動画サービスの利用規約および適用法令を遵守してください。</li>
        <li>非公開・限定公開・有料・著作権侵害となるコンテンツの取得・再配布を目的とした利用は禁止します。</li>
        <li>本サービスは第三者プラットフォームの非公式な抽出手法に依存するため、予告なく動作しなくなる場合があります。</li>
        <li>取得結果の完全性・継続性・合法性について保証しません。利用は自己責任とします。</li>
        <li>過度なリクエスト、スクレイピング自動化、サービス妨害行為を禁止します。</li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">3. 広告</h2>
      <p className="text-sm">
        本サービスには第三者配信の広告（Google AdSense等）が掲載される場合があります。広告配信事業者はCookie等を使用することがあります。
      </p>

      <h2 className="mt-6 text-lg font-semibold">4. 変更</h2>
      <p className="text-sm">本規約は予告なく変更されることがあります。変更後の利用をもって同意したものとみなします。</p>
    </article>
  );
}
