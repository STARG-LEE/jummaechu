# Benchmark — 점심 메뉴 추천 서비스 '점메추'

## 1. Purpose
- 목표
-	Claude(또는 구현자)가 “추측”하지 않고 “복사/참조”할 수 있도록, 유사 서비스와 UX 패턴을 레퍼런스로 모은다.
- 사용 방식
-	각 항목은 반드시 URL과 캡처(스크린샷) 또는 화면 흐름 요약을 포함한다.
-	우리 서비스와 정확히 동일하지 않아도 된다.
-	다만 “어떤 요소를 가져올지”를 명시한다.

## 2. What to include (Checklist)
- Similar services
-	위치 기반 주변 음식점 추천
-	필터(가격/거리/취향) + 결과 카드 UI
-	지도/길찾기 딥링크
-	Screenshots
-	메인 화면
-	필터 패널/모달
-	결과 리스트/카드
-	상세 페이지(있다면)
-	URL
-	가능하면 웹/모바일 웹 둘 다
-	로그인/설정 저장이 있는지 여부
-	UX patterns you like
-	권한 요청(Geolocation)
-	필터 입력 UX(칩, 토글, 슬라이더)
-	추천 결과(3개 고정 vs 스크롤 리스트)
-	빈 상태/에러 상태
-	재추천(Shuffle/Refresh) 동선

## 3. Benchmarks (List)
- 작성 규칙
-	“비슷한 서비스”가 아니더라도, 참고할 UX가 있으면 포함한다.
-	각 항목에 “What we copy”를 1~3줄로 적는다.

### 3.1 Similar-ish service (Random Menu Picker)
- Type
-	메뉴 랜덤 추천(주변 음식점/지도 기반은 아님)
- Why include
-	추천 버튼/재추천(Shuffle) 동선, 결과 카드 표현 방식 참고 가능
- URL
-	TBD (사용자가 제공 예정)
- Screenshots
-	TBD (메인/결과/설정 화면)
- UX notes
-	What we copy:
-		- 재추천 버튼의 위치/모션
-		- 결과 노출 방식(카드/애니메이션)
-	What we avoid:
-		- 위치 기반/필터 부재로 인해 우리 핵심 흐름과 다름

### 3.2 Nearby Restaurant Recommendation (Template)
- Type
-	위치 기반 주변 음식점 추천
- URL
-	TBD
- Screenshots
-	TBD
- UX notes
-	What we copy:
-		- 반경 선택 UI
-		- 결과 카드에서 거리/평점/가격대 표시 방식
-	What we avoid:
-		- 광고/과도한 회원가입 강제

### 3.3 Map-first Experience (Template)
- Type
-	지도 중심 탐색(리스트+지도 동기화)
- URL
-	TBD
- Screenshots
-	TBD
- UX notes
-	What we copy:
-		- 지도/리스트 전환
-		- 핀 선택 시 카드 슬라이드
-	What we avoid:
-		- 추천 3개 고정 UX와 충돌하는 과도한 탐색 흐름

## 4. UX Pattern Library (우리가 원하는 패턴만 모아두는 섹션)
### 4.1 Location Permission Prompt
- Pattern
-	권한 요청 전 “왜 필요한지” 1문장 설명 → 허용 유도
- Reference URL
-	TBD
- Screenshot
-	TBD
- Copy spec (우리가 가져올 문구/레이아웃)
-	TBD

### 4.2 Filter UI (Exclude tags)
- Pattern
-	칩(Chip) 기반 다중 선택 + “선택 요약” 한 줄
- Reference URL
-	TBD
- Screenshot
-	TBD
- Copy spec
-	TBD

### 4.3 Results (Top 3 Cards)
- Pattern
-	3개 카드 고정 + “다시 추천” + “지도 열기”
- Reference URL
-	TBD
- Screenshot
-	TBD
- Copy spec
-	TBD

### 4.4 Empty / Error States
- Pattern
-	결과 없음: 필터 완화 CTA 제공
-	위치 거부: 수동 위치 입력(옵션) 또는 안내
- Reference URL
-	TBD
- Screenshot
-	TBD
- Copy spec
-	TBD

## 5. How to use this file with Claude (운영 규칙)
- 새 기능을 설계할 때
-	먼저 이 문서에서 “비슷한 UI”를 찾아 링크/스크린샷을 함께 붙인다.
- 프롬프트에 넣을 때(권장 포맷)
-	- “아래 레퍼런스처럼 필터 패널을 만들고 싶다”
-	- URL + 스크린샷 + 우리가 가져올 요소(What we copy) 3줄
- 업데이트 규칙
-	레퍼런스 추가 시 반드시 “What we copy/avoid”를 함께 작성한다.

## 6. Next Inputs Needed
- 사용자가 제공할 랜덤 메뉴 추천 사이트 URL 1개
- 스크린샷 2~4장(메인/추천결과/설정)
- 추가로 벤치마크할 “지도/필터/카드 UI”가 좋은 사이트 2~3개 URL
