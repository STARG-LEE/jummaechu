import { auth } from './firebase'
import type { SearchParams, SearchResponse, UserPreference } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

async function getIdToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('로그인이 필요합니다.')
  return user.getIdToken()
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getIdToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message ?? `API 오류 (${res.status})`)
  }
  return res.json()
}

// GET /api/places/search
export function searchRestaurants(params: SearchParams): Promise<SearchResponse> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius: String(params.radius),
    ...(params.priceBand && { price_band: params.priceBand }),
    ...(params.excludeTags.length > 0 && { exclude_tags: params.excludeTags.join(',') }),
  })
  return request(`/api/places/search?${query}`)
}

// GET /api/user/preferences
export function getUserPreferences(): Promise<UserPreference> {
  return request('/api/user/preferences')
}

// PUT /api/user/preferences
export function updateUserPreferences(prefs: UserPreference): Promise<void> {
  return request('/api/user/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs),
  })
}
