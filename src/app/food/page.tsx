import Link from 'next/link';
import FoodBalanceGame from '@/components/food/FoodBalanceGame';

export default function FoodPage() {
  return (
    <main className="max-w-lg mx-auto min-h-screen p-4 pb-12 flex flex-col gap-4 bg-slate-50 text-slate-900">
      <header className="pt-3 pb-2 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl transition"
          >
            ← 지도로 돌아가기
          </Link>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            오늘 뭐 먹지? <span className="text-base">🍕</span>
          </h1>
        </div>
      </header>

      <FoodBalanceGame />
    </main>
  );
}