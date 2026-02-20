// POST /api/menu/enrich — AI 대표 메뉴 보강 (기본 제공, 추천 시 자동 실행)
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { z } from 'zod'

const BodySchema = z.object({
  placeId: z.string(),
  name: z.string(),
  types: z.array(z.string()),
})

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: '잘못된 JSON' }) }
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return { statusCode: 400, body: JSON.stringify({ message: '잘못된 요청' }) }
  }

  const { placeId, name, types } = parsed.data

  // TODO: GeneratedResult DB에 캐시 확인 (TTL 7~30일, prompt_version 포함)
  // TODO: 캐시 미스 시 AI API 호출
  //   - 프롬프트: 음식점명 + types 기반으로 대표 메뉴 1~3개 + 한 줄 설명 요청
  // TODO: 결과 DB 캐시 저장

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menus: [], description: null }),  // placeholder
  }
}
