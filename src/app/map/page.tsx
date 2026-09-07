import Link from 'next/link';
import DateMap from '@/components/map/DateMap';

export default function MapPage() {
  return (
    <main className="max-w-lg mx-auto min-h-screen p-4 pb-12 flex flex-col gap-4 bg-slate-50 text-slate-900">
      <header className="pt-3 pb-2 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl transition"
          >
            ← 홈으로
          </Link>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1">
            지도 아카이브 <span className="text-red-500">❤️</span>
          </h1>
        </div>
        
        {/* 카페 탐색 대신 오늘 뭐 먹지 페이지로 연결 */}
        <Link
          href="/food"
          className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl hover:bg-red-100 transition flex items-center gap-1"
        >
          <span>🍕 오늘 뭐 먹지?</span>
        </Link>
      </header>

      <DateMap />
    </main>
  );
}