import "./globals.css"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/common/Header";
import Providers from "@/providers/Providers";
import MainWrapper from "@/providers/MainWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'MAPORY',
  description: "여행 계획부터 기록까지, 당신의 특별한 여행을 기록하세요",
  icons: {
    icon: [
      { url: '/icons/logo.svg', type: 'image/svg+xml' }
    ],
    apple: '/icons/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <Header />
          <MainWrapper>{children}</MainWrapper>
        </Providers>
      </body>
    </html>
  );
}
