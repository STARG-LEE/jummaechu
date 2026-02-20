# Architecture — 점심 메뉴 추천 서비스 '점메추'

## 1. Technical Decisions
- Frontend choice: Next.js (React) + TypeScript
- Backend structure: AWS Lambda + API Gateway (서버리스)
- Database type: AWS RDS PostgreSQL + Cache (Redis/ElastiCache)
- Authentication method: Firebase Authentication — Google 소셜 로그인만 제공
- Hosting method: AWS CloudFront + S3 (프론트) + Lambda + API Gateway (백엔드)

## 2. System Overview
- 목표: 사용자가 반경/가격대/비선호 태그를 선택하면, 주변 음식점 중 조건에 맞는 3곳을 카드로 추천하고 Google Maps로 연결한다.
- 주요 외부 의존성
-	Browser Geolocation API
-	Google Maps Places API (검색/상세/price_level 등)
-	Generative AI API (Claude/GPT 등) — 대표 메뉴 정보 보강 (기본 제공)
-	Firebase Authentication — 사용자 로그인

## 3. High-level Components
- Frontend (Web)
-	위치 권한 요청 및 좌표 획득
-	로그인/로그아웃(Firebase Auth)
-	사용자 조건 입력(반경/가격대/비선호 태그)
-	추천 결과 카드 3개 렌더링
-	설정 캐시(LocalStorage) 저장/불러오기(옵션)
-	Google Maps 딥링크 생성(길찾기)
- Backend (AWS API Layer)
-	Places 검색/상세 조회 프록시(키 보호)
-	필터링/랭킹(거리/평점/리뷰수/가격대)
-	캐싱(쿼리 단위, 장소 상세 단위)
-	AI 메뉴 보강 파이프라인 (기본 제공 — 후보 3개 확정 후 자동 호출)
-	rate limit / 에러 핸들링 / 로깅
- Database/Cache (AWS)
-	RDS: 사용자 설정(비선호 태그), 추천/클릭 이벤트 로그(선택)
-	Redis: Places 검색 결과/장소 상세/AI 보강 결과 캐싱

## 4. Data Flow
- Step 1) Client → Geolocation
-	사용자가 위치 권한 허용 → 좌표(lat,lng) 획득
- Step 2) Client → Auth
-	Firebase Auth로 Google 소셜 로그인 (게스트 모드 미제공)
- Step 3) Client → Backend /api/places/search
-	입력: lat,lng, radius, price_band, exclude_tags
-	Backend는 캐시 확인 → 미스 시 Google Places 호출
- Step 4) Backend → Filtering & Ranking
-	비선호 필터: 규칙 기반 1차(카테고리/키워드) + (옵션) AI 분류 2차
-	랭킹: 거리/평점/리뷰수/가격대 일치도
- Step 5) Backend → AI Enrichment (기본 제공)
-	후보 3곳 확정 후에만 대표 메뉴 보강 호출(비용/지연 최소화)
- Step 6) Client → Render & Link-out
-	카드 3개 표시 → 선택 시 Google Maps 길찾기 링크로 이동

## 5. API Design (Proposed)
- GET /api/places/search
-	Query: lat, lng, radius(500|1000|2000), price_band(under_10k|10_15k|over_15k), exclude_tags[]
-	Returns: places[] (place_id, name, types, rating, user_ratings_total, price_level?, distance_m, address, map_url)
- GET /api/places/details
-	Query: place_id
-	Returns: details (opening_hours?, photos?, price_level?, editorial_summary?, etc)
- POST /api/menu/enrich (기본 제공 — 추천 시 자동 호출)
-	Body: place_id, name, types, reviews_snippet?
-	Returns: 대표메뉴, 예상가격대, 한줄설명
- GET/PUT /api/user/preferences
-	Auth: Firebase ID Token
-	Returns/Stores: exclude_tags, 기본 반경/가격대 등

## 6. Caching & Cost Control
- 캐시 대상/TTL(예시)
-	Places 검색 결과: 10~30분
-	Place details: 1~7일
-	AI enrich: 7~30일(prompt_version 포함)
- 호출 최소화
-	검색 결과에서 후보 N개만 받고, 최종 3개 확정 후 details/enrich 호출

## 7. Security
- Google Maps API Key는 서버에서만 사용(브라우저 노출 금지)
- Firebase ID Token 검증(Backend에서)
- rate limit(사용자/IP 기준) + 파라미터 검증(radius/price_band 화이트리스트)

## 8. Observability
- 이벤트 예시
-	page_view, location_allowed, login_success, filters_set, recommendations_shown, card_clicked
- 분석 도구: Google Analytics 4

## 9. Decisions

| 항목 | 결정 |
|------|------|
| 로그인 방식 | Google 소셜 로그인만 (Firebase Auth Google Provider) |
| 게스트 모드 | 미제공 — 모든 API 호출에 Firebase ID Token 필수 |
| AI 메뉴 보강 | 기본 제공 — 후보 3개 확정 후 자동 호출 |
| 랭킹 가중치 | 거리 + 평점 동일 가중치 (정규화 후 합산), 상수로 분리해 추후 조정 가능하게 |
| 배포 방식 | Lambda + API Gateway (서버리스) + CloudFront + S3 (프론트) |
| 분석 도구 | Google Analytics 4 |
| 다시 추천받기 | 상위 10개 후보 풀 캐싱 후 무작위 3개 셔플 |

## 10. Open Questions (잔여)
- price_band ↔ price_level(0~4) 매핑 규칙
- “가격 정보 없음” 식당 처리 (포함/후순위)
