'use client';

import { useState, useEffect } from 'react';

// 밸런스 게임 질문 리스트 (추후 AI 프롬프트 재료로 사용됨)
const QUESTIONS = [
  { id: 1, title: '오늘 끌리는 온도는?', optionA: '🔥 뜨끈한 국물', optionB: '🍳 바싹한 구이·볶음' },
  { id: 2, title: '메인 재료는?', optionA: '🥩 든든한 고기', optionB: '🐟 깔끔한 해산물' },
  { id: 3, title: '탄수화물 베이스는?', optionA: '🍚 한국인은 밥', optionB: '🍜 호로록 면' },
  { id: 4, title: '맛의 방향은?', optionA: '🌶️ 화끈한 매운맛', optionB: '🧈 담백·고소한 맛' },
];

export default function FoodBalanceGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const [myResult, setMyResult] = useState<string | null>(null);
  const [partnerResult, setPartnerResult] = useState<string | null>(null); // 나중에 DB 연동 시 교체

  // 오늘 날짜 구하기 (YYYY-MM-DD)
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  // 1. 초기 로드 시 오늘 날짜의 결과가 있는지 확인
  useEffect(() => {
    const today = getTodayDate();
    const savedDate = localStorage.getItem('routy_food_date');
    
    // 날짜가 다르면 초기화 (새로운 하루)
    if (savedDate !== today) {
      localStorage.removeItem('routy_food_result');
      localStorage.setItem('routy_food_date', today);
    } else {
      // 오늘 이미 참여한 결과가 있다면 불러오기
      const savedResult = localStorage.getItem('routy_food_result');
      if (savedResult) setMyResult(savedResult);
    }

    // [테스트용] 파트너 결과 임시 설정
    // setPartnerResult('마라탕');
  }, []);

  // 게임 시작
  const startGame = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setAnswers([]);
  };

  // 선택지 클릭 (카드 스와이프 효과 대체)
  const handleSelect = (choice: string) => {
    const newAnswers = [...answers, choice];
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 마지막 선택 완료 시 결과 도출
      generateMockResult(newAnswers);
    }
  };

  // 임시 AI 추천 로직 (나중에 AI API 프롬프트 호출로 교체)
  const generateMockResult = (finalAnswers: string[]) => {
    setIsPlaying(false);
    
    // 임시 로직: 답변을 조합해 그럴듯한 메뉴 하나 반환
    const text = finalAnswers.join(' ');
    let result = '김치찌개'; // 기본값
    
    if (text.includes('면') && text.includes('국물')) result = '짬뽕 또는 라멘';
    else if (text.includes('고기') && text.includes('구이')) result = '삼겹살 구이';
    else if (text.includes('해산물') && text.includes('매운맛')) result = '해물찜 또는 낙지볶음';
    else if (text.includes('밥') && text.includes('담백')) result = '초밥 또는 생선구이 백반';

    setMyResult(result);
    localStorage.setItem('routy_food_result', result);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 게임 화면 영역 */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[350px] flex flex-col justify-center relative overflow-hidden">
        
        {!isPlaying && !myResult ? (
          // 시작 전 화면
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-5xl">🍕</div>
            <div>
              <h2 className="text-xl font-black text-slate-900">오늘 뭐 먹지?</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                4가지 음식 취향을 선택하면<br/>AI가 최고의 메뉴를 추천해 드립니다.
              </p>
            </div>
            <button
              onClick={startGame}
              className="mt-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full transition active:scale-95 shadow-md"
            >
              취향 밸런스 게임 시작
            </button>
          </div>
        ) : isPlaying ? (
          // 게임 진행 중 화면 (A vs B 카드)
          <div className="flex flex-col h-full w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-slate-400 tracking-widest">
                STEP {currentStep + 1} / {QUESTIONS.length}
              </span>
              <h2 className="text-lg font-black text-slate-800 mt-1">
                {QUESTIONS[currentStep].title}
              </h2>
            </div>

            <div className="flex flex-col gap-3 flex-1 justify-center">
              <button
                onClick={() => handleSelect(QUESTIONS[currentStep].optionA)}
                className="w-full py-8 bg-slate-50 hover:bg-red-50 border-2 border-slate-100 hover:border-red-200 text-slate-800 rounded-2xl font-bold text-lg transition transform active:scale-[0.98]"
              >
                {QUESTIONS[currentStep].optionA}
              </button>
              <div className="text-center text-xs font-black text-slate-300 relative">
                <span className="bg-white px-2 relative z-10">VS</span>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 -z-0" />
              </div>
              <button
                onClick={() => handleSelect(QUESTIONS[currentStep].optionB)}
                className="w-full py-8 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 text-slate-800 rounded-2xl font-bold text-lg transition transform active:scale-[0.98]"
              >
                {QUESTIONS[currentStep].optionB}
              </button>
            </div>
          </div>
        ) : (
          // 결과 화면
          <div className="text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">
              AI 추천 메뉴
            </span>
            <h2 className="text-2xl font-black text-slate-900">{myResult}</h2>
            <p className="text-xs text-slate-400">오늘 선택한 취향을 기반으로 추천되었어요.</p>
            
            <button
              onClick={startGame}
              className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4"
            >
              다시 선택하기 (갱신)
            </button>
          </div>
        )}
      </div>

      {/* 하단 각자 상태 결과창 */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-200">오늘의 메뉴 선택 현황</h3>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            매일 자정 초기화
          </span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-xs text-slate-400 font-semibold">나의 결과</span>
            <div className={`p-3 rounded-xl border flex items-center justify-center min-h-[60px] text-sm font-bold ${
              myResult ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800/50 border-dashed border-slate-700 text-slate-500'
            }`}>
              {myResult || '❌ 미참여'}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-xs text-slate-400 font-semibold">상대방 결과</span>
            <div className={`p-3 rounded-xl border flex items-center justify-center min-h-[60px] text-sm font-bold ${
              partnerResult ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800/50 border-dashed border-slate-700 text-slate-500'
            }`}>
              {partnerResult || '❌ 미참여'}
            </div>
          </div>
        </div>
        
        {myResult && partnerResult && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <p className="text-xs font-bold text-red-400">두 사람 모두 오늘의 메뉴를 골랐어요! ✨</p>
          </div>
        )}
      </div>
      
    </div>
  );
}