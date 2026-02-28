import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "미녶 독자 유형은? | @minyeahp_",
  description: "5개의 질문으로 알아보는 나의 미녶 독자 유형! @minyeahp_",
  openGraph: {
    title: "미녶 독자 유형은? | @minyeahp_",
    description: "5개의 질문으로 알아보는 나의 미녶 독자 유형! @minyeahp_",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "미녶 독자 유형은? | @minyeahp_",
    description: "5개의 질문으로 알아보는 나의 미녶 독자 유형! @minyeahp_",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
