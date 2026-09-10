import Link from 'next/link';
import FoodBalanceGame from '@/components/food/FoodBalanceGame';

export default function FoodPage() {
  return (
    <main className="max-w-md mx-auto min-h-screen px-5 pt-6 pb-12 flex flex-col gap-4 bg-[#FAF7F2] text-[#2D241E]">
      <header className="flex items-center justify-between pb-3 border-b border-[#EADFCF]">
        <div className="flex items-center gap-2.5">
          <Link
            href="/map"
            className="font-title text-xs text-[#7A6251] hover:text-[#2D241E] px-3.5 py-1.5 bg-white border-2 border-[#EADFCF] rounded-2xl shadow-xs transition active:scale-95"
          >
            ← 지도로 돌아가기
          </Link>
          <h1 className="font-title text-lg tracking-tight text-[#2D241E] flex items-center gap-1.5">
            오늘 뭐 먹지? <span className="text-[#C25E3E]">🍕</span>
          </h1>
        </div>
      </header>

      <FoodBalanceGame />
    </main>
  );
}