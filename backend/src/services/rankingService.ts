// 랭킹 서비스 — 거리 + 평점 동일 가중치
// architecture.md §9 Decisions: 정규화 후 합산, 상수로 분리

import type { PlaceRaw } from '../types'

// 가중치 상수 — 추후 조정 시 여기만 수정
const WEIGHT = {
  distance: 0.5,
  rating: 0.5,
} as const

/**
 * 거리(가까울수록 높음) + 평점(높을수록 높음) 점수로 정렬 후 상위 3개 반환
 */
export function rankAndPick(places: PlaceRaw[], topN = 3): PlaceRaw[] {
  if (places.length <= topN) return places

  const maxDistance = Math.max(...places.map((p) => p.distanceM))
  const maxRating = 5  // Google 평점 최대값

  const scored = places.map((place) => {
    const distanceScore = 1 - place.distanceM / maxDistance   // 가까울수록 1에 가까움
    const ratingScore = place.rating / maxRating               // 높을수록 1에 가까움

    const totalScore =
      distanceScore * WEIGHT.distance + ratingScore * WEIGHT.rating

    return { place, totalScore }
  })

  return scored
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, topN)
    .map((s) => s.place)
}
