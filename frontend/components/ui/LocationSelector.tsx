'use client'

import { useState, useEffect, useRef } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'

type LocationMode = 'gps' | 'address'

export interface LocationInfo {
  lat: number
  lng: number
  label: string
}

interface Props {
  value: LocationInfo | null
  onChange: (loc: LocationInfo | null) => void
}

export function LocationSelector({ value, onChange }: Props) {
  const [mode, setMode] = useState<LocationMode>('gps')
  const [addressInput, setAddressInput] = useState('')
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { lat, lng, error: gpsError, loading: gpsLoading, request: requestGps } = useGeolocation()

  // GPS 성공 시 상위에 전달
  useEffect(() => {
    if (lat !== null && lng !== null && mode === 'gps') {
      onChange({ lat, lng, label: '현재 위치' })
    }
  }, [lat, lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // 모드 전환 시 이전 위치 초기화
  const switchMode = (next: LocationMode) => {
    setMode(next)
    onChange(null)
    setAddressError(null)
    setAddressInput('')
  }

  // 주소/장소명 → 좌표 변환 (Places Text Search — 상호명·랜드마크·부분 주소 모두 지원)
  const searchAddress = async () => {
    const query = addressInput.trim()
    if (!query) return

    setAddressLoading(true)
    setAddressError(null)

    try {
      const res = await fetch(`/api/places/geocode?query=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (res.ok) {
        onChange({ lat: data.lat, lng: data.lng, label: data.label })
      } else {
        setAddressError(data.message ?? '주소를 찾을 수 없어요.')
        onChange(null)
      }
    } catch {
      setAddressError('주소 검색 중 오류가 발생했어요.')
      onChange(null)
    } finally {
      setAddressLoading(false)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">위치</h2>

      {/* 모드 전환 탭 */}
      <div className="flex gap-1 p-1 bg-[#F5F5F4] dark:bg-[#292524] rounded-[10px]">
        {(['gps', 'address'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`
              flex-1 py-2 rounded-[8px] text-[14px] font-medium transition-all duration-150
              ${mode === m
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAFAF9]'
              }
            `}
          >
            {m === 'gps' ? '📍 내 위치' : '🔍 주소 검색'}
          </button>
        ))}
      </div>

      {/* GPS 모드 */}
      {mode === 'gps' && (
        <div>
          {value ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#FFF7ED] dark:bg-[#431407] rounded-[10px]">
              <span className="text-[#F97316]">📍</span>
              <span className="text-[14px] text-[#F97316] font-medium flex-1">현재 위치 확인됨</span>
              <button
                onClick={() => { onChange(null) }}
                className="text-[12px] text-[#78716C] dark:text-[#A8A29E] hover:text-[#EF4444]"
              >
                재시도
              </button>
            </div>
          ) : gpsLoading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F5F5F4] dark:bg-[#292524] rounded-[10px]">
              <span className="animate-spin text-[14px]">⟳</span>
              <span className="text-[14px] text-[#78716C] dark:text-[#A8A29E]">위치 확인 중...</span>
            </div>
          ) : gpsError === 'denied' ? (
            <div className="px-3 py-2.5 bg-[#FEF2F2] dark:bg-[#1C1917] rounded-[10px] space-y-1">
              <p className="text-[14px] text-[#EF4444] font-medium">위치 권한이 거부됐어요</p>
              <p className="text-[12px] text-[#78716C] dark:text-[#A8A29E]">
                브라우저 주소창 왼쪽 🔒 아이콘 → 위치 → 허용 후 재시도해주세요
              </p>
            </div>
          ) : gpsError === 'unavailable' ? (
            <div className="px-3 py-2.5 bg-[#FEF2F2] dark:bg-[#1C1917] rounded-[10px]">
              <p className="text-[14px] text-[#EF4444]">위치를 가져올 수 없어요. 주소 검색을 이용해주세요.</p>
            </div>
          ) : (
            <button
              onClick={requestGps}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#E7E5E4] dark:border-[#44403C] rounded-[10px] text-[14px] text-[#78716C] dark:text-[#A8A29E] hover:border-[#F97316] hover:text-[#F97316] transition-colors"
            >
              <span>📍</span> 현재 위치 가져오기
            </button>
          )}
        </div>
      )}

      {/* 주소 검색 모드 */}
      {mode === 'address' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value)
                setAddressError(null)
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') searchAddress() }}
              placeholder="예) 강남구 테헤란로 152"
              className="flex-1 px-3 py-2.5 bg-[#F5F5F4] dark:bg-[#292524] rounded-[10px] text-[14px] text-[#1C1917] dark:text-[#FAFAF9] placeholder-[#D6D3D1] dark:placeholder-[#57534E] outline-none focus:ring-2 focus:ring-[#F97316]"
            />
            <button
              onClick={searchAddress}
              disabled={addressLoading || !addressInput.trim()}
              className="px-4 py-2.5 bg-[#F97316] hover:bg-[#EA580C] disabled:bg-[#D6D3D1] dark:disabled:bg-[#44403C] text-white rounded-[10px] text-[14px] font-medium transition-colors"
            >
              {addressLoading ? '...' : '검색'}
            </button>
          </div>

          {/* 검색 결과 */}
          {value && mode === 'address' && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-[#FFF7ED] dark:bg-[#431407] rounded-[10px]">
              <span className="text-[#F97316] mt-0.5">✓</span>
              <p className="text-[13px] text-[#F97316] font-medium flex-1 leading-snug">{value.label}</p>
              <button
                onClick={() => { setAddressInput(''); onChange(null); inputRef.current?.focus() }}
                className="text-[12px] text-[#78716C] dark:text-[#A8A29E] hover:text-[#EF4444] shrink-0"
              >
                변경
              </button>
            </div>
          )}

          {/* 에러 */}
          {addressError && (
            <p className="text-[13px] text-[#EF4444] px-1">{addressError}</p>
          )}
        </div>
      )}
    </section>
  )
}
