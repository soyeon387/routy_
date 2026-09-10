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
  const [partnerResult, setPartnerResult] = useState<string | null>(null);

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
    setAiQuestion('오늘 가장 먼저 떠오르는 음식 베이스는?');
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
    <div className="flex flex-col gap-5">
      {/* 밸런스 게임 및 AI 결과 메인 카드 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[360px] flex flex-col justify-center relative overflow-hidden">
        {isLoading ? (
          <div className="text-center flex flex-col items-center justify-center gap-3 py-10 animate-in fade-in">
            <div className="w-9 h-9 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-800">
                {step >= 3 ? 'AI가 추천 메뉴를 고르고 있어요...' : '다음 질문을 만드는 중...'}
              </h3>
              <p className="text-[11px] text-slate-400">Gemini가 실시간으로 취향을 좁히고 있습니다</p>
            </div>
          </div>
        ) : !isPlaying && !myResult ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-5xl">🧭</div>
            <div>
              <h2 className="text-xl font-black text-slate-900">취향 가지치기 메뉴 찾기</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                정해진 질문이 아닌, 내가 고른 선택에 따라<br />
                AI가 질문을 꼬리물며 오늘의 메뉴를 좁혀줍니다.
              </p>
            </div>
            <button
              onClick={startGame}
              className="mt-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition active:scale-95 shadow-md"
            >
              가지치기 게임 시작
            </button>
          </div>
        ) : isPlaying ? (
          <div className="flex flex-col h-full w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-1.5 flex-wrap mb-2">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"
                  >
                    {h} →
                  </span>
                ))}
                <span className="text-[11px] font-black text-slate-400">
                  STEP {step + 1}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-800 mt-1">
                {aiQuestion}
              </h2>
            </div>

            {/* 1단계 (면 / 밥 / 고기) */}
            {step === 0 ? (
              <div className="flex flex-col gap-2.5 flex-1 justify-center">
                {ROOT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRootSelect(opt.value)}
                    className="w-full py-5 bg-slate-50 hover:bg-red-50/60 border border-slate-200 hover:border-red-200 text-slate-800 rounded-2xl font-bold text-base transition transform active:scale-[0.98]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              /* 2단계 이후 (AI 2지선다) */
              aiOptions && (
                <div className="flex flex-col gap-3 flex-1 justify-center">
                  <button
                    onClick={() => handleBranchSelect(aiOptions.a)}
                    className="w-full py-7 bg-slate-50 hover:bg-red-50 border-2 border-slate-100 hover:border-red-200 text-slate-800 rounded-2xl font-bold text-base transition transform active:scale-[0.98]"
                  >
                    {aiOptions.a}
                  </button>
                  <div className="text-center text-xs font-black text-slate-300 relative">
                    <span className="bg-white px-2 relative z-10">VS</span>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 -z-0" />
                  </div>
                  <button
                    onClick={() => handleBranchSelect(aiOptions.b)}
                    className="w-full py-7 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 text-slate-800 rounded-2xl font-bold text-base transition transform active:scale-[0.98]"
                  >
                    {aiOptions.b}
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          /* 최종 추천 결과: 메뉴명 중심 심플 UI */
          <div className="text-center flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">
                AI 추천 완료 ✨
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {myResult?.category}
              </span>
            </div>

            <div className="py-2">
              <p className="text-xs font-semibold text-slate-400 mb-1">오늘 두 사람을 위한 맞춤 메뉴</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {myResult?.menuName}
              </h2>
            </div>

            <div className="flex items-center gap-2 mt-2 w-full max-w-xs">
              <Link
                href="/map"
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition text-center shadow-sm"
              >
                지도에서 맛집 찾기 🗺️
              </Link>
              <button
                onClick={startGame}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition"
              >
                다시 하기 🔄
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 방 멤버 공유 현황판 */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200">오늘의 메뉴 선택 현황</h3>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            매일 자정 갱신
          </span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold">나의 선택</span>
            <div
              className={`p-3 rounded-2xl border flex items-center justify-center min-h-[55px] text-xs font-bold text-center ${
                myResult
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-800/40 border-dashed border-slate-700 text-slate-500'
              }`}
            >
              {myResult ? myResult.menuName : '❌ 미참여'}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold">상대방 선택</span>
            <div
              className={`p-3 rounded-2xl border flex items-center justify-center min-h-[55px] text-xs font-bold text-center ${
                partnerResult
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-800/40 border-dashed border-slate-700 text-slate-500'
              }`}
            >
              {partnerResult || '⏳ 대기중'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}