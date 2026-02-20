export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1C1917] border border-[#E7E5E4] dark:border-[#44403C] rounded-[16px] overflow-hidden flex flex-col">
      {/* 사진 skeleton */}
      <div className="w-full h-36 bg-[#E7E5E4] dark:bg-[#292524] animate-pulse" />

      <div className="p-4 flex flex-col gap-3">
        {/* 카테고리 + 거리 */}
        <div className="flex justify-between">
          <div className="w-12 h-5 rounded-[6px] bg-[#E7E5E4] dark:bg-[#292524] animate-pulse" />
          <div className="w-10 h-5 rounded-[6px] bg-[#E7E5E4] dark:bg-[#292524] animate-pulse" />
        </div>

        {/* 음식점명 */}
        <div className="space-y-2">
          <div className="w-3/4 h-6 rounded bg-[#E7E5E4] dark:bg-[#292524] animate-pulse" />
          <div className="w-1/2 h-4 rounded bg-[#E7E5E4] dark:bg-[#292524] animate-pulse" />
        </div>

        {/* 대표 메뉴 */}
        <div className="w-2/3 h-4 rounded bg-[#E7E5E4] dark:bg-[#292524] animate-pulse" />

        {/* 평점 */}
        <div className="w-1/3 h-4 rounded bg-[#E7E5E4] dark:bg-[#292524] animate-pulse" />

        {/* 지도 링크 */}
        <div className="w-24 h-4 rounded bg-[#E7E5E4] dark:bg-[#292524] animate-pulse self-end" />
      </div>
    </div>
  )
}
