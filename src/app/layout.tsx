import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Topper101 — Crack IGNOU MAPC with AI",
  description:
    "AI-powered exam prep for IGNOU MAPC students. Past papers, model answers, and a personalized study plan.",
  keywords: ["IGNOU", "MAPC", "MA Psychology", "exam prep", "past papers", "AI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
