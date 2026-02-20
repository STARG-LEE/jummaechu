'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { FilterChip } from '@/components/ui/FilterChip'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { RestaurantCard } from '@/components/ui/RestaurantCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { LocationSelector } from '@/components/ui/LocationSelector'
import type { LocationInfo } from '@/components/ui/LocationSelector'
import type { Radius, PriceBand, ExcludeTag, Restaurant } from '@/types'
import { EXCLUDE_TAG_LABEL, PRICE_BAND_LABEL } from '@/types'

// ── 각 음식점이 포함하는 비선호 태그 매핑 ────────────────────────────
const RESTAURANT_TAGS: Record<string, ExcludeTag[]> = {
  'r-01': ['pork', 'spicy'],
  'r-02': ['seafood', 'raw'],
  'r-03': ['spicy', 'seafood'],
  'r-04': ['beef', 'gluten'],
  'r-05': ['dairy', 'gluten', 'egg'],
  'r-06': ['pork', 'offal'],
  'r-07': ['seafood', 'spicy', 'coriander', 'mala'],
  'r-08': ['seafood', 'gluten'],
  'r-09': ['gluten', 'dairy', 'egg'],
  'r-10': ['beef', 'chicken'],
  'r-11': ['pork', 'spicy'],
  'r-12': ['pork', 'gluten', 'egg'],
  'r-13': ['beef', 'seafood', 'coriander'],
  'r-14': ['gluten', 'spicy'],
  'r-15': ['beef', 'dairy'],
  'r-16': ['dairy', 'spicy', 'nuts'],
  'r-17': ['beef'],
  'r-18': ['seafood', 'raw', 'egg'],
  'r-19': ['chicken', 'gluten'],
  'r-20': ['egg', 'nuts', 'dairy'],
  'r-21': ['beef', 'offal'],
  'r-22': ['pork', 'gluten'],
  'r-23': ['seafood', 'raw'],
  'r-24': ['soy'],
  'r-25': ['gluten', 'dairy', 'egg'],
  'r-26': ['beef', 'offal'],
  'r-27': ['beef', 'seafood', 'coriander'],
  'r-28': ['beef', 'dairy', 'spicy'],
  'r-29': ['seafood', 'raw'],
  'r-30': ['gluten', 'egg', 'dairy'],
}

// ── Mock 데이터 (30개) ────────────────────────────────────────────────
// lat/lng/mapUrl은 recommend() 시점에 사용자 위치 기준으로 동적 계산됨
// distanceM은 사용자 위치 기준 상대 거리 (m) — 필터링 기준값
const MOCK_POOL: Restaurant[] = [
  { placeId: 'r-01', name: '한솥도시락',       lat: 0, lng: 0, category: '한식',       address: '인근 테헤란로', distanceM: 280,  rating: 4.1, userRatingsTotal: 523,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['제육볶음', '순두부찌개', '불고기'],      description: '저렴하고 든든한 도시락 전문점' },
  { placeId: 'r-02', name: '스시 하나',         lat: 0, lng: 0, category: '일식',       address: '인근 골목',     distanceM: 450,  rating: 4.5, userRatingsTotal: 312,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['런치 스시 세트', '연어 덮밥', '우동'],   description: '점심 특선이 합리적인 일식집' },
  { placeId: 'r-03', name: '황금 짬뽕',         lat: 0, lng: 0, category: '중식',       address: '인근 골목',     distanceM: 620,  rating: 4.3, userRatingsTotal: 891,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['짬뽕', '짜장면', '탕수육'],             description: '얼큰하고 시원한 짬뽕 맛집' },
  { placeId: 'r-04', name: '버거킹',            lat: 0, lng: 0, category: '패스트푸드', address: '인근 대로변',   distanceM: 150,  rating: 3.9, userRatingsTotal: 1204, priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['와퍼', '통새우와퍼', '치즈버거'],        description: '빠르고 든든한 버거 한 끼' },
  { placeId: 'r-05', name: '파스타 공방',        lat: 0, lng: 0, category: '양식',       address: '인근 골목',     distanceM: 750,  rating: 4.6, userRatingsTotal: 278,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['크림 파스타', '토마토 파스타', '리조또'], description: '수제 파스타를 합리적인 가격에' },
  { placeId: 'r-06', name: '순대국밥 원조',      lat: 0, lng: 0, category: '한식',       address: '인근 골목',     distanceM: 290,  rating: 4.2, userRatingsTotal: 677,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['순대국밥', '내장국밥', '섞어국밥'],      description: '속을 따뜻하게 채워주는 국밥' },
  { placeId: 'r-07', name: '태국 향기',          lat: 0, lng: 0, category: '아시안',     address: '인근 골목',     distanceM: 510,  rating: 4.4, userRatingsTotal: 189,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['팟타이', '그린 커리', '쏨땀'],           description: '정통 태국 요리를 서울에서' },
  { placeId: 'r-08', name: '명동 칼국수',        lat: 0, lng: 0, category: '한식',       address: '인근 골목',     distanceM: 380,  rating: 4.0, userRatingsTotal: 445,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['바지락 칼국수', '들깨 칼국수', '만두'],   description: '쫄깃한 면발의 칼국수 전문점' },
  { placeId: 'r-09', name: '카페 보나',          lat: 0, lng: 0, category: '카페/브런치', address: '인근 골목',    distanceM: 180,  rating: 4.7, userRatingsTotal: 156,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['에그 샌드위치', 'BLT', '아보카도 토스트'], description: '가볍고 건강한 브런치 메뉴' },
  { placeId: 'r-10', name: '규동 하우스',        lat: 0, lng: 0, category: '일식',       address: '인근 골목',     distanceM: 560,  rating: 4.3, userRatingsTotal: 334,  priceBand: null,        photoUrl: null, mapUrl: '', representativeMenus: ['소고기 규동', '치킨 카츠동', '연어 덮밥'], description: '든든한 일본식 덮밥 전문점' },
  { placeId: 'r-11', name: '김치찌개 본점',      lat: 0, lng: 0, category: '한식',       address: '인근 골목',     distanceM: 120,  rating: 4.4, userRatingsTotal: 1102, priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['김치찌개', '된장찌개', '제육볶음'],      description: '매일 와도 질리지 않는 찌개 맛집' },
  { placeId: 'r-12', name: '도쿄 라멘',          lat: 0, lng: 0, category: '일식',       address: '인근 골목',     distanceM: 340,  rating: 4.2, userRatingsTotal: 567,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['돈코츠 라멘', '쇼유 라멘', '교자'],      description: '진한 육수가 일품인 라멘집' },
  { placeId: 'r-13', name: '베트남 쌀국수',      lat: 0, lng: 0, category: '아시안',     address: '인근 골목',     distanceM: 430,  rating: 4.1, userRatingsTotal: 423,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['소고기 쌀국수', '분짜', '반미'],          description: '가볍고 건강한 베트남 식사' },
  { placeId: 'r-14', name: '분식 천국',          lat: 0, lng: 0, category: '분식',       address: '인근 골목',     distanceM: 200,  rating: 3.8, userRatingsTotal: 889,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['떡볶이', '순대', '튀김'],               description: '추억의 분식 한 접시' },
  { placeId: 'r-15', name: '스테이크 하우스',    lat: 0, lng: 0, category: '양식',       address: '인근 골목',     distanceM: 880,  rating: 4.6, userRatingsTotal: 198,  priceBand: 'over_15k',  photoUrl: null, mapUrl: '', representativeMenus: ['채끝 스테이크', '안심 스테이크', '파스타'], description: '특별한 날을 위한 점심 스테이크' },
  { placeId: 'r-16', name: '인도 카레 하우스',   lat: 0, lng: 0, category: '아시안',     address: '인근 골목',     distanceM: 650,  rating: 4.3, userRatingsTotal: 267,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['버터 치킨 커리', '달 커리', '난'],        description: '향긋하고 깊은 인도 커리' },
  { placeId: 'r-17', name: '평양냉면',           lat: 0, lng: 0, category: '한식',       address: '인근 골목',     distanceM: 310,  rating: 4.5, userRatingsTotal: 743,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['물냉면', '비빔냉면', '만두'],             description: '여름 점심엔 역시 냉면' },
  { placeId: 'r-18', name: '초밥 뷔페 오카',     lat: 0, lng: 0, category: '일식',       address: '인근 골목',     distanceM: 920,  rating: 4.1, userRatingsTotal: 534,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['모둠 초밥', '연어 초밥', '우나동'],       description: '점심 특선 초밥이 실속 있는 곳' },
  { placeId: 'r-19', name: '치킨 마루',          lat: 0, lng: 0, category: '패스트푸드', address: '인근 대로변',   distanceM: 260,  rating: 3.7, userRatingsTotal: 1340, priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['후라이드', '양념치킨', '반반'],           description: '바삭한 치킨 한 마리' },
  { placeId: 'r-20', name: '그린 샐러드 바',     lat: 0, lng: 0, category: '카페/브런치', address: '인근 골목',    distanceM: 140,  rating: 4.5, userRatingsTotal: 213,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['그릭 샐러드', '시저 샐러드', '퀴노아 볼'],  description: '건강한 한 끼, 샐러드 전문점' },
  { placeId: 'r-21', name: '갈비탕 명가',        lat: 0, lng: 0, category: '한식',       address: '인근 골목',     distanceM: 190,  rating: 4.3, userRatingsTotal: 612,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['갈비탕', '설렁탕', '곰탕'],              description: '진한 국물로 속을 채워주는 곳' },
  { placeId: 'r-22', name: '중화 반점',          lat: 0, lng: 0, category: '중식',       address: '인근 골목',     distanceM: 480,  rating: 4.0, userRatingsTotal: 378,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['짜장면', '짬뽕', '볶음밥'],              description: '동네 중국집의 정겨운 맛' },
  { placeId: 'r-23', name: '연어 포케',          lat: 0, lng: 0, category: '카페/브런치', address: '인근 골목',    distanceM: 370,  rating: 4.4, userRatingsTotal: 287,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['연어 포케', '참치 포케', '새우 포케'],    description: '신선한 재료의 하와이안 포케 볼' },
  { placeId: 'r-24', name: '두부 전골 소담',     lat: 0, lng: 0, category: '한식',       address: '인근 골목',     distanceM: 440,  rating: 4.2, userRatingsTotal: 334,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['두부 전골', '순두부찌개', '청국장'],      description: '담백하고 건강한 두부 요리' },
  { placeId: 'r-25', name: '화덕 피자 빌라',     lat: 0, lng: 0, category: '양식',       address: '인근 골목',     distanceM: 800,  rating: 4.3, userRatingsTotal: 412,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['마르게리따', '페퍼로니', '포테이토'],      description: '얇고 바삭한 화덕 피자' },
  { placeId: 'r-26', name: '한우 곱창 전문',     lat: 0, lng: 0, category: '한식',       address: '인근 골목',     distanceM: 550,  rating: 4.4, userRatingsTotal: 556,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['한우 곱창', '대창', '염통'],             description: '점심에도 즐길 수 있는 곱창 전문점' },
  { placeId: 'r-27', name: '하노이 분짜',        lat: 0, lng: 0, category: '아시안',     address: '인근 골목',     distanceM: 470,  rating: 4.1, userRatingsTotal: 298,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['분짜', '쌀국수', '월남쌈'],               description: '베트남 현지 맛 그대로' },
  { placeId: 'r-28', name: '멕시코 타코 바',     lat: 0, lng: 0, category: '양식',       address: '인근 골목',     distanceM: 690,  rating: 4.0, userRatingsTotal: 167,  priceBand: '10_15k',    photoUrl: null, mapUrl: '', representativeMenus: ['비프 타코', '치킨 부리또', '퀘사디아'],   description: '이색적인 멕시칸 점심' },
  { placeId: 'r-29', name: '참치 회전 초밥',     lat: 0, lng: 0, category: '일식',       address: '인근 대로변',   distanceM: 730,  rating: 4.2, userRatingsTotal: 489,  priceBand: 'over_15k',  photoUrl: null, mapUrl: '', representativeMenus: ['참치 대뱃살', '방어', '모둠 초밥'],       description: '신선한 참치가 주인공인 회전 초밥' },
  { placeId: 'r-30', name: '토스트 공방',        lat: 0, lng: 0, category: '카페/브런치', address: '인근 골목',    distanceM: 220,  rating: 4.3, userRatingsTotal: 321,  priceBand: 'under_10k', photoUrl: null, mapUrl: '', representativeMenus: ['에그 토스트', '클럽 토스트', '프렌치토스트'], description: '간단하지만 든든한 토스트 한 끼' },
]

// ── 필터 옵션 ─────────────────────────────────────────────────────────
const RADIUS_OPTIONS: { label: string; value: Radius }[] = [
  { label: '300m', value: 300 },
  { label: '500m', value: 500 },
  { label: '700m', value: 700 },
  { label: '1km',  value: 1000 },
]

const PRICE_OPTIONS: { label: string; value: PriceBand | 'all' }[] = [
  { label: '전체',                        value: 'all' },
  { label: PRICE_BAND_LABEL['under_10k'], value: 'under_10k' },
  { label: PRICE_BAND_LABEL['10_15k'],    value: '10_15k' },
  { label: PRICE_BAND_LABEL['over_15k'],  value: 'over_15k' },
]

const ALL_EXCLUDE_TAGS = Object.keys(EXCLUDE_TAG_LABEL) as ExcludeTag[]

// ── Haversine 거리 계산 (m 단위) ─────────────────────────────────────
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // 지구 반지름 (m)
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── 랭킹: 거리 + 평점 동일 가중치 (PRD §3) ──────────────────────────
function rankRestaurants(list: Restaurant[]): Restaurant[] {
  if (list.length === 0) return []

  const maxDist = Math.max(...list.map((r) => r.distanceM))
  const minDist = Math.min(...list.map((r) => r.distanceM))
  const maxRating = Math.max(...list.map((r) => r.rating))
  const minRating = Math.min(...list.map((r) => r.rating))

  const distRange = maxDist - minDist || 1
  const ratingRange = maxRating - minRating || 1

  return [...list].sort((a, b) => {
    // 거리 점수: 가까울수록 높음 (0~1)
    const scoreDistA = 1 - (a.distanceM - minDist) / distRange
    const scoreDistB = 1 - (b.distanceM - minDist) / distRange
    // 평점 점수: 높을수록 높음 (0~1)
    const scoreRatingA = (a.rating - minRating) / ratingRange
    const scoreRatingB = (b.rating - minRating) / ratingRange
    // 최종 점수: 동일 가중치 0.5 / 0.5
    const scoreA = 0.5 * scoreDistA + 0.5 * scoreRatingA
    const scoreB = 0.5 * scoreDistB + 0.5 * scoreRatingB
    return scoreB - scoreA
  })
}

// ── 기타 제외 키워드가 대표 메뉴에 포함되는지 확인 ────────────────────
function hasCustomExclude(r: Restaurant, excludes: string[]): boolean {
  if (excludes.length === 0) return false
  return r.representativeMenus.some((menu) =>
    excludes.some((excl) => menu.includes(excl)),
  )
}

// ── Fisher-Yates 셔플 후 n개 반환 ────────────────────────────────────
function pickRandom(pool: Restaurant[], n: number): Restaurant[] {
  const arr = [...pool]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, n)
}

type Step = 'filter' | 'loading' | 'results'

// ── 메인 페이지 ───────────────────────────────────────────────────────
export default function RecommendPage() {
  const [step, setStep] = useState<Step>('filter')
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [radius, setRadius] = useState<Radius>(500)
  const [priceBand, setPriceBand] = useState<PriceBand | 'all'>('all')
  const [excludeTags, setExcludeTags] = useState<Set<ExcludeTag>>(new Set())
  // 상위 10개 후보 풀 (다시 추천받기용 캐시)
  const [candidatePool, setCandidatePool] = useState<Restaurant[]>([])
  const [results, setResults] = useState<Restaurant[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  // AI 메뉴 보강 — 현재 로딩 중인 placeId 집합
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set())
  // 다시 추천받기 중복 방지 — 한 번 이상 표시된 placeId 집합
  const [shownIds, setShownIds] = useState<Set<string>>(new Set())
  // 기타 제외 키워드 (자유 입력)
  const [customExcludes, setCustomExcludes] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')

  const toggleTag = (tag: ExcludeTag) => {
    setExcludeTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const addCustomExclude = () => {
    const item = customInput.trim()
    if (!item || customExcludes.includes(item)) {
      setCustomInput('')
      return
    }
    setCustomExcludes((prev) => [...prev, item])
    setCustomInput('')
  }

  // AI 메뉴 보강 — 선택된 3개 음식점에 대해 병렬로 OpenAI 호출
  const enrichMenus = useCallback(async (restaurants: Restaurant[]) => {
    if (restaurants.length === 0) return
    setEnrichingIds(new Set(restaurants.map((r) => r.placeId)))

    await Promise.allSettled(
      restaurants.map(async (r) => {
        try {
          const res = await fetch('/api/menu/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: r.name, category: r.category, address: r.address }),
          })
          if (res.ok) {
            const data = await res.json() as { menus?: string[] }
            const menus = data.menus ?? []
            if (menus.length > 0) {
              // results 및 candidatePool 모두 업데이트
              setResults((prev) =>
                prev.map((item) =>
                  item.placeId === r.placeId ? { ...item, representativeMenus: menus } : item,
                ),
              )
              setCandidatePool((prev) =>
                prev.map((item) =>
                  item.placeId === r.placeId ? { ...item, representativeMenus: menus } : item,
                ),
              )
            }
          }
        } catch {
          // 개별 실패는 무시 — 메뉴 없이 카드 표시 유지
        } finally {
          setEnrichingIds((prev) => {
            const next = new Set(prev)
            next.delete(r.placeId)
            return next
          })
        }
      }),
    )
  }, [])

  const recommend = useCallback(async () => {
    if (!location) return
    setStep('loading')
    setApiError(null)
    setShownIds(new Set()) // 새 검색 시 표시 이력 초기화

    try {
      // 1. Places API (New) — 주변 음식점 검색
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radius: String(radius),
      })
      const res = await fetch(`/api/places/search?${params}`)
      const data: { restaurants?: Restaurant[]; message?: string } = await res.json()

      if (!res.ok) {
        setApiError(data.message ?? '음식점 검색에 실패했어요.')
        setStep('filter')
        return
      }

      let filtered: Restaurant[] = data.restaurants ?? []

      // 2. 가격대 필터 (null = 정보 없음 → 포함하되 후순위)
      if (priceBand !== 'all') {
        filtered = filtered.filter((r) => r.priceBand === priceBand || r.priceBand === null)
      }

      // 3. 랭킹 (거리 + 평점 0.5/0.5), 가격 정보 없는 곳 후순위 정렬
      const ranked = rankRestaurants(filtered)
      if (priceBand !== 'all') {
        ranked.sort((a, b) => {
          if (a.priceBand === null && b.priceBand !== null) return 1
          if (a.priceBand !== null && b.priceBand === null) return -1
          return 0
        })
      }

      // 4. 전체 후보 풀 캐싱 (최대 20개) → 무작위 3개 선택
      const pool = ranked
      const picked = pickRandom(pool, Math.min(3, pool.length))
      setCandidatePool(pool)
      setResults(picked)
      setShownIds(new Set(picked.map((r) => r.placeId)))
      setStep('results')

      // 5. 선택된 3곳 메뉴를 AI로 비동기 보강 (완료까지 대기)
      await enrichMenus(picked)

      // 6. 메뉴 보강 완료 후 기타 제외 키워드 필터 적용
      if (customExcludes.length > 0) {
        setResults((prev) => {
          const valid = prev.filter((r) => !hasCustomExclude(r, customExcludes))
          if (valid.length === prev.length) return prev
          // 제외된 자리를 후보 풀에서 대체
          const usedIds = new Set(prev.map((r) => r.placeId))
          const replacements = pool
            .filter((r) => !usedIds.has(r.placeId) && !hasCustomExclude(r, customExcludes))
            .slice(0, prev.length - valid.length)
          return [...valid, ...replacements]
        })
      }
    } catch {
      setApiError('네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      setStep('filter')
    }
  }, [location, radius, priceBand, enrichMenus, customExcludes])

  // 다시 추천받기: 이미 보여준 곳 및 기타 제외 키워드 필터 후 셔플
  const reshuffle = useCallback(() => {
    const available = candidatePool.filter(
      (r) => !shownIds.has(r.placeId) && !hasCustomExclude(r, customExcludes),
    )
    if (available.length === 0) return
    const picked = pickRandom(available, Math.min(3, available.length))
    setShownIds((prev) => {
      const next = new Set(prev)
      picked.forEach((r) => next.add(r.placeId))
      return next
    })
    setResults(picked)
    enrichMenus(picked.filter((r) => r.representativeMenus.length === 0))
  }, [candidatePool, shownIds, customExcludes, enrichMenus])

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
      <Header />

      {/* ── 필터 단계 ─────────────────────────────────────── */}
      {step === 'filter' && (
        <main className="max-w-[480px] mx-auto px-4 py-6 pb-28 space-y-6">
          <LocationSelector value={location} onChange={setLocation} />

          <section className="space-y-3">
            <h2 className="text-[17px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">반경</h2>
            <SegmentedControl options={RADIUS_OPTIONS} value={radius} onChange={setRadius} />
          </section>

          <section className="space-y-3">
            <h2 className="text-[17px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">가격대</h2>
            <SegmentedControl options={PRICE_OPTIONS} value={priceBand} onChange={setPriceBand} />
          </section>

          <section className="space-y-3">
            <h2 className="text-[17px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
              못 먹거나 싫어하는 음식
            </h2>
            <div className="flex flex-wrap gap-2">
              {ALL_EXCLUDE_TAGS.map((tag) => (
                <FilterChip
                  key={tag}
                  label={EXCLUDE_TAG_LABEL[tag]}
                  selected={excludeTags.has(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>
            {/* 기타 직접 입력 */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomExclude() }}
                  placeholder="기타 직접 입력 (예: 제육볶음, 고수)"
                  className="flex-1 px-3 py-2.5 bg-[#F5F5F4] dark:bg-[#292524] rounded-[10px] text-[14px] text-[#1C1917] dark:text-[#FAFAF9] placeholder-[#D6D3D1] dark:placeholder-[#57534E] outline-none focus:ring-2 focus:ring-[#F97316]"
                />
                <button
                  onClick={addCustomExclude}
                  disabled={!customInput.trim()}
                  className="px-4 py-2.5 bg-[#F5F5F4] dark:bg-[#292524] disabled:opacity-40 text-[#78716C] dark:text-[#A8A29E] rounded-[10px] text-[14px] font-medium transition-colors hover:text-[#1C1917] dark:hover:text-[#FAFAF9]"
                >
                  추가
                </button>
              </div>
              {customExcludes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {customExcludes.map((item) => (
                    <span
                      key={item}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#FEF2F2] dark:bg-[#1C0A0A] border border-[#FECACA] dark:border-[#7F1D1D] rounded-full text-[13px] text-[#EF4444] font-medium"
                    >
                      {item}
                      <button
                        onClick={() => setCustomExcludes((prev) => prev.filter((e) => e !== item))}
                        className="text-[#EF4444]/60 hover:text-[#EF4444] leading-none ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-[#FAFAF9]/90 dark:bg-[#0C0A09]/90 backdrop-blur-sm border-t border-[#E7E5E4] dark:border-[#44403C]">
            <div className="max-w-[480px] mx-auto space-y-2">
              {apiError && (
                <p className="text-[13px] text-[#EF4444] text-center px-1">{apiError}</p>
              )}
              <PrimaryButton onClick={recommend} disabled={!location}>
                {location ? '추천받기 →' : '위치를 먼저 설정해주세요'}
              </PrimaryButton>
            </div>
          </div>
        </main>
      )}

      {/* ── 로딩 단계 ─────────────────────────────────────── */}
      {step === 'loading' && (
        <main className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
          <p className="text-[14px] text-[#78716C] dark:text-[#A8A29E] text-center">
            주변 식당을 찾고 있어요...
          </p>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </main>
      )}

      {/* ── 결과 단계 ─────────────────────────────────────── */}
      {step === 'results' && (
        <main className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <span className="text-5xl">🍽️</span>
              <h2 className="text-[17px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
                조건에 맞는 식당이 없어요
              </h2>
              <p className="text-[14px] text-[#78716C] dark:text-[#A8A29E]">
                반경을 넓히거나 필터를 줄여보세요
              </p>
              <button
                onClick={() => setStep('filter')}
                className="mt-2 h-[52px] px-8 rounded-[12px] bg-[#F97316] hover:bg-[#EA580C] text-white text-[15px] font-semibold transition-colors"
              >
                조건 다시 설정
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-[24px] font-bold text-[#1C1917] dark:text-[#FAFAF9]">
                  오늘 여기 어때요?
                </h1>
                <span className="text-[12px] text-[#78716C] dark:text-[#A8A29E]">
                  후보 {candidatePool.length}곳 중
                </span>
              </div>

              <div className="space-y-3">
                {results.map((r) => (
                  <RestaurantCard
                    key={r.placeId}
                    restaurant={r}
                    menuLoading={enrichingIds.has(r.placeId)}
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 pt-2">
                {candidatePool.filter((r) => !shownIds.has(r.placeId)).length > 0 ? (
                  <button
                    onClick={reshuffle}
                    className="text-[15px] text-[#78716C] dark:text-[#A8A29E] hover:text-[#F97316] dark:hover:text-[#F97316] transition-colors"
                  >
                    🔄 다시 추천받기
                  </button>
                ) : (
                  <p className="text-[13px] text-[#A8A29E] dark:text-[#57534E]">
                    주변 후보를 모두 확인했어요. 반경을 넓혀보세요.
                  </p>
                )}
                <button
                  onClick={() => setStep('filter')}
                  className="text-[14px] text-[#78716C] dark:text-[#A8A29E] underline"
                >
                  조건 다시 설정
                </button>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  )
}
