import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "PixelRoom - 픽셀 아트 드레스업 게임",
  description: "나만의 픽셀 아트 치비 캐릭터를 꾸미고, 방을 꾸미고, 친구와 채팅하세요!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
