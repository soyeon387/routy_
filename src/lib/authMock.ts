export interface User {
  username: string;
  password: string;
  createdAt: number;
}

const STORAGE_USERS_KEY = 'routy_users_db';
const STORAGE_SESSION_KEY = 'routy_session_user';

// 테스트 시연용 기본 계정 (admin / 1234, routy / 1234)
const DEFAULT_USERS: Record<string, User> = {
  admin: {
    username: 'admin',
    password: '1234',
    createdAt: Date.now(),
  },
  routy: {
    username: 'routy',
    password: '1234',
    createdAt: Date.now(),
  },
};

// 1. 전체 유저 목록 가져오기 (회원가입 데이터는 새로고침해도 유지되도록 localStorage 사용)
export function getUsers(): Record<string, User> {
  if (typeof window === 'undefined') return DEFAULT_USERS;

  const raw = localStorage.getItem(STORAGE_USERS_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

// 2. 아이디 중복 확인
export function checkUserExists(username: string): boolean {
  const users = getUsers();
  return Boolean(users[username.trim()]);
}

// 3. 회원가입
export function registerUser(username: string, password: string): { success: boolean; message: string } {
  const trimmed = username.trim();
  if (!trimmed || !password) {
    return { success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' };
  }

  const users = getUsers();
  if (users[trimmed]) {
    return { success: false, message: '이미 존재하는 아이디입니다.' };
  }

  users[trimmed] = {
    username: trimmed,
    password,
    createdAt: Date.now(),
  };

  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  return { success: true, message: '회원가입이 완료되었습니다!' };
}

// 4. 로그인 (브라우저 탭을 닫으면 세션이 풀리도록 sessionStorage 사용)
export function loginUser(username: string, password: string): { success: boolean; message: string } {
  const trimmed = username.trim();
  const users = getUsers();
  const user = users[trimmed];

  if (!user || user.password !== password) {
    return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
  }

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_SESSION_KEY, trimmed);
  }
  return { success: true, message: '로그인 성공' };
}

// 5. 현재 로그인된 유저 가져오기
export function getCurrentUser(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_SESSION_KEY);
}

// 6. 로그아웃
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_SESSION_KEY);
}