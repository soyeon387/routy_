This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

1. 팀 프로젝트 활동 보고서 (개발 직무 맞춤)
📌 프로젝트 개요
프로젝트명: ROUTY (루티) - 감각 취향 기반 AI 데이트 코스 플래너 및 공유 지도 서비스

담당 역할: AI 코스 플래너 풀스택 구현 (Gemini API 프롬프트 엔지니어링 & 카카오 로컬 API 체이닝, 코스 생성/단일 장소 교체 로직 설계), PostgreSQL / Prisma ORM 데이터 모델링 및 동기화 API 구축, 지도/그룹 데이터 정합성 오류 디버깅

[1] 내가 맡은 역할
AI 코스 플래너 파이프라인 개발 (/api/course, /api/course/replace, CoursePage.tsx):

Google Gemini 2.5 Flash와 Kakao Local API(키워드/반경 카테고리 검색)를 연계한 2-Tier 장소 추천 및 현실적 타임라인(소요 시간, 식사/카페/놀거리 배치) 생성 파이프라인 구축

코스 전체 재생성 없이 마음에 들지 않는 장소만 인근 거리/취향 조건에 맞춰 실시간으로 교체하는 단일 장소 대체(Replace) API 설계

데이터베이스 설계 및 API 연동 (Prisma & Supabase PostgreSQL):

유저, 약속 방(Room), 장소(RoomPlace), 찜 그룹(PlaceGroup), 코스 보관함(SavedCourse) 간의 1:N / N:M 릴레이션 스키마 모델링 및 마이그레이션

복수 사용자가 실시간으로 장소 찜, 방문 여부 토글, 그룹 변경을 처리할 수 있는 /api/places/sync 및 코스 보관함 API 구현

오류 진단 및 기능 고도화:

POI(거리/골목 명칭) 오인식, 놀거리 단계에 카페/식당 혼입, 비동기 렌더링 시 지도 깜빡임 및 데이터 정합성 이슈 해결

[2] 진행하면서 어떤 문제가 있었는지
AI 환각(Hallucination) 및 장소 유효성 문제: LLM에만 코스 선정을 맡길 경우 폐업한 식당, 허구의 상호, 동선상 불가능한 거리(서울 강남에서 일산 이동 등)를 추천함.

카카오 로컬 API의 POI 검색 노이즈: '놀거리'나 '맛집' 검색 시 상호명이 아닌 '성수동카페거리', '공중화장실', '철물점', '부동산' 등의 엉뚱한 지점이나 비적합 시설이 코스 후보군으로 유입됨.

카테고리 누수(Category Leakage): '놀거리' 단계에 일반 카페나 음식점이 추천되거나, 1차 식사와 2차 식사에 중복된 음식점/메뉴가 선정되는 현상.

지도/그룹 데이터 구조의 이중 분기 혼선: 시스템 상에 '기본 찜(그룹 없음, null)'과 '기본 그룹(하드코딩된 더미 그룹)'이 동시에 존재하여 UI상 중복 혼선 및 데이터 무결성 훼손 발생.

[3] 어떻게 진단하고, 해결했는지
진단: API 로그 및 Gemini 입력 프롬프트를 역추적한 결과, LLM이 좌표 검색까지 수행하기 어렵고, 카카오 API 결과에서 상위 카테고리 코드(FD6, CE7, AT4, CT1) 검증이 누락되어 발생함을 확인.

해결:

검색-필터-LLM 체이닝 아키텍처 도입:

카카오 API로 반경 2~3km 내 실제 영업 중인 후보 POI를 먼저 수집

정규식 및 블랙리스트 함수(isStreetOrAreaName, isInvalidDatePlace, isFoodOrDrinkPlace)를 거쳐 노이즈 제거

정제된 실제 POI 풀(Pool)만을 Gemini 프롬프트에 responseSchema 기반 구조화된 JSON 형태로 주입하여 검증된 장소만 선택하도록 강제

체류 시간 및 시간대 알고리즘 보정:

이전 장소 종료 시간과 이동 거리(도보 속도 약 67m/분 기준)를 계산하고, 점심/저녁 시간대 규칙(오후 5시 이후 저녁 식사 배치)을 프롬프트와 Fallback 로직 양쪽에 반영

단일 장소 교체(Replace) 최적화:

인접 장소 좌표를 앵커(Anchor)로 삼아 거리순 정렬 후 3개 상위 후보군 중 랜덤 추출하여 즉시 반응성 확보

[4] 다른 해결방법은 없었는지
대안 1: 카카오 길찾기 API(Navi/Directions)를 전 구간 실시간 호출하는 방식

장점: 도보/차량 실제 경로를 완벽히 반영

기각 사유: 3~5개 장소 조합마다 API Quota 소모 및 코스 생성 지연(응답 속도 4~5초 초과) 발생 → Haversine 직선거리 기반 도보 추정치(meters / 67)로 최적화하여 응답 속도 대폭 개선

대안 2: Gemini Search Grounding 기능 단독 사용

장점: 외부 검색 API 체이닝 코드 간소화

기각 사유: JSON Schema 강제 출력과의 동시 호환성 문제 및 카카오 맵 핀 좌표(위경도) 정밀 매핑 불가로 인해 RAG 형태의 2-Tier 파이프라인 채택

[5] 결과적으로 뭐가 달라졌는지
응답 정확도 및 신뢰도 향상: 존재하지 않는 가짜 장소 추천 0건 달성, 데이트 코스에 부적합한 시설(화장실, 철물점, 중복 카테고리) 유입 차단

사용자 경험(UX) 극대화: 마음에 들지 않는 장소만 1초 내로 새로고침하는 '다른 곳 추천' 기능으로 재탐색 피로도 해소

협업 생산성: 모호했던 하트 그룹 체계를 '기본 찜'과 '사용자 커스텀 폴더'로 일원화하여 불필요한 예외 처리 코드 제거

[6] 다시 한다면 뭘 개선할 건지
Gemini Function Calling(도구 호출) 기반 동적 체이닝: 사용자가 채팅 형식으로 "비 오는 날 실내 데이트로 바꿔줘"라고 할 때 인텐트를 분류해 카카오 API 파라미터(실내 액티비티 카테고리)를 동적으로 재호출하는 구조로 고도화

코스 저장 및 동시 편집 웹소켓(WebSocket) 적용: 현재 폴링/API 기반인 공유 지도와 보관함을 실시간 웹소켓 이벤트로 동기화하여 다중 접속 시 즉각적인 실시간 협업 지원

[7] 기술 선택 과정에서 어떤 고민을 했는지
Next.js 16 App Router & Route Handler:

API 키(Gemini, Kakao REST)를 브라우저에 노출하지 않고 서버 사이드에서 안전하게 호출하면서, 프론트엔드와 백엔드 간 TypeScript 타입을 공유해 개발 속도를 극대화함.

Prisma ORM & PostgreSQL (Supabase):

장소(RoomPlace)와 코스(SavedCourse)가 복합적인 JSON 속성(좌표, 단계별 시간, 코멘터리)을 다루기 때문에 JSON 필드를 원활하게 지원하고 강력한 타입 안정성을 제공하는 Prisma를 채택함.

Gemini 2.5 Flash:

빠른 추론 속도(Time to First Token)와 JSON Schema 강제 출력 기능을 지원하여, 모바일 웹 환경에서 이탈률을 최소화할 수 있는 경량 고성능 모델로 선정함.
