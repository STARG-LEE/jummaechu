import { NextRequest, NextResponse } from 'next/server'

// ── OpenAI gpt-4o-mini를 이용한 대표 메뉴 생성 ────────────────────────
export async function POST(request: NextRequest) {
  let body: { name?: string; category?: string; address?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: '잘못된 요청 형식이에요.' }, { status: 400 })
  }

  const { name, category, address } = body
  if (!name || !category) {
    return NextResponse.json({ message: '음식점 정보가 필요합니다.' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ message: 'AI 서비스 키가 설정되지 않았어요.' }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '당신은 한국 음식점 메뉴 전문가입니다. 주어진 음식점의 대표 메뉴 3~5개를 알려주세요. ' +
              '음식점 이름과 카테고리를 참고해서 실제 가능성이 높은 메뉴를 추려주세요. ' +
              '반드시 다음 JSON 형식으로만 응답하세요: {"menus": ["메뉴1", "메뉴2", "메뉴3"]}',
          },
          {
            role: 'user',
            content: [
              `음식점명: ${name}`,
              `카테고리: ${category}`,
              address ? `주소: ${address}` : '',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0.3,
      }),
    })
  } catch (err) {
    console.error('[Menu Enrich] 네트워크 오류:', err)
    return NextResponse.json({ message: 'AI 서비스 연결 오류가 발생했어요.' }, { status: 502 })
  }

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[Menu Enrich] OpenAI 오류:', errorText)
    return NextResponse.json({ message: 'AI 메뉴 생성에 실패했어요.' }, { status: 502 })
  }

  const data = await res.json()
  let menus: string[] = []
  try {
    const content: string = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content) as { menus?: unknown }
    menus = Array.isArray(parsed.menus) ? (parsed.menus as string[]).slice(0, 5) : []
  } catch {
    console.error('[Menu Enrich] 응답 파싱 오류:', data)
    menus = []
  }

  return NextResponse.json({ menus })
}
