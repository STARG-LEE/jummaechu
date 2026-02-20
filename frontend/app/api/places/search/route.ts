import { NextRequest, NextResponse } from 'next/server'
import type { Restaurant, PriceBand, RestaurantCategory } from '@/types'

// ── 카테고리 매핑 ─────────────────────────────────────────────────────
function mapCategory(types: string[]): RestaurantCategory {
  if (types.some((t) => ['korean_restaurant'].includes(t))) return '한식'
  if (types.some((t) => ['chinese_restaurant'].includes(t))) return '중식'
  if (types.some((t) => ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant'].includes(t))) return '일식'
  if (types.some((t) => ['pizza_restaurant', 'italian_restaurant', 'american_restaurant', 'steak_house', 'french_restaurant'].includes(t))) return '양식'
  if (types.some((t) => ['fast_food_restaurant', 'hamburger_restaurant'].includes(t))) return '패스트푸드'
  if (types.some((t) => ['cafe', 'coffee_shop', 'brunch_restaurant', 'sandwich_shop'].includes(t))) return '카페/브런치'
  if (types.some((t) => ['vietnamese_restaurant', 'thai_restaurant', 'indian_restaurant', 'asian_restaurant', 'southeast_asian_restaurant'].includes(t))) return '아시안'
  return '한식' // 기본값
}

// ── 가격대 매핑 (Places API New → PriceBand) ─────────────────────────
function mapPriceBand(priceLevel?: string): PriceBand | null {
  if (priceLevel === 'PRICE_LEVEL_INEXPENSIVE') return 'under_10k'
  if (priceLevel === 'PRICE_LEVEL_MODERATE') return '10_15k'
  if (priceLevel === 'PRICE_LEVEL_EXPENSIVE' || priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') return 'over_15k'
  return null
}

// ── Haversine 거리 계산 (m) ───────────────────────────────────────────
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Places API (New) 응답 타입 ────────────────────────────────────────
interface PlaceResult {
  id?: string
  displayName?: { text: string; languageCode: string }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  location?: { latitude: number; longitude: number }
  shortFormattedAddress?: string
  types?: string[]
  editorialSummary?: { text: string }
  photos?: { name: string }[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radius = parseInt(searchParams.get('radius') ?? '500')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ message: '위치 정보가 필요합니다.' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ message: 'API 키가 설정되지 않았어요.' }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.location',
          'places.shortFormattedAddress',
          'places.types',
          'places.editorialSummary',
          'places.photos',
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes: ['restaurant'],
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
        maxResultCount: 20,
        languageCode: 'ko',
      }),
    })
  } catch (err) {
    console.error('[Places API] 네트워크 오류:', err)
    return NextResponse.json({ message: '음식점 검색 중 네트워크 오류가 발생했어요.' }, { status: 502 })
  }

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[Places API] 오류 응답:', errorText)
    return NextResponse.json({ message: '음식점 검색에 실패했어요. API 키를 확인해주세요.' }, { status: 502 })
  }

  const data: { places?: PlaceResult[] } = await res.json()
  const places = data.places ?? []

  const restaurants: Restaurant[] = places.map((place) => {
    const rLat = place.location?.latitude ?? lat
    const rLng = place.location?.longitude ?? lng
    return {
      placeId: place.id ?? '',
      name: place.displayName?.text ?? '(이름 없음)',
      category: mapCategory(place.types ?? []),
      address: place.shortFormattedAddress ?? '',
      lat: rLat,
      lng: rLng,
      distanceM: Math.round(haversineDistance(lat, lng, rLat, rLng)),
      rating: place.rating ?? 0,
      userRatingsTotal: place.userRatingCount ?? 0,
      priceBand: mapPriceBand(place.priceLevel),
      photoUrl: place.photos?.[0]?.name
        ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=400&key=${apiKey}`
        : null,
      // Place ID가 있으면 실제 음식점 페이지로, 없으면 좌표 핀으로
      mapUrl: place.id
        ? `https://www.google.com/maps/place/?q=place_id:${place.id}`
        : `https://maps.google.com/?q=${rLat},${rLng}`,
      representativeMenus: [], // Phase 3 — AI 메뉴 보강 시 추가
      description: place.editorialSummary?.text ?? null,
    }
  })

  return NextResponse.json({ restaurants })
}
