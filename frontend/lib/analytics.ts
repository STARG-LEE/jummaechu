// Google Analytics 4 커스텀 이벤트 헬퍼
// architecture.md §8 Observability 기반

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return
  window.gtag('event', eventName, params)
}

export const analytics = {
  pageView: (url: string) =>
    track('page_view', { page_path: url }),

  locationAllowed: () =>
    track('location_allowed'),

  loginSuccess: () =>
    track('login_success'),

  filtersSet: (params: { radius: number; priceBand: string | null; excludeTagCount: number }) =>
    track('filters_set', params),

  recommendationsShown: (placeIds: string[]) =>
    track('recommendations_shown', { place_ids: placeIds.join(',') }),

  cardClicked: (params: { placeId: string; position: 1 | 2 | 3 }) =>
    track('card_clicked', params),

  mapOpen: (placeId: string) =>
    track('map_open', { place_id: placeId }),
}
