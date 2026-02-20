// GET /api/places/search
// architecture.md §5 API Design 기반

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { z } from 'zod'
import { applyExcludeFilter } from '../../services/filterService'
import { rankAndPick } from '../../services/rankingService'
import type { ExcludeTag, PriceBand, Radius } from '../../types'

const QuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().refine((v): v is Radius => [500, 1000, 2000].includes(v)),
  price_band: z.enum(['under_10k', '10_15k', 'over_15k']).optional(),
  exclude_tags: z.string().optional(),  // 콤마 구분 문자열
})

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const parsed = QuerySchema.safeParse(event.queryStringParameters ?? {})
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify({ message: '잘못된 요청 파라미터' }) }
    }

    const { lat, lng, radius, price_band, exclude_tags } = parsed.data
    const excludeTags = (exclude_tags?.split(',').filter(Boolean) ?? []) as ExcludeTag[]

    // TODO: Redis 캐시 확인 → 미스 시 Google Places API 호출
    // TODO: priceBand 필터 적용
    // TODO: filterService.applyExcludeFilter 적용
    // TODO: rankingService.rankAndPick으로 상위 3개 선정
    // TODO: 상위 3개에 대해 /api/menu/enrich 자동 호출
    // TODO: RecommendationSession DB 저장

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurants: [] }),  // placeholder
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ message: '서버 오류' }) }
  }
}
