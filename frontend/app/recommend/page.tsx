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
  const R = 6371000
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
    const scoreDistA = 1 - (a.distanceM - minDist) / distRange
    const scoreDistB = 1 - (b.distanceM - minDist) / distRange
    const scoreRatingA = (a.rating - minRating) / ratingRange
    const scoreRatingB = (b.rating - minRating) / ratingRange
    return (0.5 * scoreDistB + 0.5 * scoreRatingB) - (0.5 * scoreDistA + 0.5 * scoreRatingA)
  })
}

// ── 가중치 랜덤 선택 ──────────────────────────────────────────────────
// 싫어요 횟수가 많은 카테고리는 선택 확률이 낮아짐 (최솟값 0.1 — 완전 배제 방지)
function pickWeighted(
  pool: Restaurant[],
  shown: Set<string>,
  dislikedCats: Record<string, number>,
): Restaurant | null {
  const available = pool.filter((r) => !shown.has(r.placeId) && !r.excluded)
  if (available.length === 0) return null

  const weights = available.map((r) =>
    Math.max(0.1, 1 / (1 + (dislikedCats[r.category] ?? 0) * 0.7)),
  )
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < available.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return available[i]
  }
  return available[available.length - 1]
}

type Step = 'filter' | 'loading' | 'tinder' | 'empty'

// ── 메인 페이지 ───────────────────────────────────────────────────────
export default function RecommendPage() {
  const [step, setStep] = useState<Step>('filter')
  const [location, setLocation] = useState<LocationInfo | null>(null)
  const [radius, setRadius] = useState<Radius>(500)
  const [priceBand, setPriceBand] = useState<PriceBand | 'all'>('all')
  const [excludeTags, setExcludeTags] = useState<Set<ExcludeTag>>(new Set())
  const [customExcludes, setCustomExcludes] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')

  const [candidatePool, setCandidatePool] = useState<Restaurant[]>([])
  const [currentCard, setCurrentCard] = useState<Restaurant | null>(null)
  const [shownIds, setShownIds] = useState<Set<string>>(new Set())
  // 카테고리별 싫어요 횟수 → 가중치 랜덤 선택에 사용
  const [dislikedCategories, setDislikedCategories] = useState<Record<string, number>>({})
  // AI 메뉴 보강 중인 placeId 집합
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set())
  const [apiError, setApiError] = useState<string | null>(null)

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

  // AI 메뉴 보강 — 1장씩 호출, currentCard + candidatePool 동기화
  const enrichMenus = useCallback(async (restaurants: Restaurant[]) => {
    if (restaurants.length === 0) return
    setEnrichingIds(new Set(restaurants.map((r) => r.placeId)))

    await Promise.allSettled(
      restaurants.map(async (r) => {
        try {
          const res = await fetch('/api/menu/enrich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: r.name,
              category: r.category,
              address: r.address,
              excludeKeywords: customExcludes.length > 0 ? customExcludes : undefined,
            }),
          })
          if (res.ok) {
            const data = await res.json() as { menus?: string[]; tags?: ExcludeTag[]; excluded?: boolean }
            const menus = data.menus ?? []
            const tags = data.tags ?? []
            const excluded = data.excluded ?? false
            setCurrentCard((prev) =>
              prev?.placeId === r.placeId ? { ...prev, representativeMenus: menus, tags, excluded } : prev,
            )
            setCandidatePool((prev) =>
              prev.map((item) =>
                item.placeId === r.placeId ? { ...item, representativeMenus: menus, tags, excluded } : item,
              ),
            )
          }
        } catch {
          // 개별 실패 무시
        } finally {
          setEnrichingIds((prev) => {
            const next = new Set(prev)
            next.delete(r.placeId)
            return next
          })
        }
      }),
    )
  }, [customExcludes])

  const recommend = useCallback(async () => {
    if (!location) return
    setStep('loading')
    setApiError(null)
    setShownIds(new Set())
    setDislikedCategories({})

    try {
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

      // 가격대 필터 (null = 정보 없음 → 포함하되 후순위)
      if (priceBand !== 'all') {
        filtered = filtered.filter((r) => r.priceBand === priceBand || r.priceBand === null)
      }

      // 랭킹 후 가격 정보 없는 곳 후순위
      const ranked = rankRestaurants(filtered)
      if (priceBand !== 'all') {
        ranked.sort((a, b) => {
          if (a.priceBand === null && b.priceBand !== null) return 1
          if (a.priceBand !== null && b.priceBand === null) return -1
          return 0
        })
      }

      setCandidatePool(ranked)

      const first = pickWeighted(ranked, new Set(), {})
      if (!first) {
        setApiError('주변에 음식점이 없어요.')
        setStep('filter')
        return
      }

      setCurrentCard(first)
      setShownIds(new Set([first.placeId]))
      setStep('tinder')
      enrichMenus([first])
    } catch {
      setApiError('네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      setStep('filter')
    }
  }, [location, radius, priceBand, enrichMenus])

  // 좋아요 — Google Maps 열고 다음 카드
  const handleLike = useCallback(() => {
    if (!currentCard) return
    window.open(currentCard.mapUrl, '_blank')
    const newShown = new Set([...shownIds, currentCard.placeId])
    setShownIds(newShown)
    const next = pickWeighted(candidatePool, newShown, dislikedCategories)
    if (next) {
      setCurrentCard(next)
      enrichMenus([next])
    } else {
      setStep('empty')
    }
  }, [currentCard, shownIds, dislikedCategories, candidatePool, enrichMenus])

  // 싫어요 — 카테고리 가중치 낮추고 다음 카드
  const handleDislike = useCallback(() => {
    if (!currentCard) return
    const newDislikedCats = {
      ...dislikedCategories,
      [currentCard.category]: (dislikedCategories[currentCard.category] ?? 0) + 1,
    }
    const newShown = new Set([...shownIds, currentCard.placeId])
    setDislikedCategories(newDislikedCats)
    setShownIds(newShown)
    const next = pickWeighted(candidatePool, newShown, newDislikedCats)
    if (next) {
      setCurrentCard(next)
      enrichMenus([next])
    } else {
      setStep('empty')
    }
  }, [currentCard, shownIds, dislikedCategories, candidatePool, enrichMenus])

  // 남은 카드 수 (excluded 제외)
  const remaining = candidatePool.filter((r) => !shownIds.has(r.placeId) && !r.excluded).length

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
        </main>
      )}

      {/* ── 틴더 단계 ─────────────────────────────────────── */}
      {step === 'tinder' && currentCard && (
        <main className="max-w-[480px] mx-auto px-4 py-6 space-y-4">
          {/* 상단 상태 표시 */}
          <div className="flex items-center justify-between text-[13px] text-[#78716C] dark:text-[#A8A29E]">
            <button
              onClick={() => setStep('filter')}
              className="underline hover:text-[#1C1917] dark:hover:text-[#FAFAF9] transition-colors"
            >
              조건 변경
            </button>
            <span>{remaining}곳 남음</span>
          </div>

          {/* 식당 카드 */}
          <RestaurantCard
            restaurant={currentCard}
            menuLoading={enrichingIds.has(currentCard.placeId)}
          />

          {/* 싫어요 / 좋아요 버튼 */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleDislike}
              className="flex-1 h-[56px] rounded-[14px] bg-[#F5F5F4] dark:bg-[#292524] text-[#78716C] dark:text-[#A8A29E] text-[17px] font-semibold hover:bg-[#E7E5E4] dark:hover:bg-[#3C3837] active:scale-95 transition-all"
            >
              ✕
            </button>
            <button
              onClick={handleLike}
              className="flex-1 h-[56px] rounded-[14px] bg-[#F97316] hover:bg-[#EA580C] text-white text-[17px] font-semibold active:scale-95 transition-all"
            >
              ❤️ 지도 열기
            </button>
          </div>

          {/* 싫어요 피드백 — 어떤 카테고리를 덜 추천하는지 표시 */}
          {Object.keys(dislikedCategories).length > 0 && (
            <p className="text-[12px] text-[#A8A29E] dark:text-[#57534E] text-center">
              {Object.entries(dislikedCategories)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cat]) => cat)
                .join(', ')} 덜 추천 중
            </p>
          )}
        </main>
      )}

      {/* ── 풀 소진 단계 ───────────────────────────────────── */}
      {step === 'empty' && (
        <main className="max-w-[480px] mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
          <span className="text-5xl">🍽️</span>
          <h2 className="text-[17px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
            주변 식당을 모두 봤어요
          </h2>
          <p className="text-[14px] text-[#78716C] dark:text-[#A8A29E]">
            반경을 넓히거나 조건을 바꿔보세요
          </p>
          <button
            onClick={() => setStep('filter')}
            className="mt-2 h-[52px] px-8 rounded-[12px] bg-[#F97316] hover:bg-[#EA580C] text-white text-[15px] font-semibold transition-colors"
          >
            조건 다시 설정
          </button>
        </main>
      )}
    </div>
  )
}
