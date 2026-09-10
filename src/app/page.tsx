'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface QuickStats {
  roomCount: number;
  activeRoomTitle: string;
  foodDoneToday: boolean;
}

export default function HomePage() {
  const [stats, setStats] = useState<QuickStats>({
    roomCount: 1,
    activeRoomTitle: '우리들의 지도',
    foodDoneToday: false,
  });

  useEffect(() => {
    try {
      const savedRooms = localStorage.getItem('routy_rooms_v2') || localStorage.getItem('routy_rooms_v1');
      const activeCode = localStorage.getItem('routy_current_room_code');
      const today = new Date().toISOString().slice(0, 10);
      const foodDate = localStorage.getItem('routy_food_date');
      const foodResult = localStorage.getItem('routy_food_result');

      if (savedRooms) {
        const parsed = JSON.parse(savedRooms);
        const current = parsed.find((r: any) => r.code === activeCode) || parsed[0];
        setStats({
          roomCount: parsed.length,
          activeRoomTitle: current ? current.title : '우리들의 지도',
          foodDoneToday: foodDate === today && !!foodResult,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <main className="max-w-lg mx-auto min-h-screen p-5 pb-16 flex flex-col justify-between bg-slate-50 text-slate-900 font-sans">
      <div className="flex flex-col gap-6 pt-4">
        
        {/* 1. 브랜드 타이틀 & 탑 인포 */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-xs font-bold text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              둘만의 맞춤 데이트 플래너
            </div>
            <span className="text-[11px] font-semibold text-slate-400">PWA Ready</span>
          </div>

          <div className="mt-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Routy <span className="text-red-500 text-2xl">❤️</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              취향 분석부터 맞춤 동선 설계, 실시간 지도 아카이브까지 한번에 끝내는 스마트 코스 플래너
            </p>
          </div>

          {/* 현재 연결된 방 퀵 뱃지 */}
          <div className="mt-2 p-3 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🛋️</span>
              <div className="text-left">
                <p className="text-[11px] text-slate-400 font-medium">현재 활성 룸</p>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                  {stats.activeRoomTitle}
                </p>
              </div>
            </div>
            <Link
              href="/map"
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition"
            >
              룸 전환 →
            </Link>
          </div>
        </header>

        {/* 2. 핵심 기능 4대 네비게이션 카드 */}
        <div className="flex flex-col gap-3.5">
          
          {/* ① 스마트 데이트 코스 빌더 (최우선 순위 핵심) */}
          <Link
            href="/course"
            className="group relative p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-3xl shadow-xl hover:shadow-2xl transition transform active:scale-[0.98] border border-slate-700/50 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-start justify-between relative z-10 mb-6">
              <span className="text-3xl p-3 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-inner">
                ✨
              </span>
              <span className="text-[11px] font-extrabold px-3 py-1 bg-red-500 text-white rounded-full tracking-wide shadow-sm">
                핵심 기능
              </span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black text-white group-hover:text-red-400 transition">
                  맞춤 데이트 코스 생성기
                </h2>
                <span className="text-red-400 text-sm font-bold">→</span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                위치와 취향(밥·카페·활동)을 고르면 지도 동선, 예상 소요 시간, 경비까지 한눈에 계획해 드려요.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700">
                  인터랙티브 동선 지도
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700">
                  장소 셔플 & 락
                </span>
              </div>
            </div>
          </Link>

          {/* 2열 그리드: 지도 아카이브 & 근처 카페 추천 */}
          <div className="grid grid-cols-2 gap-3.5">
            
            {/* ② 데이트 찜 지도 (지도 아카이브) */}
            <Link
              href="/map"
              className="group p-4 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-xs hover:border-slate-300 hover:shadow-md transition transform active:scale-[0.98] flex flex-col justify-between min-h-[175px]"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl p-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
                  🗺️
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  코드 공유
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-red-500 transition flex items-center gap-0.5">
                  데이트 찜 지도 <span>→</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  🤍 가고 싶은 곳과 ❤️ 다녀온 곳을 실시간으로 관리해요.
                </p>
              </div>
            </Link>

            {/* ③ 근처 카페 추천 */}
            <Link
              href="/cafe"
              className="group p-4 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-xs hover:border-slate-300 hover:shadow-md transition transform active:scale-[0.98] flex flex-col justify-between min-h-[175px]"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  ☕
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  거리순 1km
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-amber-600 transition flex items-center gap-0.5">
                  디저트 카페 <span>→</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  소금빵, 수플레, 프렌치토스트 등 디저트별 탐색
                </p>
              </div>
            </Link>

          </div>

          {/* ④ 음식 밸런스 게임 (오늘 뭐 먹지?) */}
          <Link
            href="/food"
            className="group p-4 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-xs hover:border-slate-300 hover:shadow-md transition transform active:scale-[0.98] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 shrink-0">
                🍕
              </span>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold group-hover:text-orange-600 transition">
                    오늘 뭐 먹지? (밸런스 게임)
                  </h3>
                  {stats.foodDoneToday ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      오늘 참여완료 ✨
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      매일 자정 갱신
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  간단한 양자택일 카드로 서로 먹고 싶은 음식을 맞추고 추천받아요.
                </p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-slate-600 font-bold px-1 transition">
              →
            </span>
          </Link>

        </div>
      </div>

      {/* 3. 하단 푸터 */}
      <footer className="text-center pt-8 text-xs text-slate-400 border-t border-slate-200/60 flex flex-col gap-1">
        <p className="font-semibold text-slate-500">Routy · Couple & Friends Place Planner</p>
        <p className="text-[11px] text-slate-400">Zero-Login Anonymous Architecture</p>
      </footer>
    </main>
  );
}