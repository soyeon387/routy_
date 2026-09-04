import type { Metadata } from 'next';
import Script from 'next/script';
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
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}