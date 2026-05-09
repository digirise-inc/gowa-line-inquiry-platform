import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { DemoBanner } from "@/components/layout/demo-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ゴワ 業務管理プラットフォーム",
  description: "リカーショップゴワ Phase 1.0 — LINE 問い合わせ進捗管理",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <DemoBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
