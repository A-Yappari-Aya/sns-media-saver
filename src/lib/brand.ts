export const BRAND_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "メディア保存";
export const BRAND_TAGLINE = "公開投稿の画像・動画をブラウザで保存";
export const SUPPORTED_PLATFORMS = [
  { id: "x", label: "X (Twitter)", hosts: ["x.com", "twitter.com"] },
  { id: "instagram", label: "Instagram", hosts: ["instagram.com", "www.instagram.com"] },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"] },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"] },
] as const;
