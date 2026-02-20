# Architecture — 점심 메뉴 추천 서비스 '점메추'

## 1. Technical Decisions
- Frontend choice: Next.js 15 (App Router) + TypeScript
- Backend structure: Next.js API Routes (서버리스 함수, Amplify SSR Lambda로 실행)
- Database type: AWS RDS PostgreSQL + Cache (Redis/ElastiCache) — 미구현, Phase 2/3 예정
- Authentication method: Firebase Authentication — Google 소셜 로그인만 제공 — 미구현, Phase 1 예정
- Hosting method: **AWS Amplify** (프론트+백엔드 통합 SSR 배포)

## 2. System Overview
- 목표: 사용자가 반경/가격대/비선호 태그를 설정하면, Tinder 스타일로 음식점을 1장씩 카드로 추천하고 좋아요(Google Maps 열기) / 싫어요(해당 카테고리 가중치 감소)로 반응한다.
- 주요 외부 의존성
  - Browser Geolocation API
  - Google Maps Places API (New) — Nearby Search, 사진
  - OpenAI gpt-4o-mini — 대표 메뉴 3~5개 + 태그 + excluded 판정
  - Firebase Authentication — 사용자 로그인 (Phase 1 예정)

## 3. High-level Components
- Frontend + API (Next.js on Amplify)
  - 위치 권한 요청 및 좌표 획득
  - 조건 입력 (반경 / 가격대 / 비선호 태그)
  - Tinder 카드 렌더링 (1장씩, 좋아요/싫어요)
  - 가중치 알고리즘: 싫어요 누를수록 해당 카테고리 재등장 확률 감소 (×0.7, min 0.1)
  - Google Maps 딥링크 (좋아요 → 새 탭 열기)
  - `/api/places/search` — Google Places Nearby Search 프록시 (API 키 보호)
  - `/api/menu/enrich` — OpenAI로 대표 메뉴 보강 + 비선호 excluded 판정
- Database/Cache (AWS, Phase 2/3 예정)
  - RDS: 사용자 설정(비선호 태그, 기본 반경·가격대), 추천/클릭 이벤트 로그
  - Redis: Places 검색 결과 / AI 보강 결과 캐싱

## 4. Data Flow

- Step 1) Client → Geolocation
  - 사용자가 위치 권한 허용 → 좌표(lat, lng) 획득

- Step 2) Client → `/api/places/search`
  - 입력: lat, lng, radius
  - Backend: DISTANCE + POPULARITY 병렬 Nearby Search → 중복 제거 → Fisher-Yates 셔플
  - 반환: 최대 40개 Restaurant[] (placeId, name, category, address, rating, priceBand, photoUrl, mapUrl 등)

- Step 3) Client → 후보 풀 구성
  - 비선호 필터(excludeKeywords) + Tinder 가중치 알고리즘으로 1장씩 카드 선택 (pickWeighted)

- Step 4) Client → `/api/menu/enrich`
  - 현재 카드 확정 후 자동 호출 (백그라운드 업데이트)
  - 입력: name, category, address, excludeKeywords[]
  - GPT: 대표 메뉴 3~5개 + 태그(VALID_TAGS 14종) + excluded 판정
  - 반환: { menus, tags, excluded }

- Step 5) Client → 사용자 반응
  - 좋아요: `window.open(mapUrl, '_blank')` → 다음 카드
  - 싫어요: `dislikedCategories[category]++` → 가중치 재계산 → 다음 카드

## 5. API Design (현재 구현)

- `GET /api/places/search`
  - Query: `lat`, `lng`, `radius` (500 | 1000 | 2000)
  - 동작: DISTANCE + POPULARITY 병렬 searchNearby → 중복 제거 → 셔플
  - Returns: `{ restaurants: Restaurant[] }` (최대 40개)

- `POST /api/menu/enrich`
  - Body: `{ name, category, address, excludeKeywords?, placeId? }`
  - 동작: gpt-4o-mini로 대표 메뉴 + 태그 분석, excludeKeywords 해당 시 excluded=true
  - Returns: `{ menus: string[], tags: string[], excluded: boolean }`

## 6. Caching & Cost Control
- 현재 캐싱 미구현 (Redis Phase 3 예정)
- 비용 최적화 적용 내용:
  - Places API: rating, priceLevel, photos → Enterprise SKU, 월 $200 무료 크레딧 내 운용
  - **Places Details(리뷰) 호출 제거** — enrich 시 리뷰 데이터 사용 안 함 (55% 비용 절감)
  - enrich: 후보 카드 1장 확정 시마다 백그라운드 호출 (지연 최소화)
- 향후 캐시 계획:
  - Places 검색 결과: TTL 10~30분
  - AI 보강 결과: TTL 7~30일 (prompt_version 포함)

## 7. Security
- Google Maps API Key, OpenAI API Key는 서버(API Route)에서만 사용
- **Amplify SSR Lambda 환경변수 주의**: `process.env`가 런타임에 주입 안 될 수 있음
  → `next.config.ts`의 `env` 필드로 빌드 타임에 번들에 직접 포함하여 해결
- Firebase ID Token 검증: Phase 1에서 구현 예정
- rate limit(사용자/IP 기준) + 파라미터 검증: Phase 3에서 구현 예정

## 8. Observability
- 이벤트 예시: `page_view`, `location_allowed`, `filters_set`, `card_liked`, `card_disliked`, `map_open`
- 분석 도구: Google Analytics 4 (Phase 6 예정)

## 9. Decisions

| 항목 | 결정 |
|------|------|
| 로그인 방식 | Google 소셜 로그인만 (Firebase Auth Google Provider) — Phase 1 예정 |
| 게스트 모드 | 미제공 — 현재 임시로 인증 없이 동작, Phase 1에서 게이트 추가 |
| AI 메뉴 보강 | 기본 제공 — 카드 1장 확정 시 자동 호출 (gpt-4o-mini) |
| AI enrich 입력 | name + category + address 만 사용 (Places Details/리뷰 제거 — 비용 최적화) |
| 추천 UI | **Tinder 스타일** — 1장씩, 좋아요(지도 열기)/싫어요(카테고리 가중치 감소) |
| 가중치 알고리즘 | 싫어요 카테고리: weight × 0.7^n, 최소 0.1 보장 |
| 결과 다양성 | DISTANCE + POPULARITY 병렬 검색 → 최대 40개 → Fisher-Yates 셔플 |
| 배포 방식 | **AWS Amplify** (Next.js SSR + API Routes 통합) |
| 분석 도구 | Google Analytics 4 (Phase 6 예정) |

## 10. Open Questions (잔여)

| ID | 항목 | 상태 |
|----|------|------|
| U-4 | Geolocation 캐시 키 좌표 정밀도 (소수점 몇 자리 rounding?) | 미결정 — Redis 구현 전 결정 필요 |
| U-8 | GeneratedResult 공용 캐시(user_id=NULL) vs 개인화 캐시 병행 | 미결정 — Redis 구현 전 결정 필요 |
