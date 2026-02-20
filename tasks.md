# Tasks — 점심 메뉴 추천 서비스 '점메추'

> **상태 표기**: `[ ]` 미시작 · `[~]` 진행중 · `[x]` 완료 · `[!]` 블로킹
> **우선순위**: `P0` 없으면 서비스 불가 · `P1` MVP 필수 · `P2` 품질/완성도 · `P3` 선택 기능

---

## 확정된 기술 결정사항

| 항목 | 결정 |
|------|------|
| 로그인 방식 | Google 소셜 로그인만 (Firebase Auth) |
| 게스트 모드 | 미제공 — 로그인 필수 |
| 카드 음식점 사진 | 포함 (Google Places 이미지 API) |
| AI 메뉴 보강 | 기본 제공 — 추천 시 자동 실행 (gpt-4o-mini, name+category+address 기반) |
| 추천 UI 방식 | **Tinder 스타일** — 1장씩 표시, 좋아요(지도 바로 열기) / 싫어요(해당 카테고리 가중치 감소) |
| 랭킹 기준 | 거리 + 평점 병렬 검색(DISTANCE·POPULARITY), 서버 셔플로 다양성 확보 |
| 분석 도구 | Google Analytics 4 |
| 태블릿 필터 위치 | 상단 바 (헤더 아래) |
| AWS 배포 방식 | **AWS Amplify** (Next.js SSR — API Routes 포함) |
| enrich API 비용 최적화 | Places Details(리뷰) 호출 제거 — name+category+address만 GPT에 전달 |

---

## Phase 0. 프로젝트 세팅

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[x]` | P0 | Next.js + TypeScript 프로젝트 초기화 | `create-next-app` |
| `[x]` | P0 | Tailwind CSS 설치 및 `darkMode: 'class'` 설정 | |
| `[x]` | P0 | Pretendard 폰트 적용 (`next/font` 또는 CDN) | |
| `[~]` | P0 | 디자인 토큰 설정 (색상·타이포·간격 → Tailwind config) | design-reference §2, §3, §4 |
| `[x]` | P0 | 환경변수 파일 구성 (`.env.local.example`) | GOOGLE_MAPS_API_KEY, OPENAI_API_KEY |
| `[ ]` | P0 | ESLint / Prettier 설정 | |
| `[ ]` | P0 | `.gitignore` 파일 생성 (루트 / frontend / backend) | `.env*`, `node_modules`, `.serverless` 등 |
| `[ ]` | P0 | Firebase 프로젝트 생성 및 Google Provider 활성화 | Phase 1 인증 구현 전 선행 필요 |
| `[x]` | P0 | Google Maps Places API 키 발급 | 프로덕션에서 동작 확인 완료 |
| `[x]` | P0 | OpenAI API 키 발급 및 설정 | gpt-4o-mini 사용 중 |
| `[x]` | P1 | 폴더 구조 확정 및 세팅 | `app/`, `api/`, `types/`, `lib/`, `hooks/` |
| `[ ]` | P1 | AWS 인프라 구성 (RDS PostgreSQL + Redis) | DB 기능 구현 시 필요 |
| `[ ]` | P1 | DB 마이그레이션 툴 선택 및 초기 스키마 생성 | Prisma 권장 |

---

## Phase 1. 인증 (Google 소셜 로그인)

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[ ]` | P0 | Firebase Auth 초기화 및 Google Provider 연결 | |
| `[ ]` | P0 | Google 로그인 버튼 UI 구현 | |
| `[ ]` | P0 | 로그아웃 기능 구현 | |
| `[ ]` | P0 | Firebase ID Token 검증 미들웨어 (Next.js API Routes) | 모든 보호 라우트에 적용 |
| `[ ]` | P1 | 로그인 상태에 따른 라우팅 처리 (미로그인 → 로그인 페이지 리다이렉트) | 게스트 모드 없음 |
| `[ ]` | P1 | 로그인 상태 전역 관리 (Context 또는 Zustand) | |

---

## Phase 2. DB 스키마 구현

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[ ]` | P0 | `User` 테이블 생성 (firebase_uid, email, timestamps) | database §2.1 |
| `[ ]` | P0 | `UserPreference` 테이블 생성 (exclude_tags, default_radius_m, default_price_band) | database §2.2 |
| `[ ]` | P2 | `RecommendationSession` 테이블 생성 (lat, lng, radius, price_band, top_place_ids) | GA와 병행 수집 |
| `[ ]` | P2 | `RecommendationClick` 테이블 생성 (session_id, place_id, action_type: like/dislike) | Tinder 액션 반영 |
| `[ ]` | P2 | `GeneratedResult` 테이블 생성 (AI 메뉴 보강 캐시, TTL 7~30일) | |

---

## Phase 3. 핵심 API 구현

> **Phase 3 시작 전 결정 필요 (BLOCKING)**

| 상태 | 우선순위 | 결정 항목 | 비고 |
|------|----------|-----------|------|
| `[x]` | P0 | `priceLevel` Enum → `PriceBand` 매핑 규칙 확정 | INEXPENSIVE/MODERATE/EXPENSIVE/VERY_EXPENSIVE → under_10k/10_15k/over_15k/over_15k |
| `[x]` | P0 | "가격 정보 없음" 음식점 처리 방법 결정 | **확정**: 포함, 가격 정보 없음 표시, 랭킹 하위 배치 |
| `[!]` | P1 | GeneratedResult 공용 캐시(user_id=NULL) vs 개인화 캐시 병행 여부 결정 | Redis 캐시 구현 전 결정 필요 |
| `[!]` | P1 | Geolocation 캐시 키 좌표 정밀도 결정 (소수점 몇 자리 rounding) | Redis 캐시 구현 전 결정 필요 |

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[x]` | P0 | Google Maps Places API 서버 측 래퍼 구현 | Next.js API Route로 구현 (API 키 브라우저 노출 금지) |
| `[x]` | P0 | `GET /api/places/search` 구현 | 병렬 DISTANCE+POPULARITY 검색, Fisher-Yates 셔플, 최대 40개 결과 반환 |
| `[x]` | P0 | 비선호 필터링 로직 구현 | GPT `excluded` 판정 방식 — name+category+address 기반 AI 분류 |
| `[ ]` | P0 | 랭킹 로직 구현 (거리 + 평점 동일 가중치, 정규화 후 합산) | 현재는 Places API 병렬검색 + 셔플로 대체 중 |
| `[x]` | P1 | AI 메뉴 보강 Prompt 초안 작성 및 테스트 | gpt-4o-mini, JSON response_format |
| `[x]` | P1 | `POST /api/menu/enrich` 구현 | name+category+address → menus[], tags[], excluded |
| `[ ]` | P1 | `GET /api/user/preferences` 구현 | Firebase Auth 필수 |
| `[ ]` | P1 | `PUT /api/user/preferences` 구현 (exclude_tags, 기본 반경·가격대 저장) | |
| `[ ]` | P1 | Redis 캐시 키 생성 규칙 설계 문서화 (좌표 rounding 포함) | |
| `[ ]` | P1 | rate limit 적용 (사용자/IP 기준) | |
| `[ ]` | P1 | 파라미터 검증 (radius·price_band 화이트리스트) | |
| `[ ]` | P2 | Redis 캐싱 연결 (검색: TTL 10~30분 / AI 보강: TTL 7~30일) | |

---

## Phase 4. UI 컴포넌트 구현

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[ ]` | P0 | 다크모드 토글 구현 (CSS class 방식 + 수동 버튼) | design-reference §5-5 |
| `[ ]` | P0 | 공통 레이아웃 구성 — 모바일 헤더 / 데스크탑 GNB / 태블릿 상단 바 | design-reference §4, §9 |
| `[ ]` | P0 | 반응형 브레이크포인트 적용 (mobile ~767 / tablet 768~1023 / desktop 1024~) | |
| `[ ]` | P0 | `FilterChip` 컴포넌트 (비선택/선택 상태, Light/Dark) | design-reference §5-2 |
| `[ ]` | P0 | `SegmentedControl` 컴포넌트 (반경·가격대 선택) | design-reference §5-4 |
| `[ ]` | P0 | `PrimaryButton` 컴포넌트 (기본/hover/비활성, Light/Dark) | design-reference §5-3 |
| `[x]` | P0 | `RestaurantCard` 컴포넌트 (Tinder 스타일 — 사진·음식점명·카테고리·대표메뉴·평점·거리·가격대) | recommend/page.tsx 인라인 구현 완료 |
| `[x]` | P0 | 좋아요 / 싫어요 버튼 (Tinder 액션 버튼) | 좋아요: 지도 열기, 싫어요: 카테고리 가중치 감소 |
| `[ ]` | P1 | `SkeletonCard` 컴포넌트 (로딩 shimmer, Light/Dark) | |
| `[x]` | P1 | 빈 상태(Empty State) UI | 모든 후보 소진 시 표시 |
| `[ ]` | P1 | 에러 상태(위치 거부) UI 컴포넌트 | |
| `[ ]` | P2 | 카드 진입 애니메이션 (fade-in + slide-up 200ms) | |
| `[ ]` | P2 | 모바일 페이지 전환 애니메이션 (slide-left 250ms) | |
| `[ ]` | P2 | 데스크탑 카드 hover 효과 (border + shadow 강조) | |

---

## Phase 5. 화면 구현

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[ ]` | P0 | **[데스크탑] 랜딩 홈페이지** (Hero + How it works + 필터 패널 + 결과 영역) | design-reference §8 Screen 1 |
| `[ ]` | P0 | **[태블릿] 필터 상단 바** 레이아웃 (헤더 아래 가로 필터 + 결과 카드) | design-reference §9 |
| `[ ]` | P0 | **[모바일] 온보딩 — 비선호 음식 설정** 화면 (최초 1회) | design-reference §8 Screen 1-M |
| `[ ]` | P0 | **[모바일] 조건 선택** 화면 (반경·가격대·비선호 요약) | design-reference §8 Screen 2-M |
| `[x]` | P0 | **[모바일] 추천 — Tinder 카드** 화면 (1장씩 표시 + 좋아요/싫어요) | `/app/recommend/page.tsx` 완료 |
| `[ ]` | P1 | **[모바일] 설정** 화면 (비선호 수정, 기본값 수정, 로그아웃) | design-reference §8 Screen 4-M |
| `[ ]` | P1 | Geolocation 권한 요청 UX (허용 전 1문장 안내 → 요청) | |
| `[x]` | P1 | Google Maps 딥링크 연결 (좋아요 → Google Maps 새 탭 열기) | `window.open(mapUrl, '_blank')` |
| `[ ]` | P1 | Google 로그인 화면 / 인증 게이트 구현 | |

---

## Phase 6. 분석 & 이벤트 로깅 (Google Analytics)

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[ ]` | P1 | Google Analytics 4 설치 및 Next.js 연결 | `next/script` 또는 `@next/third-parties` |
| `[ ]` | P1 | GA 이벤트 정의 및 커스텀 이벤트 구현 | `page_view`, `location_allowed` |
| `[ ]` | P2 | GA 이벤트 구현: `filters_set`, `recommendations_shown` | |
| `[ ]` | P2 | GA 이벤트 구현: `card_liked`, `card_disliked`, `map_open` | Tinder 액션 반영 |
| `[ ]` | P2 | GA 전환 목표 설정 | |
| `[ ]` | P2 | `RecommendationSession` / `RecommendationClick` DB 저장 연결 (GA 보완용) | |

---

## Phase 7. QA & 배포

| 상태 | 우선순위 | 작업 | 비고 |
|------|----------|------|------|
| `[ ]` | P1 | 주요 API 단위 테스트 (필터링·랭킹 로직) | |
| `[ ]` | P1 | 모바일/태블릿/데스크탑 UI 크로스 브라우저 확인 (Chrome, Safari, Edge) | |
| `[ ]` | P1 | Light/Dark 모드 전 화면 QA | |
| `[ ]` | P1 | 엣지케이스 QA (위치 거부 / API 에러 / 결과 없음 / AI 보강 실패) | |
| `[x]` | P1 | **AWS Amplify 배포 구성** | `amplify.yml` + `next.config.ts` env 빌드타임 주입으로 해결 |
| `[x]` | P1 | GitHub 연동 (master 브랜치 자동 배포) | |
| `[ ]` | P2 | 도메인 연결 및 HTTPS 설정 | Amplify 기본 HTTPS 포함 |
| `[x]` | P2 | Google Maps API 사용량 모니터링 확인 | GCP 콘솔에서 크레딧 확인 완료 |
| `[ ]` | P3 | Lighthouse 성능 점수 측정 및 개선 | |

---

## 미결정 사항 (잔여)

| ID | 항목 | 상태 | 관련 Phase |
|----|------|------|-----------|
| U-1 | `priceLevel` → `PriceBand` 매핑 규칙 | **확정**: INEXPENSIVE→under_10k / MODERATE→10_15k / EXPENSIVE·VERY_EXPENSIVE→over_15k / UNSPECIFIED→null | Phase 3 |
| U-2 | "가격 정보 없음" 음식점 처리 (포함 후순위 vs 제외) | **확정**: 포함, 가격 정보 없음 표시, 랭킹 하위 배치 | Phase 3 |
| U-3 | 추천 UI 방식 | **확정**: Tinder 스타일 — 1장씩, 좋아요(지도 열기)/싫어요(카테고리 가중치×0.7 감소, min 0.1) | Phase 4/5 |
| U-4 | Geolocation 캐시 키 좌표 정밀도 | 미결정 — Redis 캐시 키 설계 전 결정 필요 | Phase 3 |
| U-5 | 로고/서비스명 폰트 (Pretendard Bold vs 별도 디스플레이 폰트) | 미결정 — 개발 차단 없음 | Phase 5 |
| U-6 | 카드 전환 애니메이션 방식 (Tinder 스와이프 vs fade) | 미결정 — 개발 차단 없음 | Phase 4 |
| U-7 | RecommendationSession/Click 데이터 보관 기간 (90일 vs 180일) | 미결정 — 배포 전 결정 필요 | Phase 7 전 |
| U-8 | GeneratedResult 공용 캐시(user_id=NULL) vs 개인화 캐시 병행 | **BLOCKING** — Redis 구현 전 결정 필요 | Phase 3 |
