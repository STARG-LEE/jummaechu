import { NextRequest, NextResponse } from 'next/server'

// ── OpenAI gpt-4o-mini를 이용한 대표 메뉴 + 태그 + 제외 판정 ────────────
export async function POST(request: NextRequest) {
  let body: {
    name?: string
    category?: string
    address?: string
    excludeKeywords?: string[]
    placeId?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: '잘못된 요청 형식이에요.' }, { status: 400 })
  }

  const { name, category, address, excludeKeywords } = body
  if (!name || !category) {
    return NextResponse.json({ message: '음식점 정보가 필요합니다.' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ message: 'AI 서비스 키가 설정되지 않았어요.' }, { status: 500 })
  }

  // 제외 키워드가 있으면 판정 지시 + excluded 필드 추가
  const exclusionInstruction =
    excludeKeywords && excludeKeywords.length > 0
      ? `사용자가 원하지 않는 음식/식당 종류: [${excludeKeywords.join(', ')}]\n` +
        '이 음식점이 해당 조건에 해당하면 excluded: true로 설정하세요.\n'
      : ''

  const systemContent =
    '당신은 한국 음식점 분석 전문가입니다. 주어진 음식점의 대표 메뉴 3~5개와 음식 특성 태그를 분석해주세요.\n' +
    '태그는 아래 목록 중 해당하는 것만 선택하세요 (영문 키값 그대로 사용):\n' +
    '  spicy(매운 음식), raw(날 음식·회), coriander(고수), offal(내장류),\n' +
    '  mala(마라·강한향신료), dairy(유제품), gluten(밀가루·글루텐),\n' +
    '  pork(돼지고기), seafood(해산물), chicken(닭고기), beef(소고기),\n' +
    '  egg(계란), nuts(견과류), soy(콩·두부)\n' +
    exclusionInstruction +
    '반드시 다음 JSON 형식으로만 응답하세요:\n' +
    '{"menus": ["메뉴1", "메뉴2", "메뉴3"], "tags": ["pork", "spicy"], "excluded": false}'

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
          { role: 'system', content: systemContent },
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
        max_tokens: 250,
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

  const VALID_TAGS = [
    'spicy','raw','coriander','offal','mala','dairy','gluten',
    'pork','seafood','chicken','beef','egg','nuts','soy',
  ]

  const data = await res.json()
  let menus: string[] = []
  let tags: string[] = []
  let excluded = false
  try {
    const content: string = data.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content) as { menus?: unknown; tags?: unknown; excluded?: unknown }
    menus = Array.isArray(parsed.menus) ? (parsed.menus as string[]).slice(0, 5) : []
    tags = Array.isArray(parsed.tags)
      ? (parsed.tags as string[]).filter((t) => VALID_TAGS.includes(t))
      : []
    excluded = parsed.excluded === true
  } catch {
    console.error('[Menu Enrich] 응답 파싱 오류:', data)
    menus = []
    tags = []
    excluded = false
  }

  return NextResponse.json({ menus, tags, excluded })
}
