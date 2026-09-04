'use client';

import { useEffect, useRef, useState } from 'react';

export interface Place {
  id: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  isVisited: boolean;
}

const INITIAL_PLACES: Place[] = [
  { id: 1, name: '성수 감성 파스타', category: '식당', lat: 37.54458, lng: 127.05603, isVisited: false },
  { id: 2, name: '성수 소금빵 베이커리', category: '카페', lat: 37.54612, lng: 127.05834, isVisited: true },
  { id: 3, name: '서울숲 산책로 & 사슴방사장', category: '활동', lat: 37.54308, lng: 127.04179, isVisited: false },
];

export default function DateMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [places, setPlaces] = useState<Place[]>(INITIAL_PLACES);
  const overlaysRef = useRef<any[]>([]);

  // 1. 지도 초기화
  useEffect(() => {
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps || !mapRef.current) return;

      window.kakao.maps.load(() => {
        if (!mapRef.current) return;
        const options = {
          center: new window.kakao.maps.LatLng(37.54458, 127.05603), // 성수역
          level: 4,
        };
        const map = new window.kakao.maps.Map(mapRef.current, options);
        mapInstanceRef.current = map;
        renderMarkers(map, places);
      });
    };

    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      const timer = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(timer);
          initMap();
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, []);

  // 2. 마커 렌더링 함수
  const renderMarkers = (map: any, placeList: Place[]) => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    placeList.forEach((place) => {
      const position = new window.kakao.maps.LatLng(place.lat, place.lng);
      const markerEl = document.createElement('div');
      markerEl.className = 'flex flex-col items-center cursor-pointer select-none';

      const heartSvg = place.isVisited
        ? `<svg class="w-9 h-9 text-rose-500 fill-current drop-shadow-md transition-transform transform hover:scale-110 active:scale-95" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        : `<svg class="w-9 h-9 text-white fill-none stroke-rose-500 stroke-2 drop-shadow-md transition-transform transform hover:scale-110 active:scale-95" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;

      markerEl.innerHTML = `
        ${heartSvg}
        <div class="px-2.5 py-1 mt-1 text-xs font-semibold bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-md text-gray-800 whitespace-nowrap">
          ${place.name}
        </div>
      `;

      markerEl.addEventListener('click', () => {
        setPlaces((prev) => {
          const updated = prev.map((p) => (p.id === place.id ? { ...p, isVisited: !p.isVisited } : p));
          if (mapInstanceRef.current) renderMarkers(mapInstanceRef.current, updated);
          return updated;
        });
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content: markerEl,
        yAnchor: 1.15,
      });

      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  };

  return (
    <div className="relative w-full h-[550px] rounded-3xl overflow-hidden shadow-md border border-gray-100 bg-gray-50">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '550px' }} />

      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-xs font-medium text-gray-700 border border-gray-200 flex items-center gap-1.5 pointer-events-none">
        <span>🤍 가고 싶은 곳</span>
        <span className="text-gray-300">|</span>
        <span>❤️ 다녀온 곳 (클릭)</span>
      </div>
    </div>
  );
}