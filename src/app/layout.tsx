import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";
import PostHogPageview from "./PostHogPageview";
import ThemeProvider from "./ThemeProvider";
import { Suspense } from "react";
import Script from "next/script";
import GlobalQueryFAB from './GlobalQueryFAB';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.topper101.com'),
  title: {
    default: "IGNOU MAPC Mock Tests & Exam Prep | Topper101",
    template: "%s | Topper101",
  },
  description: "Prepare with high-yield IGNOU MAPC mock tests, solved past papers, repeat-question heat maps, and textbook-grounded answers. Built specifically for MAPC psychology students.",
  keywords: [
    'IGNOU MAPC',
    'IGNOU MAPC exam prep',
    'IGNOU MAPC Mock Tests',
    'MAPC question papers',
    'IGNOU psychology',
    'TEE preparation',
    'Topper101',
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      ],
    shortcut: "/favicon.ico",
    apple: "/favicon-32.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        {/* Anti-flash: apply stored theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
      </head>
      {/* Google Analytics 4 — only loads if NEXT_PUBLIC_GA_MEASUREMENT_ID is set */}
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}',{page_path:window.location.pathname});`}
          </Script>
        </>
      )}
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <PostHogProvider>
            {children}
            <GlobalQueryFAB />
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

