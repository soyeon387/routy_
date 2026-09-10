'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FoodDetail {
  menuName: string;
  category: string;
}

const ROOT_OPTIONS = [
  { label: '🍜 호로록 면 요리', value: '면 요리' },
  { label: '🍚 든든한 밥 요리', value: '밥 요리' },
  { label: '🥩 굽고 뜯는 고기 요리', value: '고기 요리' },
];

export default function FoodBalanceGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiOptions, setAiOptions] = useState<{ a: string; b: string } | null>(null);
  const [myResult, setMyResult] = useState<FoodDetail | null>(null);

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  useEffect(() => {
    const today = getTodayDate();
    const savedDate = localStorage.getItem('routy_food_date');

    if (savedDate !== today) {
      localStorage.removeItem('routy_food_detail');
      localStorage.removeItem('routy_food_result');
      localStorage.setItem('routy_food_date', today);
    } else {
      const savedDetail = localStorage.getItem('routy_food_detail');
      if (savedDetail) {
        try {
          setMyResult(JSON.parse(savedDetail));
        } catch {
          const simple = localStorage.getItem('routy_food_result');
          if (simple) setMyResult({ menuName: simple, category: '추천' });
        }
      }
    }
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setStep(0);
    setHistory([]);
    setAiQuestion('오늘 가장 먼저 끌리는 음식 베이스는?');
    setAiOptions(null);
  };

  const handleRootSelect = async (choice: string) => {
    const nextHistory = [choice];
    setHistory(nextHistory);
    setStep(1);
    await callGeminiBranch(nextHistory, 1);
  };

  const handleBranchSelect = async (choice: string) => {
    const nextHistory = [...history, choice];
    setHistory(nextHistory);
    const nextStep = step + 1;
    setStep(nextStep);
    await callGeminiBranch(nextHistory, nextStep);
  };

  const callGeminiBranch = async (currentHistory: string[], currentStep: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/food-recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: currentHistory, step: currentStep }),
      });

      const data = await res.json();

      if (data.isFinal) {
        setIsPlaying(false);
        setMyResult(data);
        localStorage.setItem('routy_food_result', data.menuName);
        localStorage.setItem('routy_food_detail', JSON.stringify(data));
      } else {
        setAiQuestion(data.question);
        setAiOptions({ a: data.optionA, b: data.optionB });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-[#2D241E]">
      <div className="bg-white rounded-[30px] p-6 border-2 border-[#EADFCF] shadow-[0_8px_24px_rgba(74,59,50,0.04)] min-h-[380px] flex flex-col justify-center relative overflow-hidden">
        {isLoading ? (
          <div className="text-center flex flex-col items-center justify-center gap-3 py-12 animate-in fade-in">
            <div className="w-10 h-10 border-[3.5px] border-[#C25E3E] border-t-transparent rounded-full animate-spin" />
            <div className="flex flex-col gap-1">
              <h3 className="font-title text-sm text-[#2D241E]">
                {step >= 3 ? '오늘의 베스트 메뉴 정하는 중...' : '다음 질문 만드는 중...'}
              </h3>
              <p className="font-body text-[11px] text-[#8C7A6B]">취향에 맞춰 질문을 좁혀가고 있어요</p>
            </div>
          </div>
        ) : !isPlaying && !myResult ? (
          <div className="text-center flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-3xl bg-[#F8EFE4] border-2 border-[#E6D4BE] flex items-center justify-center text-3xl">
              🧭
            </div>
            <div>
              <h2 className="font-title text-2xl text-[#2D241E] tracking-tight">취향 가지치기 메뉴 찾기</h2>
              <p className="font-body text-xs text-[#8C7A6B] mt-1.5 leading-relaxed">
                정해진 질문이 아닌, 내 선택에 맞춰<br />
                AI가 질문을 꼬리물며 오늘의 메뉴를 골라줍니다!
              </p>
            </div>
            <button
              onClick={startGame}
              className="font-title mt-2 px-8 py-3.5 bg-[#2D241E] hover:bg-[#43362E] active:scale-[0.98] text-[#F9F6F0] text-xs rounded-2xl transition shadow-md"
            >
              가지치기 게임 시작하기
            </button>
          </div>
        ) : isPlaying ? (
          <div className="flex flex-col h-full w-full animate-in fade-in zoom-in-[0.98] duration-200">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-1.5 flex-wrap mb-2">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className="font-title text-[10px] text-[#C25E3E] bg-[#F9ECE7] px-2.5 py-0.5 rounded-full border border-[#F2D1C5]"
                  >
                    {h} →
                  </span>
                ))}
                <span className="font-title text-[10px] text-[#A89889] tracking-wider">
                  STEP {step + 1}
                </span>
              </div>
              <h2 className="font-title text-lg text-[#2D241E] tracking-tight">
                {aiQuestion}
              </h2>
            </div>

            {step === 0 ? (
              <div className="flex flex-col gap-2.5 flex-1 justify-center">
                {ROOT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRootSelect(opt.value)}
                    className="w-full py-4 px-5 bg-[#FAF7F2] hover:bg-[#F5EFE6] border-2 border-[#EADFCF] hover:border-[#C25E3E]/50 text-[#2D241E] rounded-2xl transition-all text-left flex items-center justify-between active:scale-[0.99]"
                  >
                    <span className="font-title text-sm">{opt.label}</span>
                    <span className="font-title text-xs text-[#C25E3E]">선택 →</span>
                  </button>
                ))}
              </div>
            ) : (
              aiOptions && (
                <div className="flex flex-col gap-3 flex-1 justify-center">
                  <button
                    onClick={() => handleBranchSelect(aiOptions.a)}
                    className="font-title w-full py-6 px-4 bg-[#FAF7F2] hover:bg-[#FDF4F0] border-2 border-[#EADFCF] hover:border-[#C25E3E] text-[#2D241E] rounded-2xl text-sm transition-all active:scale-[0.98]"
                  >
                    {aiOptions.a}
                  </button>
                  <div className="font-title text-center text-xs text-[#C25E3E] relative py-0.5">
                    <span className="bg-white px-2.5 relative z-10">VS</span>
                    <div className="absolute top-1/2 left-6 right-6 h-px bg-[#EADFCF] -z-0" />
                  </div>
                  <button
                    onClick={() => handleBranchSelect(aiOptions.b)}
                    className="font-title w-full py-6 px-4 bg-[#FAF7F2] hover:bg-[#F3F7F8] border-2 border-[#EADFCF] hover:border-[#4B7280] text-[#2D241E] rounded-2xl text-sm transition-all active:scale-[0.98]"
                  >
                    {aiOptions.b}
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="text-center flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in-[0.98] duration-200">
            <span className="font-title text-[11px] text-[#C25E3E] bg-[#F9ECE7] border border-[#F2D1C5] px-3 py-1 rounded-full">
              {myResult?.category}
            </span>

            <div>
              <p className="font-body text-xs text-[#8C7A6B] mb-1">오늘 두 사람을 위한 맞춤 추천</p>
              <h2 className="font-title text-3xl text-[#2D241E] tracking-tight">
                {myResult?.menuName}
              </h2>
            </div>

            <div className="flex items-center gap-2 mt-4 w-full max-w-xs">
              <Link
                href="/map"
                className="font-title flex-1 py-3.5 bg-[#2D241E] hover:bg-[#43362E] active:scale-[0.98] text-white text-xs rounded-2xl transition text-center shadow-md"
              >
                지도에서 맛집 찾기 🗺️
              </Link>
              <button
                onClick={startGame}
                className="font-title px-4 py-3.5 bg-[#FAF7F2] hover:bg-[#F1EAE0] border-2 border-[#EADFCF] active:scale-[0.98] text-[#2D241E] text-xs rounded-2xl transition"
              >
                다시 하기 🔄
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 현황판 */}
      <div className="bg-white rounded-[26px] p-5 border-2 border-[#EADFCF] shadow-[0_4px_16px_rgba(74,59,50,0.03)] flex flex-col gap-3">
        <div className="flex justify-between items-center pb-2 border-b border-[#F2EAE0]">
          <span className="font-title text-xs text-[#2D241E]">오늘의 메뉴 현황</span>
          <span className="font-title text-[10px] text-[#A89889] bg-[#F7F2EB] px-2 py-0.5 rounded">자정 갱신</span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="font-title text-[10px] text-[#8C7A6B] uppercase tracking-wider">My Pick</span>
            <div className={`font-title p-3 rounded-2xl border-2 text-xs text-center flex items-center justify-center min-h-[52px] ${
              myResult ? 'bg-[#F9ECE7] border-[#F2D1C5] text-[#C25E3E]' : 'bg-[#FAF7F2] border-[#EADFCF] text-[#A89889] border-dashed'
            }`}>
              {myResult ? myResult.menuName : '미참여'}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <span className="font-title text-[10px] text-[#8C7A6B] uppercase tracking-wider">Partner Pick</span>
            <div className="font-title p-3 rounded-2xl border-2 border-dashed border-[#EADFCF] bg-[#FAF7F2] text-[#A89889] text-xs text-center flex items-center justify-center min-h-[52px]">
              대기중 ⏳
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}