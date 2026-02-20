// GET /api/places/details
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { z } from 'zod'

const QuerySchema = z.object({
  place_id: z.string().min(1),
})

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const parsed = QuerySchema.safeParse(event.queryStringParameters ?? {})
  if (!parsed.success) {
    return { statusCode: 400, body: JSON.stringify({ message: '잘못된 요청 파라미터' }) }
  }

  // TODO: Redis 캐시 확인 (TTL 1~7일)
  // TODO: Google Places Details API 호출
  // TODO: 결과 캐시 저장

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),  // placeholder
  }
}
