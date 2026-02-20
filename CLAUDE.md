# 점메추 (점심 메뉴 추천) — CLAUDE.md

## 서비스 개요
직장인 대상 위치 기반 점심 음식점 추천 웹 서비스.
사용자가 반경/가격대/비선호 태그를 설정하면 주변 음식점 3곳을 카드로 추천하고 Google Maps로 연결한다.

## 기술 스택
- **Frontend**: Next.js 15 + TypeScript, Tailwind CSS v4 (`darkMode: 'class'`), Pretendard 폰트
- **Backend**: AWS Lambda + API Gateway (Serverless Framework), TypeScript
- **DB**: AWS RDS PostgreSQL (Prisma ORM) + Redis (ElastiCache)
- **Auth**: Firebase Authentication — Google 소셜 로그인만, 게스트 모드 없음
- **외부 API**: Google Maps Places API, Generative AI API (Claude/GPT)
- **분석**: Google Analytics 4

## 프로젝트 구조
```
jummaechu/
├── frontend/          # Next.js 앱
│   ├── types/index.ts # 공유 타입 정의
│   ├── lib/           # firebase.ts, analytics.ts, api.ts
│   └── hooks/         # useAuth.ts, useGeolocation.ts
├── backend/           # Lambda 함수
│   ├── prisma/        # schema.prisma
│   ├── src/types/     # index.ts (백엔드 타입)
│   ├── src/services/  # filterService.ts, rankingService.ts
│   └── src/functions/ # places/search, places/details, menu/enrich, user/preferences
├── PRD.md             # 제품 요구사항
├── architecture.md    # 시스템 아키텍처
├── database.md        # DB 스키마 설계
├── design-reference.md # 디자인 시스템
└── tasks.md           # 개발 태스크 (Phase 0~7)
```

## 확정된 주요 결정사항
- 로그인: Google 소셜만 (Firebase Auth), 게스트 모드 없음
- 랭킹: 거리 + 평점 동일 가중치(0.5/0.5), 정규화 합산, 상수로 분리
- "다시 추천받기": 상위 10개 후보 풀 캐싱 후 무작위 3개 셔플
- AI 메뉴 보강: 기본 제공, 후보 3개 확정 후 자동 실행
- 카드 사진: Google Places 이미지 포함
- 배포: Lambda + API Gateway + CloudFront + S3
- 태블릿 필터: 헤더 아래 상단 바

## 타입 일관성 주의사항
- `PriceBand`: TS 문자열 `'under_10k' | '10_15k' | 'over_15k'`, Prisma Enum 키는 `price_10_15k` (`@map("10_15k")`)
- `UserPreference` 필드명: `defaultRadiusM` (frontend/backend 통일)
- `PlaceResult`(backend) ↔ `Restaurant`(frontend): `category: RestaurantCategory` 필드 포함

## Phase 3 시작 전 BLOCKING 결정 필요
- `price_level(0~4)` → `PriceBand` 매핑 규칙
- "가격 정보 없음" 음식점 처리 방법
- GeneratedResult 공용 캐시 vs 개인화 캐시 병행 여부
- Geolocation 캐시 키 좌표 정밀도

## 코딩 컨벤션
- 한국어 주석 사용
- API 응답 에러 메시지: 한국어 (`{ message: '...' }`)
- Lambda 핸들러: uid 타입 체크 후 undefined 시 401 반환
- JSON.parse: 항상 try-catch 감싸기
- 환경변수: `.env.example` / `.env.local.example` 참고
