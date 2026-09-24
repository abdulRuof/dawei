
import type { Metadata } from "next";
import { Tajawal, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["500", "700", "800", "900"],
  display: "swap",
  variable: "--font-tajawal",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex",
});

export const metadata: Metadata = {
  title: "دوائي",
  description: "منصة البحث عن الأدوية والصيدليات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${tajawal.variable} ${plexArabic.variable}`}
    >
      <body className={`${plexArabic.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}

