import { SUPPORTED_PLATFORMS } from "@/lib/brand";

const steps = [
  { n: "1", t: "URLを貼る", d: "公開投稿のリンクを入力欄に貼り付けます。" },
  { n: "2", t: "保存を押す", d: "対応サービスか検証し、メディア情報を取得します。" },
  { n: "3", t: "ダウンロード", d: "サムネイルを確認し、個別または一括で保存します。" },
];

export function HowItWorks() {
  return (
    <section className="mt-12 space-y-6">
      <h2 className="text-center text-lg font-semibold text-slate-800">使い方</h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {s.n}
            </div>
            <h3 className="font-medium text-slate-800">{s.t}</h3>
            <p className="mt-1 text-sm text-slate-500">{s.d}</p>
          </li>
        ))}
      </ol>
      <p className="text-center text-sm text-slate-500">
        対応: {SUPPORTED_PLATFORMS.map((p) => p.label).join(" / ")}
      </p>
    </section>
  );
}
