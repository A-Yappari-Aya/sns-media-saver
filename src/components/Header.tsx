import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export function Header() {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
            保
          </span>
          <span>{BRAND_NAME}</span>
        </Link>
        <nav className="flex gap-4 text-sm text-slate-600">
          <Link href="/terms" className="hover:text-brand-600">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-brand-600">
            プライバシー
          </Link>
        </nav>
      </div>
    </header>
  );
}
