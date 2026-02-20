// GET /PUT /api/user/preferences
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { z } from 'zod'

const PreferenceSchema = z.object({
  excludeTags: z.array(z.string()).default([]),
  defaultRadiusM: z.number().refine((v) => [500, 1000, 2000].includes(v)).default(1000),
  defaultPriceBand: z.enum(['under_10k', '10_15k', 'over_15k']).nullable().default(null),
})

// GET /api/user/preferences
export async function getHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const uid = event.requestContext.authorizer?.uid
  if (typeof uid !== 'string' || uid === '') {
    return { statusCode: 401, body: JSON.stringify({ message: '인증 필요' }) }
  }

  // TODO: DB에서 UserPreference 조회 (없으면 기본값 반환)

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ excludeTags: [], defaultRadiusM: 1000, defaultPriceBand: null }),
  }
}

// PUT /api/user/preferences
export async function putHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const uid = event.requestContext.authorizer?.uid
  if (typeof uid !== 'string' || uid === '') {
    return { statusCode: 401, body: JSON.stringify({ message: '인증 필요' }) }
  }

  let body: unknown
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: '잘못된 JSON' }) }
  }
  const parsed = PreferenceSchema.safeParse(body)

  if (!parsed.success) {
    return { statusCode: 400, body: JSON.stringify({ message: '잘못된 요청' }) }
  }

  // TODO: User 조회 또는 생성 (firebase_uid 기준)
  // TODO: UserPreference upsert

  return { statusCode: 204, body: '' }
}
