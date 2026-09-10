import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Routy - 데이트 찜 지도',
  description: '가고 싶은 곳은 빈 하트, 다녀온 곳은 채운 하트!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#FAF7F2] text-[#2D241E] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}