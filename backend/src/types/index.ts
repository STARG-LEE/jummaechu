// ─── 필터 타입 ────────────────────────────────────────────────────

export type Radius = 500 | 1000 | 2000
export type PriceBand = 'under_10k' | '10_15k' | 'over_15k'
export type ExcludeTag =
  | 'spicy' | 'raw' | 'coriander' | 'offal'
  | 'mala' | 'dairy' | 'gluten' | 'pork' | 'seafood'

// ─── Places API 관련 타입 ─────────────────────────────────────────

export interface PlaceSearchParams {
  lat: number
  lng: number
  radius: Radius
  priceBand: PriceBand | null
  excludeTags: ExcludeTag[]
}

export interface PlaceRaw {
  placeId: string
  name: string
  types: string[]
  rating: number
  userRatingsTotal: number
  priceLevel: number | null   // Google 0~4
  distanceM: number
  address: string
  photoReference: string | null
}

// Google Places types[] → RestaurantCategory 매핑 (frontend와 일치)
export type RestaurantCategory =
  | '한식' | '중식' | '일식' | '양식'
  | '분식' | '아시안' | '패스트푸드' | '카페/브런치'

export interface PlaceResult extends PlaceRaw {
  category: RestaurantCategory   // types[] 기반으로 변환 (filterService의 TAG_RULES 활용)
  priceBand: PriceBand | null    // price_level → price_band 변환
  mapUrl: string
  photoUrl: string | null
  // AI 메뉴 보강 결과
  representativeMenus: string[]
  description: string | null
}

// ─── AI Enrich 관련 타입 ─────────────────────────────────────────

export interface EnrichRequest {
  placeId: string
  name: string
  types: string[]
}

export interface EnrichResult {
  menus: string[]       // 대표 메뉴 1~3개
  description: string   // 한 줄 설명
}

// ─── 사용자 설정 타입 ─────────────────────────────────────────────

export interface UserPreferenceData {
  excludeTags: ExcludeTag[]
  defaultRadiusM: Radius
  defaultPriceBand: PriceBand | null
}
