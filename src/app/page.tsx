'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [showPlannerNotice, setShowPlannerNotice] = useState(false);

  return (
    <main className="max-w-md mx-auto min-h-screen px-5 pt-8 pb-14 bg-[#FAF7F2] text-[#2D241E] flex flex-col justify-between selection:bg-[#E8DCC4]">
      <div className="flex flex-col gap-6">
        
        {/* 상단 헤더 */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-title inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-[#EFE9DF] text-[#7A6251] border border-[#E3D9CC]">
              <span className="w-2 h-2 rounded-full bg-[#C25E3E] animate-pulse" />
              우리들의 약속 플래너
            </span>
            <span className="font-title text-[11px] tracking-wider text-[#A89889]">v2.0</span>
          </div>

          <div>
            <h1 className="font-title text-4xl tracking-tight text-[#2D241E] flex items-center gap-1.5 mt-1">
              ROUTY<span className="text-[#C25E3E]">!</span>
            </h1>
            <p className="font-body text-xs font-normal text-[#8C7A6B] mt-1 leading-relaxed">
              취향 고민은 AI가, 만남은 편하게! 직관적인 약속 코스 플래너
            </p>
          </div>
        </header>

        {/* 3대 핵심 메뉴 */}
        <div className="flex flex-col gap-4">
          
          {/* 1. [메인 대형 카드] AI 플래너 */}
          <div
            onClick={() => setShowPlannerNotice(true)}
            className="group relative p-7 rounded-[32px] bg-[#2D241E] text-white shadow-[0_16px_36px_rgba(45,36,30,0.18)] overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border-2 border-[#1E1713] cursor-pointer flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute -top-10 -right-10 w-52 h-52 bg-gradient-to-br from-[#C25E3E]/40 via-[#E07A5F]/20 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex items-start justify-between">
              <span className="w-14 h-14 rounded-2xl bg-[#43362E] border border-[#59483D] flex items-center justify-center text-3xl shadow-inner">
                ✨
              </span>
              <span className="font-title text-[10px] px-2.5 py-1 rounded-full bg-[#3B2F27] text-[#E8DCC4] border border-[#524237]">
                오픈 준비중
              </span>
            </div>

            <div className="relative z-10 mt-6">
              <h2 className="font-title text-2xl tracking-tight text-[#FAF7F2] group-hover:text-[#F3D5B5] transition-colors flex items-center gap-1.5">
                AI 플래너 <span className="text-[#C25E3E]">→</span>
              </h2>
              <p className="font-body text-xs font-normal text-[#C8B8A6] mt-2 leading-relaxed">
                모임의 목적, 예산, 이동 거리에 딱 맞는 최적의 동선과 풀코스 일정을 AI가 1초 만에 설계해 드립니다.
              </p>
            </div>
          </div>

          {/* 2. 약속 찜 지도 */}
          <Link
            href="/map"
            className="group relative p-5 rounded-[26px] bg-white border-2 border-[#EADFCF] shadow-[0_4px_16px_rgba(74,59,50,0.03)] hover:border-[#D5C2AD] transition-all flex items-center justify-between active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-2xl bg-[#F7F2EB] border border-[#E8DEC7] flex items-center justify-center text-2xl shrink-0">
                🗺️
              </span>
              <div className="text-left">
                <h3 className="font-title text-base text-[#2D241E] group-hover:text-[#C25E3E] transition-colors">
                  약속 찜 지도
                </h3>
                <p className="font-body text-xs font-normal text-[#8C7A6B] mt-0.5">
                  가고 싶은 곳을 찜하고 공유해보세요!
                </p>
              </div>
            </div>
            <span className="font-title text-sm text-[#8C7A6B] group-hover:text-[#C25E3E] group-hover:translate-x-1 transition-all pl-2">
              GO →
            </span>
          </Link>

          {/* 3. 근처 카페 추천 */}
          <Link
            href="/cafe"
            className="group relative p-5 rounded-[26px] bg-white border-2 border-[#EADFCF] shadow-[0_4px_16px_rgba(74,59,50,0.03)] hover:border-[#D5C2AD] transition-all flex items-center justify-between active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-2xl bg-[#FBF5ED] border border-[#EFE4D6] flex items-center justify-center text-2xl shrink-0">
                ☕
              </span>
              <div className="text-left">
                <h3 className="font-title text-base text-[#2D241E] group-hover:text-[#A86F3D] transition-colors">
                  근처 카페 추천 (1km 이내)
                </h3>
                <p className="font-body text-xs font-normal text-[#8C7A6B] mt-0.5">
                  거리별, 디저트별로 카페를 추천해드려요!
                </p>
              </div>
            </div>
            <span className="font-title text-sm text-[#8C7A6B] group-hover:text-[#A86F3D] group-hover:translate-x-1 transition-all pl-2">
              GO →
            </span>
          </Link>

        </div>
      </div>

      {/* 푸터 */}
      <footer className="font-title text-center text-xs text-[#A89889] pt-8">
        ROUTY · CURATED FOR US
      </footer>

      {/* 준비중 모달 */}
      {showPlannerNotice && (
        <div className="fixed inset-0 z-50 bg-[#2D241E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2D241E] w-full max-w-xs rounded-[30px] p-6 shadow-2xl border-2 border-[#EADFCF] text-center flex flex-col gap-3">
            <span className="text-3xl">✨</span>
            <div>
              <h4 className="font-title text-base">AI 플래너 준비 중</h4>
              <p className="font-body text-xs text-[#8C7A6B] mt-1 leading-relaxed">
                더 스마트한 맞춤 코스 추천 엔진을 작업하고 있습니다. 곧 완성될 예정입니다!
              </p>
            </div>
            <button
              onClick={() => setShowPlannerNotice(false)}
              className="font-title mt-2 py-3 bg-[#2D241E] text-white text-xs rounded-xl hover:bg-[#43362E] transition active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}