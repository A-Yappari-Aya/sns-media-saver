import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 text-center text-sm text-slate-500">
        <p className="mb-2">
          © {new Date().getFullYear()} {BRAND_NAME}. 公開コンテンツの保存支援ツールです。
        </p>
        <p className="mb-3 text-xs">
          各プラットフォームの利用規約・著作権を遵守してください。非公開・著作権侵害コンテンツの取得は想定していません。
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/terms" className="hover:text-brand-600">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-brand-600">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </footer>
  );
}
