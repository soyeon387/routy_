import { Suspense } from 'react';
import Link from 'next/link';
import RestaurantFinder from '@/components/restaurant/RestaurantFinder';

export default function RestaurantPage() {
  return (
    <main className="max-w-md mx-auto min-h-screen px-5 pt-6 pb-12 flex flex-col gap-4 bg-[#FAF7F2] text-[#2D241E]">
      <header className="flex items-center justify-between pb-3 border-b border-[#EADFCF]">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="font-title text-xs text-[#7A6251] hover:text-[#2D241E] px-3.5 py-1.5 bg-white border-2 border-[#EADFCF] rounded-2xl shadow-xs transition active:scale-95"
          >
            ← 홈으로
          </Link>
          <h1 className="font-title text-lg tracking-tight text-[#2D241E] flex items-center gap-1.5">
            맛집 어디가지? <span className="text-[#C25E3E]">🍽️</span>
          </h1>
        </div>
        <Link
          href="/map"
          className="font-title text-xs text-[#F3D5B5] bg-[#2D241E] hover:bg-[#43362E] px-3.5 py-1.5 rounded-2xl border border-[#1E1713] transition active:scale-95 shadow-xs"
        >
          🗺️ 내 지도 보기
        </Link>
      </header>

      <Suspense fallback={<div className="text-center p-8 text-xs text-[#8C7A6B]">로딩 중...</div>}>
        <RestaurantFinder />
      </Suspense>
    </main>
  );
}