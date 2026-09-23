import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TSUN//OS. TradFi Tsundere Workstation",
  description:
    "Enter TSUN's workstation: a financial terminal with a hostile AI, live markets, a public demo portfolio, and lore. Chat is the flagship.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-tsun-void text-tsun-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
