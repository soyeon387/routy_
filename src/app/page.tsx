import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-lg mx-auto min-h-screen p-5 flex flex-col justify-between bg-slate-50 text-slate-900">
      <div className="flex flex-col gap-8 pt-8">
        {/* 헤더 */}
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200/70 rounded-full text-xs font-bold text-slate-700 mb-3">
            <span>함께 만드는 장소 아카이브</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Routy <span className="text-red-500 text-2xl">❤️</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            가고 싶은 곳은 🤍 빈 하트로 찜하고, 다녀온 곳은 ❤️ 채운 하트로 기록하는 둘만의 플래너
          </p>
        </header>

        {/* 메인 메뉴 카드 2개 */}
        <div className="flex flex-col gap-4">
          {/* 1. 지도 아카이브 */}
          <Link
            href="/map"
            className="group p-5 bg-slate-900 text-white rounded-3xl shadow-lg hover:bg-slate-800 transition transform active:scale-[0.98] flex flex-col justify-between h-44"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl p-2.5 bg-slate-800 rounded-2xl">🗺️</span>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full">
                공유 지도
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold group-hover:text-red-400 transition flex items-center gap-1">
                지도 아카이브 <span>→</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                코드로 방을 공유하고, 하트 마커와 데이트 동선을 확인하세요.
              </p>
            </div>
          </Link>

          {/* 2. 근처 카페 추천 */}
          <Link
            href="/cafe"
            className="group p-5 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-sm hover:border-slate-300 hover:shadow-md transition transform active:scale-[0.98] flex flex-col justify-between h-44"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl p-2.5 bg-amber-50 rounded-2xl border border-amber-100">☕</span>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                근처 탐색
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold group-hover:text-amber-700 transition flex items-center gap-1">
                근처 카페 추천 <span>→</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                소금빵, 수플레, 케이크 등 디저트별로 가까운 카페를 거리순으로 확인하세요.
              </p>
            </div>
          </Link>
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200/60">
        Routy · Place Archive & Route Planner
      </footer>
    </main>
  );
}