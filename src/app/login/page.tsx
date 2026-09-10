'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser } from '@/lib/authMock';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. 회원가입 핸들러
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    const res = registerUser(username, password);
    if (!res.success) {
      setError(res.message);
      return;
    }

    setSuccessMsg('회원가입이 완료되었습니다! 로그인해주세요 🎉');
    setMode('login');
    setPassword('');
    setPasswordConfirm('');
  };

  // 2. 로그인 핸들러
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const res = loginUser(username, password);
    if (!res.success) {
      setError(res.message);
      return;
    }

    router.push('/');
  };

  return (
    <main className="max-w-md mx-auto min-h-screen px-5 pt-8 pb-12 flex flex-col justify-between bg-[#FAF7F2] text-[#2D241E]">
      <div className="flex flex-col gap-5">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-center pb-3 border-b border-[#EADFCF]">
          <span className="font-title text-xs text-[#A89889] bg-[#F7F2EB] px-3 py-1 rounded-full border border-[#EADFCF]">
            ROUTY ACCOUNT
          </span>
        </header>

        {/* 타이틀 안내 */}
        <div className="text-center pt-1">
          <div className="w-14 h-14 rounded-2xl bg-[#F8EFE4] border-2 border-[#E6D4BE] flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner">
            {mode === 'login' ? '🔑' : '✨'}
          </div>
          <h1 className="font-title text-2xl tracking-tight text-[#2D241E]">
            {mode === 'login' ? 'Routy 로그인' : '초간편 회원가입'}
          </h1>
          <p className="font-body text-xs text-[#8C7A6B] mt-1.5">
            {mode === 'login'
              ? '아이디와 비밀번호로 간편하게 로그인하세요'
              : '개인정보 필요 없이 아이디와 비밀번호만 입력하면 끝!'}
          </p>

          {/* 💡 심사위원/테스터용 테스트 계정 안내 텍스트 */}
          {mode === 'login' && (
            <div className="mt-3.5 inline-block bg-[#F8EFE4]/80 border border-[#EADFCF] rounded-xl px-3.5 py-2">
              <p className="font-body text-[11px] text-[#7A6251]">
                 해커톤용 계정: <b className="text-[#2D241E]">routy</b> 또는 <b className="text-[#2D241E]">admin</b> <span className="text-[#C25E3E] font-bold">/ 1234</span>
              </p>
            </div>
          )}
        </div>

        {/* 탭 전환 버튼 */}
        <div className="font-title flex rounded-2xl bg-[#EFE9DF] p-1 text-xs border border-[#E3D9CC]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-[#2D241E] text-[#F3D5B5] shadow-sm'
                : 'text-[#7A6251] hover:text-[#2D241E]'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-[#2D241E] text-[#F3D5B5] shadow-sm'
                : 'text-[#7A6251] hover:text-[#2D241E]'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 입력 폼 카드 */}
        <div className="bg-white p-6 rounded-[28px] border-2 border-[#EADFCF] shadow-[0_8px_24px_rgba(74,59,50,0.04)]">
          <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="flex flex-col gap-4">
            {/* 아이디 필드 */}
            <div className="flex flex-col gap-1.5">
              <label className="font-title text-xs text-[#7A6251]">아이디</label>
              <input
                type="text"
                placeholder={mode === 'login' ? '아이디를 입력해주세요' : '사용할 아이디를 입력해주세요'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="font-body px-4 py-3 text-xs bg-[#FAF7F2] rounded-xl border-2 border-[#EADFCF] text-[#2D241E] focus:outline-none focus:border-[#C25E3E] transition"
              />
            </div>

            {/* 비밀번호 필드 */}
            <div className="flex flex-col gap-1.5">
              <label className="font-title text-xs text-[#7A6251]">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-body px-4 py-3 text-xs bg-[#FAF7F2] rounded-xl border-2 border-[#EADFCF] text-[#2D241E] focus:outline-none focus:border-[#C25E3E] transition"
              />
            </div>

            {/* 회원가입 시 비밀번호 확인 필드 */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                <label className="font-title text-xs text-[#7A6251]">비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="비밀번호를 한 번 더 입력해주세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  className="font-body px-4 py-3 text-xs bg-[#FAF7F2] rounded-xl border-2 border-[#EADFCF] text-[#2D241E] focus:outline-none focus:border-[#C25E3E] transition"
                />
              </div>
            )}

            {/* 에러 및 성공 메시지 */}
            {error && (
              <p className="font-body text-xs text-[#C25E3E] bg-[#F9ECE7] border border-[#F2D1C5] px-3.5 py-2 rounded-xl text-center">
                ⚠️ {error}
              </p>
            )}
            {successMsg && (
              <p className="font-body text-xs text-[#5B8C51] bg-[#F1F7EE] border border-[#D5E8CE] px-3.5 py-2 rounded-xl text-center">
                {successMsg}
              </p>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="font-title mt-2 py-3.5 bg-[#2D241E] hover:bg-[#43362E] active:scale-[0.98] text-[#FAF7F2] text-xs rounded-2xl transition shadow-sm"
            >
              {mode === 'login' ? '로그인하기' : '가입 완료하기'}
            </button>
          </form>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="font-body text-center text-[11px] text-[#A89889] pt-6">
        🔒 해커톤 시연용 서비스로, 개인정보는 일절 수집하지 않습니다.
      </footer>
    </main>
  );
}