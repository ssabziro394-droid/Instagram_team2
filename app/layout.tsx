import type { Metadata } from "next";
import { Geist, Geist_Mono, Grand_Hotel } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const grandHotel = Grand_Hotel({
  weight: "400",
  variable: "--font-instagram",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instagram Clone",
  description: "A professional Instagram clone built with Next.js and RTK Query",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${grandHotel.variable} antialiased bg-ig-bg text-ig-fg transition-colors duration-300`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
