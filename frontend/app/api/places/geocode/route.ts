import { NextRequest, NextResponse } from 'next/server'

// ── Places Text Search API를 통한 주소/장소 검색 ─────────────────────
// Geocoding API보다 커버리지가 넓음 (상호명·랜드마크·부분 주소 모두 지원)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim()

  if (!query) {
    return NextResponse.json({ message: '검색어를 입력해주세요.' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ message: 'API 키가 설정되지 않았어요.' }, { status: 500 })
  }

  let res: Response
  try {
    res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.location,places.displayName,places.shortFormattedAddress,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'ko',
        regionCode: 'KR',
        maxResultCount: 1,
      }),
    })
  } catch (err) {
    console.error('[Geocode] 네트워크 오류:', err)
    return NextResponse.json({ message: '네트워크 오류가 발생했어요.' }, { status: 502 })
  }

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[Geocode] API 오류:', errorText)
    return NextResponse.json({ message: '주소 검색에 실패했어요.' }, { status: 502 })
  }

  const data = await res.json() as {
    places?: Array<{
      location: { latitude: number; longitude: number }
      displayName?: { text: string }
      shortFormattedAddress?: string
      formattedAddress?: string
    }>
  }

  const place = data.places?.[0]
  if (!place) {
    return NextResponse.json({ message: '주소를 찾을 수 없어요. 더 구체적으로 입력해주세요.' }, { status: 404 })
  }

  return NextResponse.json({
    lat: place.location.latitude,
    lng: place.location.longitude,
    label: place.shortFormattedAddress ?? place.formattedAddress ?? place.displayName?.text ?? query,
  })
}
