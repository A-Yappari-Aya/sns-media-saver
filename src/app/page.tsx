import { AdSlot } from "@/components/AdSlot";
import { HowItWorks } from "@/components/HowItWorks";
import { UrlForm } from "@/components/UrlForm";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export default function HomePage() {
  return (
    <div>
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {BRAND_NAME}
        </h1>
        <p className="mt-2 text-slate-600">{BRAND_TAGLINE}</p>
      </section>

      <AdSlot slotEnv="TOP" className="mb-6" />

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
        <UrlForm />
      </div>

      <HowItWorks />

      <p className="mt-10 text-center text-xs text-slate-400">
        公開されている投稿のみ対象です。ログインが必要なコンテンツや著作権で保護された作品の無断利用はご遠慮ください。
      </p>
    </div>
  );
}
