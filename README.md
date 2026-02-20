# 점메추 — 점심 메뉴 추천 서비스

> "오늘 점심 뭐 먹지?" 고민하기 싫은 직장인을 위한 위치 기반 점심 메뉴 추천 웹 서비스

현재 위치를 기반으로 반경 내 음식점을 검색하고, 개인의 비선호 음식을 제외한 뒤 **딱 3곳만** 추천합니다.

---

## 서비스 흐름

```
위치 허용 → 반경·가격대 선택 → 비선호 음식 필터 → 추천 카드 3개 → Google Maps 이동
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS v4 |
| Backend | AWS Lambda · API Gateway (Serverless Framework) |
| Database | AWS RDS PostgreSQL (Prisma ORM) |
| Cache | AWS ElastiCache Redis |
| 인증 | Firebase Authentication (Google 소셜 로그인) |
| 위치 검색 | Google Maps Places API |
| 메뉴 보강 | Generative AI API (Claude / GPT) |
| 분석 | Google Analytics 4 |

---

## 프로젝트 구조

```
jummaechu/
├── frontend/                   # Next.js 웹 앱
│   ├── app/                    # App Router 페이지
│   │   ├── (auth)/login/       # Google 로그인 페이지
│   │   ├── onboarding/         # 비선호 음식 초기 설정 (최초 1회)
│   │   ├── recommend/          # 조건 선택 → 결과 카드
│   │   └── settings/           # 설정 (비선호·반경·가격대 수정)
│   ├── components/
│   │   ├── layout/             # Header, GNB, DarkModeToggle
│   │   ├── ui/                 # FilterChip, SegmentedControl, Button, SkeletonCard
│   │   └── restaurant/         # RestaurantCard
│   ├── hooks/
│   │   ├── useAuth.ts          # Firebase 로그인 상태 구독
│   │   └── useGeolocation.ts   # GPS 권한 요청 및 좌표 획득
│   ├── lib/
│   │   ├── firebase.ts         # Google 소셜 로그인/로그아웃
│   │   ├── analytics.ts        # GA4 커스텀 이벤트 헬퍼
│   │   └── api.ts              # 백엔드 API 클라이언트 (토큰 자동 첨부)
│   └── types/index.ts          # 공유 타입 (ExcludeTag, PriceBand, Restaurant 등)
│
├── backend/                    # AWS Lambda 함수
│   ├── src/
│   │   ├── functions/
│   │   │   ├── places/         # GET /api/places/search, /details
│   │   │   ├── menu/           # POST /api/menu/enrich (AI 메뉴 보강)
│   │   │   └── user/           # GET/PUT /api/user/preferences
│   │   ├── middleware/
│   │   │   └── authenticate.ts # Firebase ID Token 검증 Lambda Authorizer
│   │   ├── services/
│   │   │   ├── filterService.ts  # 비선호 태그 기반 식당 필터링
│   │   │   └── rankingService.ts # 거리 + 평점 정규화 랭킹
│   │   ├── lib/
│   │   │   └── firebaseAdmin.ts  # Firebase Admin SDK
│   │   └── types/index.ts
│   ├── prisma/schema.prisma    # DB 스키마 (User, UserPreference, Session, Click, AI캐시)
│   └── serverless.yml          # Lambda + API Gateway 설정
│
├── PRD.md                      # 서비스 기획서
├── architecture.md             # 시스템 아키텍처
├── database.md                 # DB 스키마 설계
├── design-reference.md         # 디자인 가이드 (컬러·타이포·컴포넌트·레이아웃)
├── benchmark.md                # UX 레퍼런스 수집
└── tasks.md                    # 개발 태스크 및 진행 현황
```

---

## 시작하기

### 사전 요구사항

- Node.js 22+
- AWS CLI (배포 시)
- Firebase 프로젝트
- Google Cloud 프로젝트 (Maps Places API 활성화)

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/jummaechu.git
cd jummaechu
```

### 2. Frontend 설치 및 실행

```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.local 파일에 환경변수 입력 후
npm run dev
```

### 3. Backend 설치 및 로컬 실행

```bash
cd backend
npm install
cp .env.example .env
# .env 파일에 환경변수 입력 후

# DB 마이그레이션
npm run db:generate
npm run db:migrate

# 로컬 서버 실행 (serverless-offline)
npm run dev
```

---

## 환경변수

### frontend/.env.local

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase 프로젝트 API 키 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase 앱 ID |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 측정 ID |
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API Gateway URL |

### backend/.env

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `REDIS_URL` | Redis 연결 문자열 |
| `GOOGLE_MAPS_API_KEY` | Google Maps Places API 키 (서버 전용) |
| `AI_API_KEY` | 생성형 AI API 키 |
| `FIREBASE_PROJECT_ID` | Firebase Admin SDK 프로젝트 ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK 서비스 계정 이메일 |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK 서비스 계정 개인키 |

---

## API 엔드포인트

모든 요청에 Firebase ID Token이 필요합니다.
```
Authorization: Bearer <Firebase ID Token>
```

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/places/search` | 위치 기반 음식점 검색 및 추천 |
| `GET` | `/api/places/details` | 음식점 상세 정보 |
| `POST` | `/api/menu/enrich` | AI 대표 메뉴 정보 보강 |
| `GET` | `/api/user/preferences` | 사용자 설정 조회 |
| `PUT` | `/api/user/preferences` | 사용자 설정 저장 |

### GET /api/places/search

```
Query: lat, lng, radius(500|1000|2000), price_band(under_10k|10_15k|over_15k), exclude_tags(콤마 구분)
```

**응답 예시**
```json
{
  "restaurants": [
    {
      "placeId": "ChIJ...",
      "name": "한솥도시락 강남점",
      "category": "한식",
      "distanceM": 350,
      "rating": 4.1,
      "priceBand": "under_10k",
      "photoUrl": "https://...",
      "mapUrl": "https://maps.google.com/?...",
      "representativeMenus": ["제육볶음", "순두부찌개"],
      "description": "합리적인 가격의 도시락 전문점"
    }
  ]
}
```

---

## 핵심 알고리즘

### 비선호 필터링 (`filterService.ts`)

비선호 태그를 Google Places `types` 및 음식점명 키워드와 매핑하여,
**비선호 음식만 판매하는 식당**을 추천에서 제외합니다.

```
exclude_tags: ['spicy', 'raw']
→ 마라탕·불닭 전문점, 초밥·회 전문점 제외
→ 삼겹살집은 포함 (매운 음식 전문점이 아니므로)
```

### 랭킹 (`rankingService.ts`)

거리와 평점을 0~1로 정규화한 뒤 동일 가중치(각 0.5)로 합산합니다.

```
점수 = 거리점수 × 0.5 + 평점점수 × 0.5
거리점수 = 1 - (해당 거리 / 최대 거리)   // 가까울수록 높음
평점점수 = 평점 / 5                       // 높을수록 높음
```

### 캐싱 전략 (Redis)

| 대상 | TTL |
|------|-----|
| Places 검색 결과 | 10~30분 |
| Place 상세 정보 | 1~7일 |
| AI 메뉴 보강 결과 | 7~30일 |

---

## 디자인 시스템

### 컬러

| 토큰 | Light | Dark |
|------|-------|------|
| Primary | `#F97316` | `#F97316` |
| Background | `#FAFAF9` | `#0C0A09` |
| Surface (카드) | `#FFFFFF` | `#1C1917` |
| Text Primary | `#1C1917` | `#FAFAF9` |

### 레이아웃

- **모바일** (`~767px`): 단계별 풀스크린, 하단 고정 버튼
- **태블릿** (`768~1023px`): 상단 바 필터 + 결과 카드
- **데스크탑** (`1024px~`): 좌측 필터 패널(320px) + 우측 3열 카드 그리드

폰트: [Pretendard](https://github.com/orioncactus/pretendard) (무료, 오픈소스)

---

## 배포

```bash
# 프론트엔드 (CloudFront + S3)
cd frontend
npm run build

# 백엔드 (Lambda + API Gateway)
cd backend
npm run deploy
```

---

## 참고 문서

| 문서 | 설명 |
|------|------|
| [PRD.md](PRD.md) | 서비스 기획 및 요구사항 |
| [architecture.md](architecture.md) | 시스템 설계 및 기술 결정 |
| [database.md](database.md) | DB 스키마 설계 |
| [design-reference.md](design-reference.md) | 디자인 가이드 |
| [tasks.md](tasks.md) | 개발 태스크 현황 |
