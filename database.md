# Database — 점심 메뉴 추천 서비스 '점메추'

## 1. What data must be stored
- 목표
-	로그인 사용자 기반으로 비선호(Exclude) 설정을 저장하고, 추천 성과(선택/클릭)를 측정하며, AI 메뉴 보강 결과를 재사용(캐시)한다.
- 원칙
-	MVP는 최소 엔티티로 시작하고, 확장 엔티티(로그/캐시)를 선택적으로 추가한다.
-	외부 소스(Places API)의 원천 데이터는 원칙적으로 DB에 “복제 저장”하지 않고, 필요한 최소 식별자(place_id)와 캐시/로그만 저장한다.

## 2. Entities (Core)
### 2.1 User
- 저장 목적
-	Firebase Auth 사용자와 내부 DB 레코드를 연결(추후 설정/로그/결과를 user_id로 묶기)
- Fields
-	id (UUID, PK)
-	firebase_uid (string, UNIQUE, NOT NULL)
-	email (string, NULL 가능)
-	created_at (timestamp, NOT NULL)
-	updated_at (timestamp, NOT NULL)

### 2.2 UserPreference
- 저장 목적
-	사용자별 비선호 태그 및 기본 추천 옵션을 영속 저장
- Fields
-	id (UUID, PK)
-	user_id (UUID, FK -> User.id, NOT NULL)
-	exclude_tags (jsonb 또는 text[], NOT NULL, default [])
-	default_radius_m (int, NOT NULL, default 1000)
-	default_price_band (enum: under_10k|10_15k|over_15k, NULL 가능)
-	created_at (timestamp, NOT NULL)
-	updated_at (timestamp, NOT NULL)
- Constraints/Indexes
-	UNIQUE(user_id) (사용자당 1개 설정 레코드)
-	INDEX(user_id)

## 3. Entities (Analytics & Product Metrics)
### 3.1 RecommendationSession
- 저장 목적
-	한 번의 “추천 노출”을 세션으로 묶어 KPI(노출→클릭 전환율, 추천 품질)를 계산
- Fields
-	id (UUID, PK)
-	user_id (UUID, FK -> User.id, NOT NULL)  # 게스트 모드 없음
-	lat (decimal, NOT NULL)
-	lng (decimal, NOT NULL)
-	radius_m (int, NOT NULL)
-	price_band (enum, NULL 가능)
-	exclude_tags_snapshot (jsonb 또는 text[], NOT NULL)
-	top_place_ids (jsonb 또는 text[], NOT NULL)  # 추천된 3개 place_id 배열
-	created_at (timestamp, NOT NULL)
- Indexes
-	INDEX(user_id, created_at)

### 3.2 RecommendationClick
- 저장 목적
-	세션 내 클릭/선택 이벤트를 남겨 전환율 및 랭킹 개선에 활용
- Fields
-	id (UUID, PK)
-	session_id (UUID, FK -> RecommendationSession.id, NOT NULL)
-	user_id (UUID, FK -> User.id, NOT NULL)  # 게스트 모드 없음
-	place_id (string, NOT NULL)
-	click_position (int, NOT NULL)  # 1~3
-	event_type (enum: card_click|map_open, NOT NULL)
-	created_at (timestamp, NOT NULL)
- Indexes
-	INDEX(session_id)
-	INDEX(place_id, created_at)

## 4. Entities (GeneratedResult: AI Menu Enrichment)
### 4.1 GeneratedResult
- 저장 목적
-	AI로 생성한 대표 메뉴/요약을 재사용하여 비용과 지연을 줄임
- Fields
-	id (UUID, PK)
-	user_id (UUID, FK -> User.id, NULL 가능)  # 개인화 결과라면 저장, 공용 캐시라면 NULL
-	place_id (string, NOT NULL)
-	content (jsonb, NOT NULL)
-		- 대표메뉴: string[] (1~3)
-		- 예상가격대: string 또는 enum
-		- 한줄설명: string
-	prompt_version (string, NOT NULL)
-	model_name (string, NULL 가능)
-	created_at (timestamp, NOT NULL)
-	updated_at (timestamp, NOT NULL)
- Constraints/Indexes
-	UNIQUE(place_id, prompt_version, user_id)  # user_id가 NULL이면 공용 캐시 키로 동작
-	INDEX(place_id, created_at)

## 5. Entities (Optional: Cache)
### 5.1 PlaceSearchCache
- 저장 목적
-	Places 검색 결과를 DB에 저장하는 대신, Redis 캐시가 어려울 때의 대안(또는 보조)
- 권장
-	가능하면 Redis(ElastiCache)를 사용하고, DB 캐시 테이블은 Not decided yet
- Fields (옵션)
-	id (UUID, PK)
-	cache_key (string, UNIQUE, NOT NULL)
-	payload (jsonb, NOT NULL)
-	expires_at (timestamp, NOT NULL)
-	created_at (timestamp, NOT NULL)

## 6. Relationships
- User 1 — 1 UserPreference
- User 1 — N RecommendationSession
- RecommendationSession 1 — N RecommendationClick
- User 1 — N GeneratedResult (개인화 저장 시)
- (공용 캐시) GeneratedResult.user_id = NULL

## 7. Notes / Decisions

| 항목 | 결정 |
|------|------|
| DB 선택 | RDS PostgreSQL (jsonb 지원, 확장성) |
| 게스트 모드 | 미제공 — User 레코드 없이 API 호출 불가, RecommendationSession.user_id NOT NULL로 변경 |
| 제외 태그 저장 타입 | `text[]` (PostgreSQL 네이티브 배열, 쿼리 단순) |

## 8. Open Questions (잔여)
- RecommendationSession/Click 데이터 보관 기간 (90일 / 180일 미결정)
- GeneratedResult의 공용 캐시(user_id=NULL)와 개인화 캐시 병행 여부
