'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export interface HeartColor {
  id: string;
  name: string;
  fill: string;
  stroke: string;
}

export const HEART_PALETTE: HeartColor[] = [
  { id: 'pastel-pink', name: '파스텔 핑크', fill: '#FBC4CE', stroke: '#E88A9A' },
  { id: 'pastel-yellow', name: '버터 옐로우', fill: '#FCE79A', stroke: '#E0B84C' },
  { id: 'pastel-green', name: '세이지 민트', fill: '#BFDEBE', stroke: '#7EA87D' },
  { id: 'classic-red', name: '클래식 레드', fill: '#FF4D4D', stroke: '#CC1F1F' },
  { id: 'vivid-blue', name: '코발트 블루', fill: '#3E82F7', stroke: '#1B54C4' },
];

export interface GroupItem {
  name: string;
  colorId: string;
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isVisited: boolean;
  address?: string;
  group?: string;
}

export interface MapRoom {
  code: string;
  title: string;
  places: Place[];
  groups: GroupItem[];
  defaultHeartColorId?: string;
  updatedAt: number;
}

const DEFAULT_GROUPS: GroupItem[] = [
  { name: '서울', colorId: 'pastel-yellow' },
  { name: '9월 10일 약속', colorId: 'pastel-pink' },
];

const DEFAULT_PLACES: Place[] = [
  { id: '1', name: '성수 핫플 맛집', lat: 37.54458, lng: 127.05603, isVisited: false, address: '서울 성동구 연무장길', group: '9월 10일 약속' },
  { id: '2', name: '성수 소금빵 베이커리', lat: 37.54612, lng: 127.05834, isVisited: true, address: '서울 성동구 아차산로', group: '9월 10일 약속' },
  { id: '3', name: '서울숲 산책로', lat: 37.54308, lng: 127.04179, isVisited: true, address: '서울 성동구 뚝섬로', group: '서울' },
];

const ROOMS_STORAGE_KEY = 'routy_rooms_v2';
const CURRENT_ROOM_KEY = 'routy_current_room_code';
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

interface DateMapProps {
  externalNewPlace?: Place | null;
}

export default function DateMap({ externalNewPlace }: DateMapProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const [rooms, setRooms] = useState<MapRoom[]>([]);
  const [activeCode, setActiveCode] = useState<string>('');

  const [selectedGroup, setSelectedGroup] = useState<string>('전체');

  // 하트 색상 변경 팝오버 상태
  const [activeColorPicker, setActiveColorPicker] = useState(false);
  const colorPickerContainerRef = useRef<HTMLDivElement>(null);

  // 초대 코드 보기 토글 상태
  const [showInviteCode, setShowInviteCode] = useState(false);

  // 새 그룹 생성 모달 상태
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColorId, setNewGroupColorId] = useState('pastel-pink');

  // 예쁜 커스텀 알림/확인 모달 상태
  const [alertModalMessage, setAlertModalMessage] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  // 방 모달
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create');
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. 초기 데이터 로드 및 마이그레이션
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROOMS_STORAGE_KEY);
      let loaded: any[] = saved ? JSON.parse(saved) : [];
      const hash = window.location.hash.replace('#', '').toUpperCase();

      let hasMigration = false;
      loaded = loaded.map((r: any) => {
        let updated = { ...r };
        if (updated.title.includes('데이트') || updated.title.includes('약속 플레이스')) {
          hasMigration = true;
          updated.title = '우리들의 찜 목록 📍';
        }
        if (!updated.groups || updated.groups.length === 0) {
          hasMigration = true;
          updated.groups = [...DEFAULT_GROUPS];
        } else if (typeof updated.groups[0] === 'string') {
          hasMigration = true;
          updated.groups = updated.groups.map((nameStr: string, idx: number) => ({
            name: nameStr,
            colorId: HEART_PALETTE[idx % HEART_PALETTE.length].id,
          }));
        } else if (updated.groups[0].colorId === undefined) {
          hasMigration = true;
          updated.groups = updated.groups.map((g: any, idx: number) => ({
            name: g.name,
            colorId: HEART_PALETTE[idx % HEART_PALETTE.length].id,
          }));
        }
        if (!updated.defaultHeartColorId) {
          hasMigration = true;
          updated.defaultHeartColorId = 'pastel-pink';
        }
        return updated;
      });

      if (loaded.length === 0) {
        const code = hash && hash.length === 6 ? hash : generateCode();
        loaded = [
          {
            code,
            title: '우리들의 찜 목록 📍',
            places: DEFAULT_PLACES,
            groups: DEFAULT_GROUPS,
            defaultHeartColorId: 'pastel-pink',
            updatedAt: Date.now(),
          },
        ];
        hasMigration = true;
      }

      setRooms(loaded);
      let target = hash && loaded.some((r) => r.code === hash) ? hash : localStorage.getItem(CURRENT_ROOM_KEY) || loaded[0].code;
      if (!loaded.some((r) => r.code === target)) target = loaded[0].code;

      setActiveCode(target);
      window.location.hash = target;
      localStorage.setItem(CURRENT_ROOM_KEY, target);

      if (hasMigration) {
        localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(loaded));
      }
    } catch {
      setStatus('error');
      setErrorMessage('데이터를 불러오지 못했습니다.');
    }
  }, []);

  // 외부 클릭 시 컬러 피커 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        colorPickerContainerRef.current &&
        !colorPickerContainerRef.current.contains(e.target as Node)
      ) {
        setActiveColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRoom: MapRoom = rooms.find((r) => r.code === activeCode) || rooms[0];

  const updateCurrentRoom = (updater: (room: MapRoom) => MapRoom) => {
    if (!currentRoom) return;
    setRooms((prev) => {
      const nextRooms = prev.map((r) => (r.code === currentRoom.code ? updater(r) : r));
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(nextRooms));
      return nextRooms;
    });
  };

  useEffect(() => {
    if (!externalNewPlace) return;
    updateCurrentRoom((room) => ({
      ...room,
      places: [externalNewPlace, ...room.places],
      updatedAt: Date.now(),
    }));
  }, [externalNewPlace]);

  const getHeartStyleForPlace = useCallback(
    (place: Place) => {
      if (!place.isVisited) {
        return {
          fill: '#FAF7F2',
          stroke: '#D5C2AD',
          strokeWidth: '2.5',
        };
      }
      
      let colorId = 'pastel-pink';
      if (!place.group || !currentRoom?.groups?.some((g) => g.name === place.group)) {
        colorId = currentRoom?.defaultHeartColorId || 'pastel-pink';
      } else {
        const matchedGroup = currentRoom?.groups?.find((g) => g.name === place.group);
        if (matchedGroup) colorId = matchedGroup.colorId;
      }

      const colorConfig = HEART_PALETTE.find((c) => c.id === colorId) || HEART_PALETTE[0];
      return {
        fill: colorConfig.fill,
        stroke: colorConfig.stroke,
        strokeWidth: '2',
      };
    },
    [currentRoom]
  );

  const executeSearch = useCallback((keyword: string) => {
    if (!keyword.trim() || !window.kakao?.maps?.services) return;
    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data: any, s: any) => {
      setIsSearching(false);
      if (s === window.kakao.maps.services.Status.OK) {
        setSearchResults(data.slice(0, 5));
        if (mapInstanceRef.current && data[0]) {
          mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(data[0].y, data[0].x));
        }
      } else {
        setSearchResults([]);
      }
    });
  }, []);

  // 2. 카카오 지도 SDK 초기화
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
        
        // 지도 배경(여백) 클릭 시 선택된 장소 해제
        window.kakao.maps.event.addListener(map, 'click', () => {
          setSelectedPlaceId(null);
        });

        map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
        mapInstanceRef.current = map;
        setStatus('ready');

        if (initialQuery) {
          executeSearch(initialQuery);
        }
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
    };
  }, [executeSearch, initialQuery]);

  // 3. 지도 마커 렌더링
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || status !== 'ready' || !currentRoom) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const filteredPlaces = currentRoom.places.filter((p) => {
      if (selectedGroup === '전체') return true;
      if (selectedGroup === '기본 찜') return !p.group || !currentRoom.groups.some((g) => g.name === p.group);
      return p.group === selectedGroup;
    });

    filteredPlaces.forEach((place, idx) => {
      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      const isSelected = selectedPlaceId === place.id;
      const heartStyle = getHeartStyleForPlace(place);

      const markerEl = document.createElement('div');
      markerEl.className = 'flex flex-col items-center cursor-pointer select-none';

      const heartSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="${heartStyle.fill}" stroke="${heartStyle.stroke}" stroke-width="${heartStyle.strokeWidth}">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      `;

      markerEl.innerHTML = `
        <div style="filter: drop-shadow(0 4px 8px rgba(45,36,30,0.18)); transition: transform 0.2s;" class="${isSelected ? 'scale-125' : 'hover:scale-110'}">
          ${heartSvg}
        </div>
        <span style="background: ${isSelected ? '#2D241E' : '#FFFFFF'}; color: ${isSelected ? '#F3D5B5' : '#2D241E'}; border: 2px solid ${isSelected ? '#C25E3E' : '#EADFCF'}; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; margin-top: 3px; box-shadow: 0 3px 8px rgba(74,59,50,0.08); white-space: nowrap; font-family: 'GmarketSansBold', sans-serif;">
          📍 ${place.name}
        </span>
      `;

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        // 이미 선택된 장소를 다시 누르면 선택 해제(토글), 아니면 선택
        setSelectedPlaceId((prev) => (prev === place.id ? null : place.id));
      });

      const overlay = new window.kakao.maps.CustomOverlay({ position, content: markerEl, yAnchor: 1.15 });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [currentRoom, selectedGroup, selectedPlaceId, status, getHeartStyleForPlace]);

  const toggleVisited = (id: string, targetIdx?: number) => {
    updateCurrentRoom((room) => {
      let count = 0;
      return {
        ...room,
        places: room.places.map((p, idx) => {
          if (p.id === id) {
            const isMatch = targetIdx !== undefined ? count === targetIdx : true;
            count++;
            if (isMatch) return { ...p, isVisited: !p.isVisited };
          }
          return p;
        }),
      };
    });
  };

  // 장소 클릭 시 선택 토글 적용
  const handleSelectOrUnselectPlace = (place: Place) => {
    if (selectedPlaceId === place.id) {
      setSelectedPlaceId(null);
    } else {
      focusPlace(place);
    }
  };

  const focusPlace = (place: Place) => {
    setSelectedPlaceId(place.id);
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setLevel(3);
    mapInstanceRef.current.panTo(new window.kakao.maps.LatLng(place.lat, place.lng));
  };

  const removePlaceItem = (placeId: string, targetIdx: number) => {
    updateCurrentRoom((room) => {
      let count = 0;
      return {
        ...room,
        places: room.places.filter((p) => {
          if (p.id === placeId) {
            const isMatch = count === targetIdx;
            count++;
            return !isMatch;
          }
          return true;
        }),
      };
    });
    if (selectedPlaceId === placeId) setSelectedPlaceId(null);
  };

  const handleUpdateActiveColor = (newColorId: string) => {
    if (selectedGroup === '기본 찜') {
      updateCurrentRoom((room) => ({
        ...room,
        defaultHeartColorId: newColorId,
        updatedAt: Date.now(),
      }));
    } else {
      updateCurrentRoom((room) => ({
        ...room,
        groups: room.groups.map((g) => (g.name === selectedGroup ? { ...g, colorId: newColorId } : g)),
        updatedAt: Date.now(),
      }));
    }
    setActiveColorPicker(false);
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (currentRoom.groups?.some((g) => g.name === trimmed)) {
      setAlertModalMessage('이미 존재하는 그룹 이름입니다.');
      return;
    }

    const nextGroups = [...(currentRoom.groups || []), { name: trimmed, colorId: newGroupColorId }];
    updateCurrentRoom((room) => ({
      ...room,
      groups: nextGroups,
      updatedAt: Date.now(),
    }));

    setSelectedGroup(trimmed);
    setNewGroupName('');
    setShowAddGroupModal(false);
  };

  const confirmDeleteGroup = () => {
    if (!groupToDelete) return;
    const nextGroups = (currentRoom.groups || []).filter((g) => g.name !== groupToDelete);
    updateCurrentRoom((room) => ({
      ...room,
      groups: nextGroups,
      places: room.places.filter((p) => p.group !== groupToDelete),
    }));
    if (selectedGroup === groupToDelete) setSelectedGroup('전체');
    setGroupToDelete(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroup === '전체') return;
    executeSearch(searchQuery);
  };

  const addPlaceFromSearch = (item: any) => {
    if (selectedGroup === '전체') return;
    const assignedGroup = selectedGroup === '기본 찜' ? undefined : selectedGroup;
    const newPlace: Place = {
      id: String(item.id || Date.now()),
      name: item.place_name,
      lat: parseFloat(item.y),
      lng: parseFloat(item.x),
      isVisited: false,
      address: item.road_address_name || item.address_name,
      group: assignedGroup,
    };

    updateCurrentRoom((room) => ({ ...room, places: [newPlace, ...room.places] }));
    setSearchResults([]);
    setSearchQuery('');
    focusPlace(newPlace);
  };

  const switchRoom = (code: string) => {
    setActiveCode(code);
    window.location.hash = code;
    localStorage.setItem(CURRENT_ROOM_KEY, code);
    setSelectedPlaceId(null);
    setSelectedGroup('전체');
    setShowInviteCode(false);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    const code = generateCode();
    const updated = [
      { code, title: newRoomTitle.trim(), places: [], groups: [...DEFAULT_GROUPS], defaultHeartColorId: 'pastel-pink', updatedAt: Date.now() },
      ...rooms,
    ];
    setRooms(updated);
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updated));
    switchRoom(code);
    setNewRoomTitle('');
    setShowRoomModal(false);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinRoomCode.trim().toUpperCase();
    if (clean.length !== 6) {
      setAlertModalMessage('6자리 코드를 입력해주세요.');
      return;
    }
    if (!rooms.some((r) => r.code === clean)) {
      const updated = [
        { code: clean, title: newRoomTitle.trim() || `${clean}의 지도`, places: DEFAULT_PLACES, groups: [...DEFAULT_GROUPS], defaultHeartColorId: 'pastel-pink', updatedAt: Date.now() },
        ...rooms,
      ];
      setRooms(updated);
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(updated));
    }
    switchRoom(clean);
    setJoinRoomCode('');
    setNewRoomTitle('');
    setShowRoomModal(false);
  };

  const roomGroups = currentRoom?.groups || DEFAULT_GROUPS;

  const filterPlaces = (p: Place) => {
    if (selectedGroup === '전체') return true;
    if (selectedGroup === '기본 찜') return !p.group || !roomGroups.some((g) => g.name === p.group);
    return p.group === selectedGroup;
  };

  let activeColorId = 'pastel-pink';
  if (selectedGroup === '기본 찜') {
    activeColorId = currentRoom?.defaultHeartColorId || 'pastel-pink';
  } else if (selectedGroup !== '전체') {
    const matched = roomGroups.find((g) => g.name === selectedGroup);
    if (matched) activeColorId = matched.colorId;
  }
  const activeColorConfig = HEART_PALETTE.find((c) => c.id === activeColorId) || HEART_PALETTE[0];

  return (
    <div className="flex flex-col gap-4 text-[#2D241E]">
      
      {/* 1. 상단 룸 관리 바 */}
      <div className="bg-[#3B2F27] text-white p-4 rounded-[26px] flex flex-col gap-3 shadow-[0_8px_24px_rgba(59,47,39,0.12)] border-2 border-[#2D241E]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-title text-[10px] bg-[#524237] text-[#E8DCC4] px-2 py-0.5 rounded-md border border-[#695547] shrink-0">
              ROOM
            </span>
            <select
              value={activeCode}
              onChange={(e) => switchRoom(e.target.value)}
              className="font-title bg-[#4D3E34] text-[#F3D5B5] text-xs rounded-xl px-2.5 py-1.5 border border-[#614F43] outline-none truncate cursor-pointer hover:bg-[#59483D]"
            >
              {rooms.map((room) => (
                <option key={room.code} value={room.code}>{room.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowRoomModal(true)}
            className="font-title text-xs px-3 py-1.5 bg-[#524237] hover:bg-[#614F43] text-[#F3D5B5] rounded-xl border border-[#695547] transition active:scale-95"
          >
            + 새 방
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#4D3E34] text-xs">
          <button
            onClick={() => setShowInviteCode(!showInviteCode)}
            className="font-title text-xs text-[#C8B8A6] hover:text-[#F3D5B5] flex items-center gap-1 transition"
          >
            <span>🔑</span>
            <span>{showInviteCode ? '초대 코드 숨기기' : '초대 코드 보기'}</span>
          </button>

          {showInviteCode && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <span className="font-title font-mono text-[#F3D5B5] tracking-wider bg-[#2D241E] px-2 py-0.5 rounded-md text-xs">
                {activeCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}#${activeCode}`);
                  setCopyFeedback(true);
                  setTimeout(() => setCopyFeedback(false), 2000);
                }}
                className="font-title text-xs text-[#E8DCC4] hover:text-white"
              >
                {copyFeedback ? '링크 복사됨! ✨' : '링크 복사'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 장소 검색창 & 하트색 설정 바 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-title text-xs text-[#7A6251]">장소 추가 및 검색</span>
          
          {selectedGroup !== '전체' && (
            <div ref={colorPickerContainerRef} className="relative">
              <button
                onClick={() => setActiveColorPicker(!activeColorPicker)}
                title="현재 대상 하트 색상 변경"
                className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] border border-[#EADFCF] rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-95"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 shadow-xs"
                  style={{ backgroundColor: activeColorConfig.fill }}
                />
                <span className="font-title text-[11px] text-[#7A6251]">하트색 ⚙️</span>
              </button>

              {activeColorPicker && (
                <div className="absolute right-0 top-8 z-50 p-3 bg-white text-[#2D241E] rounded-2xl border-2 border-[#EADFCF] shadow-xl flex flex-col gap-2 w-44 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center pb-1 border-b border-[#F2EAE0]">
                    <span className="font-title text-[10px] text-[#7A6251]">
                      {selectedGroup === '기본 찜' ? '기본 찜 하트색' : `'${selectedGroup}' 하트색`}
                    </span>
                    <button
                      onClick={() => setActiveColorPicker(false)}
                      className="text-[10px] text-[#A89889] hover:text-[#2D241E]"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 pt-0.5">
                    {HEART_PALETTE.map((palette) => (
                      <button
                        key={palette.id}
                        onClick={() => handleUpdateActiveColor(palette.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-left text-xs transition flex items-center justify-between ${
                          activeColorId === palette.id
                            ? 'bg-[#FAF7F2] font-bold text-[#2D241E] border border-[#EADFCF]'
                            : 'hover:bg-[#F9ECE7] text-[#7A6251]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border"
                            style={{ backgroundColor: palette.fill, borderColor: palette.stroke }}
                          />
                          <span className="text-[11px] font-title">{palette.name}</span>
                        </div>
                        {activeColorId === palette.id && (
                          <span className="text-[10px] text-[#C25E3E]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder={selectedGroup === '전체' ? '모아보기 중에는 조회만 가능합니다 (폴더를 선택해주세요)' : '장소 검색 후 내 코스에 추가 (예: 대림창고)'}
            value={searchQuery}
            disabled={selectedGroup === '전체'}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`font-body flex-1 px-4 py-3 text-xs rounded-2xl border-2 text-[#2D241E] shadow-xs focus:outline-none ${
              selectedGroup === '전체'
                ? 'bg-[#F2ECE4] border-[#EADFCF] text-[#A89889] cursor-not-allowed placeholder:text-[#8C7A6B]'
                : 'bg-white border-[#EADFCF] focus:border-[#C25E3E]'
            }`}
          />
          <button
            type="submit"
            disabled={isSearching || selectedGroup === '전체'}
            className={`font-title px-5 py-3 text-xs rounded-2xl transition shadow-xs shrink-0 active:scale-95 ${
              selectedGroup === '전체'
                ? 'bg-[#D5C2AD] text-[#FAF7F2] cursor-not-allowed'
                : 'bg-[#2D241E] hover:bg-[#43362E] text-white'
            }`}
          >
            {isSearching ? '검색중' : '검색'}
          </button>
        </form>

        {/* 검색 결과 목록 */}
        {searchResults.length > 0 && selectedGroup !== '전체' && (
          <div className="p-3 bg-white rounded-[24px] border-2 border-[#EADFCF] shadow-xl flex flex-col gap-2 z-20">
            <div className="flex justify-between items-center px-1">
              <span className="font-title text-xs text-[#7A6251]">검색 결과 (장소 추가)</span>
              <button onClick={() => setSearchResults([])} className="font-title text-xs text-[#A89889] hover:text-[#2D241E]">
                닫기 ✕
              </button>
            </div>
            {searchResults.map((res, sIdx) => (
              <div key={`search-${res.id}-${sIdx}`} className="p-3 bg-[#FAF7F2] hover:bg-[#F6EFE6] rounded-xl flex items-center justify-between border border-[#EADFCF]">
                <div className="text-left overflow-hidden pr-2">
                  <p className="font-title text-xs text-[#2D241E] truncate">{res.place_name}</p>
                  <p className="font-body text-[11px] text-[#8C7A6B] truncate">{res.road_address_name || res.address_name}</p>
                </div>
                <button
                  onClick={() => addPlaceFromSearch(res)}
                  className="font-title px-3 py-1.5 text-xs bg-[#2D241E] text-white rounded-xl hover:bg-[#43362E] transition active:scale-95 shrink-0"
                >
                  + 찜하기
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 3. 찜 그룹 탭 바 */}
        <div className="flex gap-2 items-center overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            onClick={() => setSelectedGroup('전체')}
            className={`font-title px-3.5 py-1.5 rounded-xl text-xs transition whitespace-nowrap active:scale-95 ${
              selectedGroup === '전체'
                ? 'bg-[#2D241E] text-[#F3D5B5] shadow-xs'
                : 'bg-white text-[#7A6251] border-2 border-[#EADFCF] hover:bg-[#FAF7F2]'
            }`}
          >
            모아보기
          </button>

          <button
            onClick={() => setSelectedGroup('기본 찜')}
            className={`font-title px-3.5 py-1.5 rounded-xl text-xs transition whitespace-nowrap active:scale-95 ${
              selectedGroup === '기본 찜'
                ? 'bg-[#2D241E] text-[#F3D5B5] shadow-xs'
                : 'bg-white text-[#7A6251] border-2 border-[#EADFCF] hover:bg-[#FAF7F2]'
            }`}
          >
            🤍 기본 찜
          </button>

          {roomGroups.map((grp) => {
            const isActive = selectedGroup === grp.name;
            return (
              <div
                key={grp.name}
                className={`flex items-center shrink-0 rounded-xl border-2 transition-all overflow-hidden ${
                  isActive ? 'bg-[#2D241E] border-[#2D241E] shadow-xs' : 'bg-white border-[#EADFCF] hover:border-[#D5C2AD]'
                }`}
              >
                <button
                  onClick={() => setSelectedGroup(grp.name)}
                  className={`font-title px-3.5 py-1.5 text-xs transition whitespace-nowrap active:scale-95 ${
                    isActive ? 'text-[#F3D5B5]' : 'text-[#7A6251]'
                  }`}
                >
                  📁 {grp.name}
                </button>
                <button
                  onClick={() => setGroupToDelete(grp.name)}
                  title="그룹 삭제"
                  className={`font-title px-2.5 py-1.5 text-[10px] transition border-l ${
                    isActive
                      ? 'bg-[#43362E] text-[#C8B8A6] border-[#59483D] hover:text-white'
                      : 'bg-[#FAF7F2] text-[#A89889] border-[#EADFCF] hover:text-[#C25E3E]'
                  }`}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* + 새 그룹 추가 버튼 */}
          <button
            onClick={() => setShowAddGroupModal(true)}
            className="font-title px-3 py-1.5 rounded-xl text-xs bg-[#FAF7F2] text-[#A89889] border border-dashed border-[#D5C2AD] hover:bg-[#F3ECE0] transition whitespace-nowrap shrink-0 active:scale-95"
          >
            + 새 그룹
          </button>
        </div>
      </div>

      {/* 4. 지도 뷰 */}
      <div className="relative w-full h-[390px] rounded-[30px] overflow-hidden shadow-[0_8px_24px_rgba(74,59,50,0.06)] border-2 border-[#EADFCF] bg-[#FAF7F2]">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#FAF7F2]/90 z-20">
            <div className="w-8 h-8 border-3 border-[#C25E3E] border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-xs text-[#8C7A6B]">지도를 불러오고 있습니다</p>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FAF7F2] z-20">
            <p className="font-title text-red-500 mb-1">지도를 띄울 수 없습니다</p>
            <p className="font-body text-xs text-[#8C7A6B]">{errorMessage}</p>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* 상단 좌측 범례 */}
        <div className="font-title absolute top-3.5 left-3.5 z-10 bg-[#2D241E]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-[11px] text-[#F3D5B5] border border-[#43362E] pointer-events-none flex items-center gap-2">
          <span>{selectedGroup === '전체' ? '📁 전체 보기' : selectedGroup === '기본 찜' ? '🤍 기본 찜' : `📁 ${selectedGroup}`}</span>
          {selectedGroup !== '전체' && (
            <>
              <span className="text-[#614F43]">|</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FAF7F2] border border-[#D5C2AD] inline-block" /> 찜
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block border"
                  style={{ backgroundColor: activeColorConfig.fill, borderColor: activeColorConfig.stroke }}
                />
                다녀옴
              </span>
            </>
          )}
        </div>
      </div>

      {/* 5. 장소 리스트 */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-title text-sm text-[#2D241E]">
            {currentRoom?.title}
            <span className="text-xs font-normal text-[#8C7A6B] ml-1">
              ({currentRoom?.places.filter(filterPlaces).length}곳)
            </span>
          </h2>
          <span className="font-body text-xs text-[#A89889]">하트를 누르면 방문 여부가 바뀝니다</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
          {currentRoom?.places.filter(filterPlaces).length === 0 ? (
            <div className="font-body p-8 text-center bg-white rounded-2xl border-2 border-dashed border-[#EADFCF] text-xs text-[#8C7A6B]">
              해당 그룹에 등록된 장소가 없습니다.
            </div>
          ) : (
            (() => {
              const renderCounts: Record<string, number> = {};
              return currentRoom?.places
                .filter(filterPlaces)
                .map((place) => {
                  const currentIdx = renderCounts[place.id] || 0;
                  renderCounts[place.id] = currentIdx + 1;

                  const isSelected = selectedPlaceId === place.id;
                  const style = getHeartStyleForPlace(place);

                  return (
                    <div
                      key={`place-${place.id}-${currentIdx}`}
                      onClick={() => handleSelectOrUnselectPlace(place)}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#2D241E] text-white border-[#2D241E] shadow-md scale-[1.01]'
                          : 'bg-white text-[#2D241E] border-[#EADFCF] hover:border-[#D5C2AD]'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="overflow-hidden pl-1">
                          <div className="flex items-center gap-2">
                            <p className="font-title text-sm tracking-tight truncate">{place.name}</p>
                            {place.group && (
                              <span className={`font-title text-[10px] px-2 py-0.5 rounded-lg border ${
                                isSelected ? 'bg-[#43362E] text-[#F3D5B5] border-[#59483D]' : 'bg-[#FAF7F2] text-[#7A6251] border-[#EADFCF]'
                              }`}>
                                {place.group}
                              </span>
                            )}
                          </div>
                          {place.address && <p className={`font-body text-xs mt-0.5 truncate max-w-[210px] ${isSelected ? 'text-[#C8B8A6]' : 'text-[#8C7A6B]'}`}>{place.address}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleVisited(place.id, currentIdx)}
                          title={place.isVisited ? '다녀옴 (클릭시 찜으로 전환)' : '가고싶음 (클릭시 다녀옴으로 전환)'}
                          className="p-1 rounded-xl hover:bg-black/5 active:scale-90 transition-transform flex items-center justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill={style.fill}
                            stroke={style.stroke}
                            strokeWidth={style.strokeWidth}
                            className="drop-shadow-xs transition-all"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => removePlaceItem(place.id, currentIdx)}
                          className={`font-title text-xs px-2 py-1 rounded transition ${
                            isSelected ? 'text-[#8C7A6B] hover:text-white' : 'text-[#A89889] hover:text-[#C25E3E]'
                          }`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                });
            })()
          )}
        </div>
      </div>

      {/* 6. 예쁜 커스텀 알림 모달 */}
      {alertModalMessage && (
        <div className="fixed inset-0 z-50 bg-[#2D241E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2D241E] w-full max-w-xs rounded-[28px] p-6 shadow-2xl border-2 border-[#EADFCF] flex flex-col gap-4 text-center">
            <span className="text-3xl mt-1">💡</span>
            <div>
              <p className="font-title text-sm text-[#2D241E] leading-relaxed">
                {alertModalMessage}
              </p>
            </div>
            <button
              onClick={() => setAlertModalMessage(null)}
              className="font-title w-full py-2.5 bg-[#2D241E] hover:bg-[#43362E] text-white text-xs rounded-xl transition active:scale-95 shadow-xs"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 7. 그룹 삭제 모달 */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 bg-[#2D241E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2D241E] w-full max-w-xs rounded-[28px] p-6 shadow-2xl border-2 border-[#EADFCF] flex flex-col gap-4 text-center">
            <span className="text-3xl mt-1">🗑️</span>
            <div>
              <h3 className="font-title text-base text-[#2D241E]">'{groupToDelete}' 그룹 삭제</h3>
              <p className="font-body text-xs text-[#8C7A6B] mt-1.5 leading-relaxed">
                그룹과 포함된 모든 장소들이 함께 삭제됩니다.<br />
                정말 삭제하시겠습니까?
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setGroupToDelete(null)}
                className="font-title flex-1 py-2.5 bg-white border-2 border-[#EADFCF] hover:bg-[#FAF7F2] text-[#7A6251] text-xs rounded-xl transition active:scale-95"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteGroup}
                className="font-title flex-1 py-2.5 bg-[#C25E3E] hover:bg-[#B04E30] text-white text-xs rounded-xl transition active:scale-95 shadow-xs"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 새 찜 그룹 생성 모달 */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 bg-[#2D241E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2D241E] w-full max-w-xs rounded-[28px] p-6 shadow-2xl border-2 border-[#EADFCF] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#EADFCF]">
              <h3 className="font-title text-base">새 찜 그룹 만들기</h3>
              <button onClick={() => setShowAddGroupModal(false)} className="font-title text-[#A89889] hover:text-[#2D241E] text-sm">✕</button>
            </div>
            <form onSubmit={handleAddGroup} className="flex flex-col gap-3">
              <div>
                <label className="font-title text-xs text-[#7A6251]">그룹 이름</label>
                <input
                  type="text"
                  placeholder="예: 서울, 9월 10일 약속, 홍대"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  autoFocus
                  className="font-body w-full mt-1.5 px-3.5 py-2.5 text-xs bg-white border-2 border-[#EADFCF] rounded-xl focus:outline-none focus:border-[#C25E3E]"
                />
              </div>

              <div>
                <label className="font-title text-xs text-[#7A6251]">그룹 하트 색상</label>
                <div className="flex gap-2 items-center mt-2">
                  {HEART_PALETTE.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setNewGroupColorId(pal.id)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newGroupColorId === pal.id ? 'scale-120 shadow-md ring-2 ring-[#2D241E]' : 'hover:scale-110 opacity-70'
                      }`}
                      style={{ backgroundColor: pal.fill, borderColor: pal.stroke }}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="font-title w-full py-3 bg-[#2D241E] hover:bg-[#43362E] text-white text-xs rounded-xl transition mt-2">
                그룹 추가하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. 방 관리 모달 */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-[#2D241E]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] text-[#2D241E] w-full max-w-sm rounded-[30px] p-6 shadow-2xl border-2 border-[#EADFCF] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EADFCF]">
              <h3 className="font-title text-base">약속 방 관리</h3>
              <button onClick={() => setShowRoomModal(false)} className="font-title text-[#A89889] hover:text-[#2D241E] text-sm">✕</button>
            </div>
            <div className="font-title flex rounded-xl bg-[#EFE9DF] p-1 text-xs">
              <button onClick={() => setModalMode('create')} className={`flex-1 py-1.5 rounded-lg transition ${modalMode === 'create' ? 'bg-[#2D241E] text-[#F3D5B5] shadow-xs' : 'text-[#7A6251]'}`}>새 방 만들기</button>
              <button onClick={() => setModalMode('join')} className={`flex-1 py-1.5 rounded-lg transition ${modalMode === 'join' ? 'bg-[#2D241E] text-[#F3D5B5] shadow-xs' : 'text-[#7A6251]'}`}>코드로 참여</button>
            </div>
            {modalMode === 'create' ? (
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
                <div>
                  <label className="font-title text-xs text-[#7A6251]">약속 방 이름</label>
                  <input type="text" placeholder="예: 성수 모임, 맛집 탐방" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} required className="font-body w-full mt-1 px-3.5 py-2.5 text-xs bg-white border-2 border-[#EADFCF] rounded-xl focus:outline-none focus:border-[#C25E3E]" />
                </div>
                <button type="submit" className="font-title w-full py-3 bg-[#2D241E] hover:bg-[#43362E] text-white text-xs rounded-xl transition mt-1">방 생성하기</button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
                <div>
                  <label className="font-title text-xs text-[#7A6251]">6자리 초대 코드</label>
                  <input type="text" maxLength={6} placeholder="예: A8F2K9" value={joinRoomCode} onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())} required className="font-title w-full mt-1 px-3.5 py-2.5 text-xs bg-white border-2 border-[#EADFCF] rounded-xl uppercase tracking-widest text-center focus:outline-none focus:border-[#C25E3E]" />
                </div>
                <div>
                  <label className="font-title text-xs text-[#7A6251]">내가 부를 방 이름 (선택)</label>
                  <input type="text" placeholder="예: 친구들과의 약속" value={newRoomTitle} onChange={(e) => setNewRoomTitle(e.target.value)} className="font-body w-full mt-1 px-3.5 py-2.5 text-xs bg-white border-2 border-[#EADFCF] rounded-xl focus:outline-none focus:border-[#C25E3E]" />
                </div>
                <button type="submit" className="font-title w-full py-3 bg-[#2D241E] hover:bg-[#43362E] text-white text-xs rounded-xl transition mt-1">방 들어가기</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}