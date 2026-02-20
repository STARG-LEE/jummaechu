import { useState, useCallback } from 'react'

interface GeolocationState {
  lat: number | null
  lng: number | null
  error: 'denied' | 'unavailable' | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: false,
  })

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'unavailable' }))
      return
    }

    setState(s => ({ ...s, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          error: null,
          loading: false,
        })
      },
      (err) => {
        setState({
          lat: null,
          lng: null,
          error: err.code === GeolocationPositionError.PERMISSION_DENIED ? 'denied' : 'unavailable',
          loading: false,
        })
      },
      { timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  return { ...state, request }
}
