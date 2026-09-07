'use client';

import { useEffect, useRef, useState } from 'react';

export interface Place {
  id: string;
  name: string;
  category: '식당' | '카페' | '활동';
  lat: number;
  lng: number;
  isVisited: boolean;
  address?: string;
}

export interface FoodResult {
  date: string;
  myResult?: string;
  partnerResult?: string;
}

export interface MapRoom {
  code: string;
  title: string;
  places: Place[];
  updatedAt: number;
  foodResult?: FoodResult;
}

const DEFAULT_PLACES: Place[] = [
  { id: '1', name: '성수 감성 파스타', category: '식당', lat: 37.54458, lng: 127.05603, isVisited: false, address: '서울 성동구 연무장길' },
  { id: '2', name: '성수 소금빵 베이커리', category: '카페', lat: 37.54612, lng: 127.05834, isVisited: true, address: '서울 성동구 아차산로' },
  { id: '3', name: '서울숲 산책로 & 사슴방사장', category: '활동', lat: 37.54308, lng: 127.04179, isVisited: false, address: '서울 성동구 뚝섬로' },
];

const CATEGORY_ICONS: Record<string, string> = {
  식당: '🍽️',
  카페: '☕',
  활동: '🎡',
};

// 밸런스 게임 문항
const QUESTIONS = [
  { id: 1, title: '오늘 끌리는 온도는?', optionA: '🔥 뜨끈한 국물', optionB: '🍳 바싹한 구이·볶음' },
  { id: 2, title: '메인 재료는?', optionA: '🥩 든든한 고기', optionB: '🐟 깔끔한 해산물' },
  { id: 3, title: '탄수화물 베이스는?', optionA: '🍚 한국인은 밥', optionB: '🍜 호로록 면' },
  { id: 4, title: '맛의 방향은?', optionA: '🌶️ 화끈한 매운맛', optionB: '🧈 담백·고소한 맛' },
];

const ROOMS_STORAGE_KEY = 'routy_rooms_v2';
const CURRENT_ROOM_KEY = 'routy_current_room_code';
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const getTodayDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

interface DateMapProps {
  externalNewPlace?: Place | null;
}

export default function DateMap({ externalNewPlace }: DateMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const [rooms, setRooms] = useState<MapRoom[]>([]);
  const [activeCode, setActiveCode] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'food'>('map'); // 탭 전환 (지도 vs 밸런스게임)

  // 방 모달 상태
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create');
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // 지도 조작 상태
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // 밸런스 게임 내부 상태
  const [isFoodPlaying, setIsFoodPlaying] = useState(false);
  const [foodStep, setFoodStep] = useState(0);
  const [foodAnswers, setFoodAnswers] = useState<string[]>([]);

  // 1. 방 초기 로드 및 날짜별 음식 결과 체크
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROOMS_STORAGE_KEY);
      let loaded: MapRoom[] = saved ? JSON.parse(saved) : [];
      const hash = window.location.hash.replace('#', '').toUpperCase();
      const today = getTodayDate();

      if (loaded.length === 0) {
        const code = hash && hash.length === 6 ? hash : generateCode();
        loaded = [{
          code,
          title: '우리들의 데이트 아카이브 ❤️',
          places: DEFAULT_PLACES,
          updatedAt: Date.now(),
          foodResult: { date: today }
        }];
      } else {
        // 날짜가 바뀌었으면 방마다 음식 결과 초기화
        loaded = loaded.map((r) => {
          if (!r.foodResult || r.foodResult.date !== today) {
            return { ...r, foodResult: { date: today } };
          }
          return r;
        });
      }

      setRooms(loaded);
      let target = hash && loaded.some((r) => r.code === hash) ? hash : localStorage.getItem(CURRENT_ROOM_KEY) || loaded[0].code;
      if (!loaded.some((r) => r.code === target)) target = loaded[0].code;

      setActiveCode(target);
      window.location.hash = target;
      localStorage.setItem(CURRENT_ROOM_KEY, target);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(loaded));
    } catch {
      setStatus('error');
      setErrorMessage('데이터를 불러오지 못했습니다.');
    }
  }, []);

  const currentRoom = rooms.find((r) => r.code === activeCode) || rooms[0];

  const updateCurrentRoom = (updater: (room: MapRoom) => MapRoom) => {
    if (!currentRoom) return;
    setRooms((prev) => {
      const nextRooms = prev.map((r) => (r.code === currentRoom.code ? updater(r) : r));
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(nextRooms));
      return nextRooms;
    });
  };

  // 외부(카페 탭 등)에서 장소 추가 시
  useEffect(() => {
    if (!externalNewPlace) return;
    updateCurrentRoom((room) => ({
      ...room,
      places: [externalNewPlace, ...room.places],
      updatedAt: Date.now(),
    }));
  }, [externalNewPlace]);

  // 2. 지도 SDK 초기화
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
    if (!apiKey) {
      setStatus('error');
      setErrorMessage('.env.local에 NEXT_PUBLIC_KAKAO_MAP_API_KEY가 없습니다.');
      return;
    }

    const initMap = () => {
      if (!mapContainerRef.current || !window.kakao?.maps) return;
      window.kakao.maps.load(() => {
        if (!mapContainerRef.current) return;
        const center = new window.kakao.maps.LatLng(37.54458, 127.05603);
        const map = new window.kakao.maps.Map(mapContainerRef.current, { center, level: 4 });
        map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
        mapInstanceRef.current = map;
        setStatus('ready');
      });
    };

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services,clusterer`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => initMap();
    script.onerror = () => {
      setStatus('error');
      setErrorMessage('카카오 지도 스크립트 로드 실패');
    };

    return () => {
      overlaysRef.current.forEach((o) => o.setMap(null));
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, []);

  // 3. 마커 & 동선 렌더링
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || status !== 'ready' || !currentRoom || viewMode !== 'map') return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    if (polylineRef.current) polylineRef.current.setMap(null);

    const filtered = currentRoom.places.filter((p) =>
      selectedCategory === '전체' ? true : p.category === selectedCategory
    );

    if (filtered.length > 1) {
      polylineRef.current = new window.kakao.maps.Polyline({
        path: filtered.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng)),
        strokeWeight: 4,
        strokeColor: '#334155',
        strokeOpacity: 0.8,
        strokeStyle: 'dashed',
      });
      polylineRef.current.setMap(map);
    }

    filtered.forEach((place) => {
      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      const isSelected = selectedPlaceId === place.id;
      const markerEl = document.createElement('div');
      markerEl.className = 'flex flex-col items-center cursor-pointer select-none';

      const heartSvg = place.isVisited
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="#ef4444" stroke="#dc2626" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="#ffffff" stroke="#ef4444" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;

      markerEl.innerHTML = `
        <div style="filter: drop-shadow(0 4px 6px rgba(15,23,42,0.25)); transition: transform 0.2s;" class="${isSelected ? 'scale-125' : 'hover:scale-110'}">
          ${heartSvg}
        </div>
        <span style="background: ${isSelected ? '#0f172a' : '#ffffff'}; color: ${isSelected ? '#ffffff' : '#1e293b'}; border: 1.5px solid ${isSelected ? '#ef4444' : '#cbd5e1'}; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; margin-top: 3px; box-shadow: 0 2px 5px rgba(15,23,42,0.1); white-space: nowrap;">
          ${CATEGORY_ICONS[place.category] || '📍'} ${place.name}
        </span>
      `;

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPlaceId(place.id);
        toggleVisited(place.id);
      });

      const overlay = new window.kakao.maps.CustomOverlay({ position, content: markerEl, yAnchor: 1.15 });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [currentRoom, selectedCategory, selectedPlaceId, status, viewMode]);

  const toggleVisited = (id: string) => {
    updateCurrentRoom((room) => ({
      ...room,
      places: room.places.map((p) => (p.id === id ? { ...p, isVisited: !p.isVisited } : p)),
    }));
  };

  const focusPlace = (place: { lat: number; lng: number; id?: string }) => {
    if (place.id) setSelectedPlaceId(place.id);
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setLevel(3);
    mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(place.lat, place.lng));
  };

  const removePlace = (id: string) => {
    updateCurrentRoom((room) => ({
      ...room,
      places: room.places.filter((p) => p.id !== id),
    }));
    if (selectedPlaceId === id) setSelectedPlaceId(null);
  };

  // 장소 검색
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !window.kakao?.maps?.services) return;
    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchQuery, (data: any, s: any) => {
      setIsSearching(false);
      if (s === window.kakao.maps.services.Status.OK) {
        setSearchResults(data.slice(0, 5));
      } else {
        alert('검색 결과가 없습니다.');
        setSearchResults([]);
      }
    });
  };

  const addPlaceFromSearch = (item: any, category: '식당' | '카페' | '활동') => {
    const newPlace: Place = {
      id: String(item.id || Date.now()),
      name: item.place_name,
      category,
      lat: parseFloat(item.y),
      lng: parseFloat(item.x),
      isVisited: false,
      address: item.road_address_name || item.address_name,
    };
    updateCurrentRoom((room) => ({ ...room, places: [newPlace, ...room.places] }));
    setSearchResults([]);
    setSearchQuery('');
    setViewMode('map');
    focusPlace(newPlace);
  };

  // 밸런스 게임 로직
  const startFoodGame = () => {
    setIsFoodPlaying(true);
    setFoodStep(0);
    setFoodAnswers([]);
  };

  const handleFoodSelect = (choice: string) => {
    const nextAnswers = [...foodAnswers, choice];
    setFoodAnswers(nextAnswers);

    if (foodStep < QUESTIONS.length - 1) {
      setFoodStep(foodStep + 1);
    } else {
      setIsFoodPlaying(false);
      const text = nextAnswers.join(' ');
      let result = '김치찌개와 계란말이';
      if (text.includes('면') && text.includes('국물')) result = '얼큰한 짬뽕 또는 라멘';
      else if (text.includes('고기') && text.includes('구이')) result = '육즙 가득 삼겹살 구이';
      else if (text.includes('해산물') && text.includes('매운맛')) result = '매콤한 해물찜 또는 낙지볶음';
      else if (text.includes('밥') && text.includes('담백')) result = '정갈한 초밥 또는 생선구이';

      updateCurrentRoom((room) => ({
        ...room,
        foodResult: {
          ...room.foodResult,
          date: getTodayDate(),
          myResult: result,
        },
      }));
    }
  };

  const switchRoom = (code: string) => {
    setActiveCode(code);
    window.location.hash = code;
    localStorage.setItem(CURRENT_ROOM_KEY, code);
    setSelectedPlaceId(null);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    const code = generateCode();
    const today = getTodayDate();
    const updated = [{ code, title: newRoomTitle.trim(), places: [], updatedAt: Date.now(), foodResult: { date: today } }, ...rooms];
    setRooms(updated);
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updated));
    switchRoom(code);
    setNewRoomTitle('');
    setShowRoomModal(false);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinRoomCode.trim().toUpperCase();
    if (clean.length !== 6) return alert('6자리 코드를 입력해주세요.');
    const today = getTodayDate();
    if (!rooms.some((r) => r.code === clean)) {
      const updated = [{ code: clean, title: newRoomTitle.trim() || `${clean}의 지도`, places: DEFAULT_PLACES, updatedAt: Date.now(), foodResult: { date: today } }, ...rooms];
      setRooms(updated);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updated));
    }
    switchRoom(clean);
    setJoinRoomCode('');
    setNewRoomTitle('');
    setShowRoomModal(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 상단 방(Room) 선택 및 서랍 헤더 */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col gap-3 shadow-md border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">ROOM</span>
            <select
              value={activeCode}
              onChange={(e) => switchRoom(e.target.value)}
              className="bg-slate-800 text-slate-100 font-bold text-sm rounded-lg px-2.5 py-1.5 border border-slate-700 outline-none truncate cursor-pointer hover:bg-slate-750"
            >
              {rooms.map((room) => (
                <option key={room.code} value={room.code}>{room.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowRoomModal(true)}
            className="text-xs font-semibold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            + 새 방/참여
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>초대 코드:</span>
            <span className="font-mono font-bold text-slate-200 tracking-wider bg-slate-800 px-2 py-0.5 rounded">{activeCode}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}#${activeCode}`);
              setCopyFeedback(true);
              setTimeout(() => setCopyFeedback(false), 2000);
            }}
            className="text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            {copyFeedback ? '링크 복사됨! ✨' : '공유 링크 복사'}
          </button>
        </div>
      </div>

      {/* 2. 방 안에서의 기능 탭 전환 (지도 vs 오늘 뭐 먹지) */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setViewMode('map')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>🗺️ 장소 지도 아카이브</span>
        </button>
        <button
          onClick={() => setViewMode('food')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            viewMode === 'food' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>🍕 오늘 뭐 먹지? (밸런스 게임)</span>
        </button>
      </div>

      {/* 3. 뷰 모드에 따른 분기 렌더링 */}
      {viewMode === 'map' ? (
        <>
          {/* 검색창 & 필터 */}
          <div className="flex flex-col gap-2.5">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="장소 검색 후 아카이브에 추가 (예: 성수 대림창고)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800 shadow-sm"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                {isSearching ? '검색중' : '검색'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col gap-1.5 z-20">
                <span className="text-xs font-bold text-slate-500 px-2 py-1">추가할 카테고리를 선택하세요</span>
                {searchResults.map((res) => (
                  <div key={res.id} className="p-2 hover:bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div className="text-left overflow-hidden pr-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{res.place_name}</p>
                      <p className="text-xs text-slate-400 truncate">{res.road_address_name || res.address_name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => addPlaceFromSearch(res, '식당')} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium">🍽️ 식당</button>
                      <button onClick={() => addPlaceFromSearch(res, '카페')} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium">☕ 카페</button>
                      <button onClick={() => addPlaceFromSearch(res, '활동')} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium">🎡 활동</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-1.5 items-center overflow-x-auto pb-1">
              {['전체', '식당', '카페', '활동'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap shadow-sm ${
                    selectedCategory === cat ? 'bg-slate-900 text-white shadow-slate-300' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === '전체' ? '모아보기' : `${CATEGORY_ICONS[cat]} ${cat}`}
                </button>
              ))}
            </div>
          </div>

          {/* 지도 영역 */}
          <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100">
            {status === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/85 z-20">
                <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-600">지도를 불러오고 있습니다</p>
              </div>
            )}
            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50 z-20">
                <p className="text-red-500 font-bold mb-1">지도를 띄울 수 없습니다</p>
                <p className="text-xs text-slate-500">{errorMessage}</p>
              </div>
            )}
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-xs font-medium text-slate-100 border border-slate-700 pointer-events-none flex items-center gap-2">
              <span>🤍 찜</span>
              <span className="text-slate-500">|</span>
              <span className="text-red-400 font-semibold">❤️ 다녀옴</span>
            </div>
          </div>

          {/* 장소 목록 리스트 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-bold text-slate-800">{currentRoom?.title} ({currentRoom?.places.length || 0}곳)</h2>
              <span className="text-xs text-slate-400">카드를 누르면 지도가 이동합니다</span>
            </div>

            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {currentRoom?.places.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                  등록된 장소가 없습니다. 상단에서 장소를 검색해보세요!
                </div>
              ) : (
                currentRoom?.places
                  .filter((p) => (selectedCategory === '전체' ? true : p.category === selectedCategory))
                  .map((place, idx) => {
                    const isSelected = selectedPlaceId === place.id;
                    return (
                      <div
                        key={place.id}
                        onClick={() => focusPlace(place)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">{CATEGORY_ICONS[place.category]}</span>
                              <span className="text-sm font-bold tracking-tight">{place.name}</span>
                            </div>
                            {place.address && <p className="text-xs text-slate-400 mt-0.5">{place.address}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleVisited(place.id)} className="p-1 text-xl active:scale-90 transition-transform">
                            {place.isVisited ? '❤️' : '🤍'}
                          </button>
                          <button onClick={() => removePlace(place.id)} className={`text-xs px-2 py-1 rounded transition ${isSelected ? 'text-slate-400 hover:text-slate-200' : 'text-slate-300 hover:text-slate-500'}`}>
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </>
      ) : (
        /* 밸런스 게임 뷰 모드 */
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[340px] flex flex-col justify-center relative overflow-hidden">
            {!isFoodPlaying && !currentRoom?.foodResult?.myResult ? (
              <div className="text-center flex flex-col items-center gap-4">
                <div className="text-5xl">🍕</div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">오늘 방 멤버와 뭐 먹지?</h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    4가지 질문에 답하면 이 방에 공유된<br/>오늘의 추천 메뉴가 완성됩니다.
                  </p>
                </div>
                <button
                  onClick={startFoodGame}
                  className="mt-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full transition active:scale-95 shadow-md"
                >
                  취향 밸런스 게임 시작
                </button>
              </div>
            ) : isFoodPlaying ? (
              <div className="flex flex-col h-full w-full">
                <div className="text-center mb-6">
                  <span className="text-xs font-bold text-slate-400 tracking-widest">
                    STEP {foodStep + 1} / {QUESTIONS.length}
                  </span>
                  <h2 className="text-lg font-black text-slate-800 mt-1">
                    {QUESTIONS[foodStep].title}
                  </h2>
                </div>

                <div className="flex flex-col gap-3 flex-1 justify-center">
                  <button
                    onClick={() => handleFoodSelect(QUESTIONS[foodStep].optionA)}
                    className="w-full py-6 bg-slate-50 hover:bg-red-50 border-2 border-slate-100 hover:border-red-200 text-slate-800 rounded-2xl font-bold text-base transition transform active:scale-[0.98]"
                  >
                    {QUESTIONS[foodStep].optionA}
                  </button>
                  <div className="text-center text-xs font-black text-slate-300 relative">
                    <span className="bg-white px-2 relative z-10">VS</span>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 -z-0" />
                  </div>
                  <button
                    onClick={() => handleFoodSelect(QUESTIONS[foodStep].optionB)}
                    className="w-full py-6 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 text-slate-800 rounded-2xl font-bold text-base transition transform active:scale-[0.98]"
                  >
                    {QUESTIONS[foodStep].optionB}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center gap-4">
                <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                  오늘의 추천 메뉴 완성 ✨
                </span>
                <h2 className="text-2xl font-black text-slate-900">{currentRoom?.foodResult?.myResult}</h2>
                <p className="text-xs text-slate-400">방 멤버와 아래 결과를 비교해 보세요!</p>
                <button
                  onClick={startFoodGame}
                  className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4"
                >
                  다시 선택하기 (결과 갱신)
                </button>
              </div>
            )}
          </div>

          {/* 방 멤버별 결과 현황판 */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-200">현재 방 멤버 메뉴 선택 현황</h3>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">매일 자정 갱신</span>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">나의 선택</span>
                <div className={`p-3 rounded-xl border flex items-center justify-center min-h-[55px] text-sm font-bold text-center ${
                  currentRoom?.foodResult?.myResult ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800/50 border-dashed border-slate-700 text-slate-500'
                }`}>
                  {currentRoom?.foodResult?.myResult || '❌ 미참여'}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                <span className="text-xs text-slate-400 font-semibold">상대방 선택</span>
                <div className={`p-3 rounded-xl border flex items-center justify-center min-h-[55px] text-sm font-bold text-center ${
                  currentRoom?.foodResult?.partnerResult ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-800/50 border-dashed border-slate-700 text-slate-500'
                }`}>
                  {currentRoom?.foodResult?.partnerResult || '⏳ 대기중'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 방 생성/참여 모달 */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base">지도 방 관리</h3>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button onClick={() => setModalMode('create')} className={`flex-1 py-1.5 rounded-lg transition ${modalMode === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>새 방 만들기</button>
              <button onClick={() => setModalMode('join')} className={`flex-1 py-1.5 rounded-lg transition ${modalMode === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>코드로 참여하기</button>
            </div>
            {modalMode === 'create' ? (
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">방 이름</label>
                  <input type="text" placeholder="예: 성수 데이트, 맛집 투어" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} required className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition mt-1">방 생성하기</button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">6자리 초대 코드</label>
                  <input type="text" maxLength={6} placeholder="예: A8F2K9" value={joinRoomCode} onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())} required className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase tracking-widest text-center focus:outline-none focus:border-slate-800" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">내가 부를 방 이름 (선택)</label>
                  <input type="text" placeholder="예: 친구와의 방" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition mt-1">방 들어가기</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}