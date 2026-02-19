import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CODAPOS — Cloud POS & Merchant Platform",
  description: "Platform POS cloud all-in-one untuk merchant: POS, Manajemen Produk, Pembayaran, dan Laporan dalam satu sistem terintegrasi.",
  keywords: ["POS", "Point of Sale", "Cloud POS", "Merchant", "CODAPOS", "SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
