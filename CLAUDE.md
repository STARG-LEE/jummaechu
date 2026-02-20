# 점메추 (점심 메뉴 추천) — CLAUDE.md

## 서비스 개요
직장인 대상 위치 기반 점심 음식점 추천 웹 서비스.
사용자가 반경/가격대/비선호 태그를 설정하면, **Tinder 스타일**로 주변 음식점을 1장씩 카드로 보여준다.
좋아요(→ Google Maps 바로 열기) / 싫어요(→ 해당 카테고리 재등장 확률 감소)로 반응한다.

## 기술 스택
- **Frontend + API**: Next.js 15 + TypeScript, Tailwind CSS v4 (`darkMode: 'class'`), Pretendard 폰트
  - API Routes: `/api/places/search`, `/api/menu/enrich` (서버사이드, API 키 보호)
- **Hosting**: AWS Amplify (Next.js SSR + API Routes 통합 배포)
- **DB**: AWS RDS PostgreSQL (Prisma ORM) + Redis (ElastiCache) — Phase 2/3 예정
- **Auth**: Firebase Authentication — Google 소셜 로그인만, 게스트 모드 없음 — Phase 1 예정
- **외부 API**: Google Maps Places API (New), OpenAI gpt-4o-mini
- **분석**: Google Analytics 4 — Phase 6 예정

## 프로젝트 구조
```
jummaechu/
├── frontend/               # Next.js 앱 (AWS Amplify로 배포)
│   ├── app/
│   │   ├── recommend/      # page.tsx — Tinder 추천 화면 (메인 구현)
│   │   └── api/
│   │       ├── places/search/route.ts   # Google Places Nearby Search
│   │       └── menu/enrich/route.ts     # OpenAI gpt-4o-mini 메뉴 보강
│   ├── types/index.ts      # 공유 타입 정의 (Restaurant, ExcludeTag, PriceBand 등)
│   ├── lib/                # firebase.ts, analytics.ts, api.ts
│   ├── hooks/              # useAuth.ts, useGeolocation.ts
│   └── next.config.ts      # env 빌드타임 주입 (Amplify SSR Lambda 대응)
├── backend/                # Lambda 함수 스캐폴드 (Phase 2/3 예정)
│   ├── prisma/             # schema.prisma
│   └── src/                # functions/, services/, types/
├── amplify.yml             # AWS Amplify 모노레포 빌드 설정
├── PRD.md                  # 제품 요구사항
├── architecture.md         # 시스템 아키텍처
├── database.md             # DB 스키마 설계
├── design-reference.md     # 디자인 시스템
└── tasks.md                # 개발 태스크 (Phase 0~7)
```

## 확정된 주요 결정사항
- 로그인: Google 소셜만 (Firebase Auth), 게스트 모드 없음 — Phase 1 예정
- 추천 UI: **Tinder 스타일** — 1장씩, 좋아요(지도 열기)/싫어요(가중치 감소)
- 가중치 알고리즘: 싫어요 카테고리의 weight × 0.7^n, 최소 0.1 보장
- 후보 풀: 최대 40개 (DISTANCE + POPULARITY 병렬 검색 → 셔플)
- AI 메뉴 보강: gpt-4o-mini, name+category+address 기반 (Places Details/리뷰 제거 — 비용 최적화)
- 카드 사진: Google Places 이미지 포함
- 배포: **AWS Amplify** (amplify.yml + next.config.ts env 빌드타임 주입)
- 태블릿 필터: 헤더 아래 상단 바

## Amplify SSR Lambda 환경변수 주의사항
- Amplify SSR Lambda는 Amplify 콘솔 환경변수를 런타임 `process.env`에 주입하지 않을 수 있음
- 해결책: `next.config.ts`의 `env` 필드로 빌드 타임에 webpack DefinePlugin 통해 서버 번들에 직접 포함
  ```ts
  env: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  }
  ```
- 새 환경변수 추가 시 반드시 `next.config.ts` env 필드에도 추가 후 재배포

## 타입 일관성 주의사항
- `PriceBand`: TS 문자열 `'under_10k' | '10_15k' | 'over_15k'`, Prisma Enum 키는 `price_10_15k` (`@map("10_15k")`)
- `UserPreference` 필드명: `defaultRadiusM` (frontend/backend 통일)
- `Restaurant.tags`: `ExcludeTag[]` — GPT가 반환하는 VALID_TAGS 14종 중 해당 항목
- `Restaurant.excluded`: `boolean` — GPT가 excludeKeywords 매칭 시 true

## Places API (New) 핵심 사항
- `priceLevel`: 숫자 0~4 아님 — Enum 문자열 반환
  - `PRICE_LEVEL_INEXPENSIVE` → `under_10k`
  - `PRICE_LEVEL_MODERATE` → `10_15k`
  - `PRICE_LEVEL_EXPENSIVE` / `PRICE_LEVEL_VERY_EXPENSIVE` → `over_15k`
  - `PRICE_LEVEL_UNSPECIFIED` → `null`
- `photos[].name` 값은 만료됨 — 장기 캐싱 불가 (현재 URL 직접 사용 중, TTL 제한 유의)
- `rating`, `priceLevel`, `photos` → Enterprise SKU (월 $200 무료 크레딧 내 운용)
- Places Details(리뷰/opening_hours) 호출은 비용 이슈로 **제거** — enrich 시 사용 안 함

## 코딩 컨벤션
- 한국어 주석 사용
- API 응답 에러 메시지: 한국어 (`{ message: '...' }`)
- Next.js API Route: uid 타입 체크 후 undefined 시 401 반환 (Firebase 연동 후)
- JSON.parse: 항상 try-catch 감싸기
- 환경변수: `.env.local.example` 참고, 새 키 추가 시 `next.config.ts` env도 함께 수정
