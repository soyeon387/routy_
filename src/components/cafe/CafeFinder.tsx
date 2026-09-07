'use client';

import { useState, useEffect } from 'react';

const DESSERT_TAGS = [
  { label: '전체 카페', keyword: '' },
  { label: '🥐 소금빵', keyword: '소금빵' },
  { label: '🥞 수플레', keyword: '수플레' },
  { label: '🍞 프렌치토스트', keyword: '프렌치토스트' },
  { label: '🥯 베이글', keyword: '베이글' },
  { label: '🍰 케이크', keyword: '케이크' },
  { label: '🍪 구움과자·휘낭시에', keyword: '휘낭시에' },
  { label: '🥐 크루아상', keyword: '크루아상' },
  { label: '🍮 푸딩', keyword: '푸딩' },
] as const;

export default function CafeFinder() {
  const [baseInput, setBaseInput] = useState('성수역');
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationCandidates, setLocationCandidates] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const [selectedTag, setSelectedTag] = useState<string>('전체 카페');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [cafes, setCafes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchSummary, setSearchSummary] = useState('');
  const [sdkReady, setSdkReady] = useState(false);

  // 1. 카카오 SDK 로드
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
    if (!apiKey) return;

    const readyCheck = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          setSdkReady(true);
        });
      }
    };

    if (window.kakao?.maps) {
      readyCheck();
      return;
    }

    const scriptId = 'kakao-map-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services,clusterer`;
      script.async = true;
      document.head.appendChild(script);
    }

    script.onload = () => readyCheck();
  }, []);

  // 2. 최초 기본 위치 탐색
  useEffect(() => {
    if (sdkReady && !currentCoords) {
      fetchLocationCandidates('성수역', true);
    }
  }, [sdkReady]);

  const fetchLocationCandidates = (keyword: string, autoSelectFirst = false) => {
    if (!window.kakao?.maps?.services) return;
    setIsSearchingLocation(true);

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data: any, status: any) => {
      setIsSearchingLocation(false);
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        if (autoSelectFirst) {
          selectCandidate(data[0]);
        } else {
          setLocationCandidates(data.slice(0, 5));
        }
      } else {
        alert('해당 위치를 찾을 수 없습니다.');
        setLocationCandidates([]);
      }
    });
  };

  const selectCandidate = (item: any) => {
    const coords = {
      lat: parseFloat(item.y),
      lng: parseFloat(item.x),
    };
    setBaseInput(item.place_name);
    setCurrentCoords(coords);
    setSearchSummary(item.place_name);
    setLocationCandidates([]);
    searchCafesByKeyword(coords, selectedKeyword);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('위치 정보(GPS)를 지원하지 않는 브라우저입니다.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setBaseInput('📍 내 현재 위치');
        setCurrentCoords(coords);
        setSearchSummary('내 현재 위치');
        setLocationCandidates([]);
        searchCafesByKeyword(coords, selectedKeyword);
      },
      () => {
        setIsLoading(false);
        alert('위치 권한을 허용해 주세요.');
      },
      { timeout: 10000 }
    );
  };

  // 반경 1km 거리순 카페 탐색
  const searchCafesByKeyword = (coords: { lat: number; lng: number }, dessertKeyword: string) => {
    if (!window.kakao?.maps?.services) return;

    setIsLoading(true);
    const ps = new window.kakao.maps.services.Places();
    const locationLatLng = new window.kakao.maps.LatLng(coords.lat, coords.lng);

    if (!dessertKeyword) {
      ps.categorySearch(
        'CE7',
        (data: any, status: any) => {
          setIsLoading(false);
          if (status === window.kakao.maps.services.Status.OK) {
            setCafes(data);
          } else {
            setCafes([]);
          }
        },
        {
          location: locationLatLng,
          radius: 1000,
          sort: window.kakao.maps.services.SortBy.DISTANCE,
        }
      );
    } else {
      ps.keywordSearch(
        dessertKeyword,
        (data: any, status: any) => {
          setIsLoading(false);
          if (status === window.kakao.maps.services.Status.OK) {
            const cafeOnly = data.filter((item: any) =>
              item.category_group_code === 'CE7' ||
              item.category_name?.includes('카페') ||
              item.category_name?.includes('제과') ||
              item.category_name?.includes('베이커리')
            );
            setCafes(cafeOnly.length > 0 ? cafeOnly : data);
          } else {
            setCafes([]);
          }
        },
        {
          location: locationLatLng,
          radius: 1000,
          sort: window.kakao.maps.services.SortBy.DISTANCE,
        }
      );
    }
  };

  const handleTagChange = (tagLabel: string, keyword: string) => {
    setSelectedTag(tagLabel);
    setSelectedKeyword(keyword);
    if (!currentCoords) {
      fetchLocationCandidates(baseInput, true);
      return;
    }
    searchCafesByKeyword(currentCoords, keyword);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. 기준 위치 입력 & GPS */}
      <div className="flex flex-col gap-2 relative">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleCurrentLocation}
            title="내 현재 위치 불러오기"
            className="px-3 py-2.5 bg-white border border-slate-300 hover:border-slate-800 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 shadow-sm"
          >
            <span>📍 현위치</span>
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchLocationCandidates(baseInput);
            }}
            className="flex-1 flex gap-1.5"
          >
            <input
              type="text"
              placeholder="동네, 지하철역, 장소 검색 (예: 연남동, 강남역)"
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800 shadow-sm"
            />
            <button
              type="submit"
              disabled={isSearchingLocation || !sdkReady}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition shadow-sm shrink-0"
            >
              {isSearchingLocation ? '검색중' : '검색'}
            </button>
          </form>
        </div>

        {/* 연관 장소 후보 드롭다운 */}
        {locationCandidates.length > 0 && (
          <div className="absolute top-12 left-0 right-0 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 px-2 py-1">
              정확한 기준 위치를 선택해 주세요
            </span>
            {locationCandidates.map((item) => (
              <div
                key={item.id}
                onClick={() => selectCandidate(item)}
                className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition flex items-center justify-between"
              >
                <div className="overflow-hidden pr-2 text-left">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.place_name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {item.road_address_name || item.address_name}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400 shrink-0">선택 →</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 디저트별 태그 필터 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-slate-500 px-1">디저트별 근처 카페 탐색</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {DESSERT_TAGS.map((tag) => (
            <button
              key={tag.label}
              onClick={() => handleTagChange(tag.label, tag.keyword)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition shadow-sm ${
                selectedTag === tag.label
                  ? 'bg-amber-600 text-white shadow-amber-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 검색 결과 리스트 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-800">
              {searchSummary ? `${searchSummary} 근처` : '근처 카페'} ({cafes.length}곳)
            </h2>
            <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold">
              가까운 순
            </span>
          </div>
          <span className="text-xs text-slate-400">{selectedTag}</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                {selectedTag} 매장 찾는 중...
              </p>
            </div>
          ) : cafes.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 flex flex-col gap-1">
              <p className="font-semibold text-slate-600">근처에 해당 디저트 매장이 없습니다.</p>
              <p>기준 위치를 바꾸거나 다른 디저트를 선택해 보세요.</p>
            </div>
          ) : (
            cafes.map((cafe) => (
              <div
                key={cafe.id}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs hover:border-slate-300 transition"
              >
                <div className="overflow-hidden pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {cafe.place_name}
                    </span>
                    {cafe.distance && (
                      <span className="text-xs text-amber-600 font-bold shrink-0">
                        {cafe.distance}m
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {cafe.road_address_name || cafe.address_name}
                  </p>
                  {cafe.phone && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{cafe.phone}</p>
                  )}
                </div>

                {/* 상세보기 버튼: 카카오맵 상세 정보 페이지 새 탭 오픈 */}
                <a
                  href={cafe.place_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 transition bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1"
                >
                  <span>상세보기</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}