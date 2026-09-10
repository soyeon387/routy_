'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/authMock';

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
  
  const [roomMembers, setRoomMembers] = useState<string[]>([]);
  const [activeRoomCode, setActiveRoomCode] = useState<string>('');

  useEffect(() => {
    const currentUser = getCurrentUser() || '';
    const activeCode = localStorage.getItem('routy_current_room_code') || '';
    setActiveRoomCode(activeCode);

    const allRooms = JSON.parse(localStorage.getItem('routy_rooms_v2') || '[]');
    const currentRoom = allRooms.find((r: any) => r.code === activeCode);
    
    let members = [currentUser];
    if (currentRoom && currentRoom.members) {
      members = [...currentRoom.members];
    }
    
    // 혼자 있는 방에서는 대기 중인 가상 멤버를 만들지 않고
    // 실제 참여자 본인의 결과만 표시합니다.
    setRoomMembers(members);

    const myPickRaw = localStorage.getItem(`routy_food_result_${activeCode}_${currentUser}`);
    if (myPickRaw) {
      try {
        setMyResult(JSON.parse(myPickRaw));
      } catch {
        setMyResult({ menuName: myPickRaw, category: '추천' });
      }
    }
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setStep(0);
    setHistory([]);
    setAiQuestion('오늘 가장 먼저 끌리는 기본 베이스는?');
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
        
        const currentUser = getCurrentUser() || '';
        localStorage.setItem(`routy_food_result_${activeRoomCode}_${currentUser}`, JSON.stringify(data));
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
      
      {/* 가지치기 게임 영역 */}
      <div className="bg-white rounded-[30px] p-6 border-2 border-[#EADFCF] shadow-[0_8px_24px_rgba(74,59,50,0.04)] min-h-[380px] flex flex-col justify-center relative overflow-hidden">
        {isLoading ? (
          <div className="text-center flex flex-col items-center justify-center gap-3 py-12 animate-in fade-in">
            <div className="w-10 h-10 border-[3.5px] border-[#C25E3E] border-t-transparent rounded-full animate-spin" />
            <div className="flex flex-col gap-1">
              <h3 className="font-title text-sm text-[#2D241E]">
                {step >= 4 ? '모아진 취향에 딱 맞는 메뉴 분석 중...' : '다음 취향 밸런스 만드는 중...'}
              </h3>
              <p className="font-body text-[11px] text-[#8C7A6B]">
                {step >= 4 ? '취향 조각들을 맞춰보고 있어요 ✨' : '음식 대신 당신의 감각 취향을 좁혀갑니다'}
              </p>
            </div>
          </div>
        ) : !isPlaying && !myResult ? (
          <div className="text-center flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-3xl bg-[#F8EFE4] border-2 border-[#E6D4BE] flex items-center justify-center text-3xl">
              🧭
            </div>
            <div>
              <h2 className="font-title text-2xl text-[#2D241E] tracking-tight">취향 밸런스 메뉴 찾기</h2>
              <p className="font-body text-xs text-[#8C7A6B] mt-1.5 leading-relaxed">
                특정 메뉴가 아닌 <b>맵기, 국물, 식감, 분위기</b> 등<br />
                내 감각 취향 4가지를 골라 최적의 메뉴를 찾습니다!
              </p>
            </div>
            <button
              onClick={startGame}
              className="font-title mt-2 px-8 py-3.5 bg-[#2D241E] hover:bg-[#43362E] active:scale-[0.98] text-[#F9F6F0] text-xs rounded-2xl transition shadow-md"
            >
              취향 밸런스 시작하기
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
                  Q{step + 1} / 5
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
                    className="font-title w-full py-5 px-4 bg-[#FAF7F2] hover:bg-[#FDF4F0] border-2 border-[#EADFCF] hover:border-[#C25E3E] text-[#2D241E] rounded-2xl text-xs sm:text-sm transition-all active:scale-[0.98] leading-snug"
                  >
                    {aiOptions.a}
                  </button>
                  <div className="font-title text-center text-xs text-[#C25E3E] relative py-0.5">
                    <span className="bg-white px-2.5 relative z-10">VS</span>
                    <div className="absolute top-1/2 left-6 right-6 h-px bg-[#EADFCF] -z-0" />
                  </div>
                  <button
                    onClick={() => handleBranchSelect(aiOptions.b)}
                    className="font-title w-full py-5 px-4 bg-[#FAF7F2] hover:bg-[#F3F7F8] border-2 border-[#EADFCF] hover:border-[#4B7280] text-[#2D241E] rounded-2xl text-xs sm:text-sm transition-all active:scale-[0.98] leading-snug"
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
              <p className="font-body text-xs text-[#8C7A6B] mb-1">내 취향 5가지를 모아 찾아낸 추천 메뉴</p>
              <h2 className="font-title text-3xl text-[#2D241E] tracking-tight">
                {myResult?.menuName}
              </h2>
            </div>

            <div className="flex items-center gap-2 mt-4 w-full max-w-xs">
              <Link
                href={`/restaurant?category=${encodeURIComponent(myResult?.category || '')}`}
                className="font-title flex-1 py-3.5 bg-[#2D241E] hover:bg-[#43362E] active:scale-[0.98] text-white text-xs rounded-2xl transition text-center shadow-md"
              >
                근처 {myResult?.category || '맛집'} 찾기 🍽️
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

      {/* 동적 멤버 기반 오늘의 메뉴 현황판 */}
      <div className="bg-white rounded-[26px] p-5 border-2 border-[#EADFCF] shadow-[0_4px_16px_rgba(74,59,50,0.03)] flex flex-col gap-3">
        <div className="flex justify-between items-center pb-2 border-b border-[#F2EAE0]">
          <span className="font-title text-xs text-[#2D241E]">
            우리 방의 메뉴 현황 <span className="text-[#A89889]">({roomMembers.length <= 4 ? roomMembers.length : 4}명)</span>
          </span>
          <button onClick={() => window.location.reload()} className="font-title text-[10px] text-[#7A6251] bg-[#F7F2EB] border border-[#EADFCF] px-2.5 py-1 rounded-lg hover:bg-[#F3ECE0] transition">
            새로고침 🔄
          </button>
        </div>

        <div className="flex gap-2 w-full overflow-x-auto pb-1">
          {roomMembers.map((member, idx) => {
            const currentUser = getCurrentUser() || '';
            const isMe = member === currentUser;
            const isWaiting = member === '초대 대기중';
            
            const pickRaw = localStorage.getItem(`routy_food_result_${activeRoomCode}_${member}`);
            let pickName = '';
            if (pickRaw) {
              try {
                pickName = JSON.parse(pickRaw).menuName;
              } catch {
                pickName = pickRaw;
              }
            }

            return (
              <div key={`member-${idx}`} className="flex-1 flex flex-col gap-1.5 min-w-[70px]">
                <span className="font-title text-[10px] text-[#8C7A6B] uppercase tracking-wider text-center truncate px-1">
                  {isMe ? 'My Pick' : isWaiting ? 'Partner' : `${member}`}
                </span>
                <div className={`font-title p-2 rounded-2xl border-2 text-[11px] text-center flex items-center justify-center h-[52px] break-keep ${
                  pickName ? 'bg-[#F9ECE7] border-[#F2D1C5] text-[#C25E3E]' : 'bg-[#FAF7F2] border-[#EADFCF] text-[#A89889] border-dashed'
                }`}>
                  {pickName ? pickName : isWaiting ? '대기중 ⏳' : '미참여'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
