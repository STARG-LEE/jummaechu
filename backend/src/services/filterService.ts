// 비선호 음식 필터링 서비스
// PRD §3-2 핵심기능2, architecture.md §4 Step4 기반

import type { PlaceRaw, ExcludeTag } from '../types'

// 각 ExcludeTag가 매핑되는 Google Places types 및 키워드
const TAG_RULES: Record<ExcludeTag, { types: string[]; keywords: string[] }> = {
  spicy: {
    types: [],
    keywords: ['마라탕', '불닭', '엽기', '매운', '화끈', '청양'],
  },
  raw: {
    types: ['sushi_restaurant'],
    keywords: ['초밥', '회', '생선회', '사시미', '오마카세'],
  },
  coriander: {
    types: ['thai_restaurant', 'vietnamese_restaurant'],
    keywords: ['고수', '쌀국수', '팟타이'],
  },
  offal: {
    types: [],
    keywords: ['곱창', '막창', '대창', '순대', '내장'],
  },
  mala: {
    types: [],
    keywords: ['마라', '훠궈', '마라탕', '마라샹궈'],
  },
  dairy: {
    types: [],
    keywords: ['치즈', '크림', '버터', '우유'],
  },
  gluten: {
    types: [],
    keywords: ['우동', '라멘', '파스타', '피자', '빵'],
  },
  pork: {
    types: [],
    keywords: ['삼겹살', '돼지', '돈까스', '돈카츠', '제육'],
  },
  seafood: {
    types: ['seafood_restaurant'],
    keywords: ['해산물', '조개', '굴', '새우', '게', '랍스터'],
  },
}

/**
 * 비선호 태그 기반으로 식당 목록 필터링
 * "비선호 음식만 판매하는 곳"만 제외 — PRD 알고리즘 기준
 */
export function applyExcludeFilter(
  places: PlaceRaw[],
  excludeTags: ExcludeTag[],
): PlaceRaw[] {
  if (excludeTags.length === 0) return places

  return places.filter((place) => !isExcluded(place, excludeTags))
}

function isExcluded(place: PlaceRaw, excludeTags: ExcludeTag[]): boolean {
  const nameLower = place.name.toLowerCase()

  return excludeTags.some((tag) => {
    const rule = TAG_RULES[tag]
    const typeMatch = rule.types.some((t) => place.types.includes(t))
    const keywordMatch = rule.keywords.some((kw) => nameLower.includes(kw))
    return typeMatch || keywordMatch
  })
}
