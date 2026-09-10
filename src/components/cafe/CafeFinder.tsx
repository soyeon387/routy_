'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const DESSERT_TAGS = ['전체 (거리순)', '소금빵', '프렌치토스트', '수플레', '크로플', '베이글', '케이크'];

export default function CafeFinder() {
  const [selectedTag, setSelectedTag] = useState<string>('전체 (거리순)');
  const [cafes, setCafes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sdkReady, setSdkReady] = useState<boolean>(false);

  // 기준 위치 상태
  const [currentLocationName, setCurrentLocationName] = useState<string>('');
  const [customLocationInput, setCustomLocationInput] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 위치 자동완성 후보 상태
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  // 1. 카카오 지도 SDK 로더
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
    if (!apiKey) return;

    const checkSdk = () => {
      if (window.kakao?.maps?.services) {
        setSdkReady(true);
        return true;
      }
      return false;
    };

    if (checkSdk()) return;

    const existingScript = document.getElementById('kakao-map-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'kakao-map-script';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
      script.async = true;
      document.head.appendChild(script);
      script.onload = () => {
        window.kakao.maps.load(() => {
          setSdkReady(true);
        });
      };
    } else {
      const interval = setInterval(() => {
        if (checkSdk()) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // 외부 클릭 시 후보창 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionContainerRef.current &&
        !suggestionContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. 카페 검색 함수
  const searchCafes = useCallback((targetCoords: { lat: number; lng: number }, tag: string) => {
    if (!window.kakao?.maps?.services) return;
    setIsLoading(true);

    const ps = new window.kakao.maps.services.Places();
    const isAll = tag === '전체 (거리순)';

    const searchCallback = (data: any, status: any) => {
      setIsLoading(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setCafes(data || []);
      } else {
        setCafes([]);
      }
    };

    const searchOptions = {
      location: new window.kakao.maps.LatLng(targetCoords.lat, targetCoords.lng),
      radius: 1000, // 반경 1km
      sort: window.kakao.maps.services.SortBy.DISTANCE,
    };

    if (isAll) {
      ps.categorySearch('CE7', searchCallback, searchOptions);
    } else {
      ps.keywordSearch(`${tag} 카페`, searchCallback, searchOptions);
    }
  }, []);

  // 3. 좌표나 태그 변경 시 검색
  useEffect(() => {
    if (sdkReady && coords) {
      searchCafes(coords, selectedTag);
    }
  }, [sdkReady, coords, selectedTag, searchCafes]);

  // 4. 입력 시 실시간 위치 후보 검색 (디바운스 250ms)
  useEffect(() => {
    if (!sdkReady || !customLocationInput.trim() || !window.kakao?.maps?.services) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(customLocationInput.trim(), (data: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK && data) {
          setLocationSuggestions(data.slice(0, 5));
          setShowSuggestions(true);
        } else {
          setLocationSuggestions([]);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [customLocationInput, sdkReady]);

  // 5. 후보 중 하나를 클릭해 위치 선택했을 때
  const handleSelectSuggestion = (place: any) => {
    const newCoords = {
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
    };
    setCoords(newCoords);
    setCurrentLocationName(place.place_name);
    setCustomLocationInput('');
    setShowSuggestions(false);
    searchCafes(newCoords, selectedTag);
  };

  // 6. 엔터/버튼으로 직접 검색 시 첫 번째 후보 자동 적용
  const handleCustomLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationSuggestions.length > 0) {
      handleSelectSuggestion(locationSuggestions[0]);
    } else if (customLocationInput.trim() && window.kakao?.maps?.services) {
      setIsLoading(true);
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(customLocationInput, (data: any, status: any) => {
        setIsLoading(false);
        if (status === window.kakao.maps.services.Status.OK && data[0]) {
          handleSelectSuggestion(data[0]);
        } else {
          alert('입력하신 위치를 찾을 수 없습니다.');
        }
      });
    }
  };

  // 7. 내 현재 위치 가져오기
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('브라우저에서 위치 정보를 지원하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(newCoords);
        setCurrentLocationName('내 현재 위치');
        searchCafes(newCoords, selectedTag);
      },
      () => {
        setIsLoading(false);
        alert('위치 권한이 거부되었거나 신호를 찾을 수 없습니다. 아래 검색창을 이용해 주세요!');
      },
      { timeout: 7000 }
    );
  };

  return (
    <div className="flex flex-col gap-4 text-[#2D241E]">
      
      {/* 1. 기준 위치 컨트롤 바 및 후보 드롭다운 */}
      <div 
        ref={suggestionContainerRef}
        className="relative bg-white p-4 rounded-[26px] border-2 border-[#EADFCF] shadow-[0_4px_16px_rgba(74,59,50,0.03)] flex flex-col gap-3 z-30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-title text-[10px] text-[#A86F3D] bg-[#FBF5ED] px-2 py-0.5 rounded-md border border-[#EFE4D6]">
              기준 위치
            </span>
            <span className="font-title text-xs text-[#2D241E] truncate max-w-[170px]">
              {currentLocationName ? `📍 ${currentLocationName}` : '위치를 설정해주세요'}
            </span>
          </div>
          <button
            onClick={handleFetchCurrentLocation}
            className="font-title text-xs px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#F3ECE0] border border-[#EADFCF] rounded-xl text-[#7A6251] transition active:scale-95 shrink-0 flex items-center gap-1"
          >
            <span>🎯</span> 내 위치
          </button>
        </div>

        {/* 위치 검색 인풋 */}
        <form onSubmit={handleCustomLocationSubmit} className="relative flex gap-2">
          <input
            type="text"
            placeholder="동네나 지하철역 검색 (예: 성수역, 연남동)"
            value={customLocationInput}
            onFocus={() => {
              if (locationSuggestions.length > 0) setShowSuggestions(true);
            }}
            onChange={(e) => setCustomLocationInput(e.target.value)}
            className="font-body flex-1 px-3.5 py-2.5 text-xs bg-[#FAF7F2] rounded-xl border border-[#EADFCF] text-[#2D241E] focus:outline-none focus:border-[#A86F3D]"
          />
          <button
            type="submit"
            className="font-title px-4 py-2.5 bg-[#2D241E] hover:bg-[#43362E] text-white text-xs rounded-xl transition shrink-0 active:scale-95"
          >
            선택
          </button>

          {/* 실시간 위치 후보 드롭다운 */}
          {showSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute top-12 left-0 right-16 bg-white border-2 border-[#EADFCF] rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col divide-y divide-[#F2EAE0]">
              {locationSuggestions.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(place)}
                  className="px-3.5 py-2.5 text-left hover:bg-[#FAF7F2] transition flex flex-col gap-0.5 active:bg-[#F6EFE6]"
                >
                  <span className="font-title text-xs text-[#2D241E] truncate">
                    📍 {place.place_name}
                  </span>
                  <span className="font-body text-[10px] text-[#8C7A6B] truncate">
                    {place.road_address_name || place.address_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* 2. 카테고리 칩 */}
      <div className="flex gap-2 items-center overflow-x-auto pb-1 no-scrollbar">
        {DESSERT_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`font-title px-4 py-2 rounded-2xl text-xs transition whitespace-nowrap active:scale-95 ${
              selectedTag === tag
                ? 'bg-[#2D241E] text-[#F3D5B5] shadow-xs'
                : 'bg-white text-[#7A6251] border-2 border-[#EADFCF] hover:bg-[#FAF7F2]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 3. 카페 리스트 및 상태 표시 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center px-1">
          <span className="font-title text-xs text-[#7A6251]">
            반경 1km 거리순 {coords ? `(${cafes.length}곳)` : ''}
          </span>
          <span className="font-body text-xs text-[#A89889]">
            선택: {selectedTag}
          </span>
        </div>

        {/* 위치 미설정 상태 */}
        {!coords && !isLoading && (
          <div className="font-body p-12 text-center bg-white rounded-3xl border-2 border-dashed border-[#EADFCF] text-xs text-[#8C7A6B] flex flex-col items-center gap-2">
            <span className="text-3xl">📍</span>
            <p className="font-title text-sm text-[#2D241E] mt-1">기준 위치가 설정되지 않았습니다</p>
            <p className="leading-relaxed">
              상단의 <b>[내 위치]</b> 버튼을 누르거나<br />
              원하는 동네를 입력해 후보를 선택해 보세요!
            </p>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#A86F3D] border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-xs text-[#8C7A6B]">반경 1km 이내 카페를 찾고 있습니다...</p>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {coords && !isLoading && cafes.length === 0 && (
          <div className="font-body p-8 text-center bg-white rounded-2xl border-2 border-dashed border-[#EADFCF] text-xs text-[#8C7A6B]">
            반경 1km 이내에 해당하는 카페가 없습니다.<br />
            다른 디저트를 누르거나 기준 위치를 변경해 보세요!
          </div>
        )}

        {/* 카페 리스트 카드 */}
        {coords && !isLoading && cafes.length > 0 && (
          cafes.map((cafe) => (
            <div
              key={cafe.id}
              className="p-4 bg-white rounded-[24px] border-2 border-[#EADFCF] shadow-[0_4px_16px_rgba(74,59,50,0.03)] hover:border-[#D5C2AD] transition-all flex items-center justify-between"
            >
              <div className="text-left overflow-hidden pr-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-title text-sm text-[#2D241E] truncate">{cafe.place_name}</h3>
                  {cafe.distance && (
                    <span className="font-title text-[10px] text-[#A86F3D] bg-[#FBF5ED] px-2 py-0.5 rounded-md border border-[#EFE4D6] shrink-0">
                      {cafe.distance}m
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-[#8C7A6B] mt-0.5 truncate">
                  {cafe.road_address_name || cafe.address_name}
                </p>
                {cafe.phone && (
                  <p className="font-body text-[11px] text-[#A89889] mt-0.5">📞 {cafe.phone}</p>
                )}
              </div>

              <a
                href={cafe.place_url || `https://place.map.kakao.com/${cafe.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-title text-xs px-3.5 py-2.5 bg-[#FAF7F2] text-[#2D241E] border-2 border-[#EADFCF] hover:border-[#A86F3D] hover:bg-white rounded-xl transition-all shrink-0 active:scale-95 flex items-center gap-1"
              >
                <span>상세보기</span>
                <span className="text-[10px] text-[#A86F3D]">↗</span>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}