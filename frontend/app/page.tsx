import { redirect } from 'next/navigation'

// 루트 접근 시 추천 페이지로 이동 (로그인 미구현 단계에서는 바로 이동)
// TODO: Firebase Auth 연동 후 → 비로그인이면 /login, 로그인이면 /recommend 로 분기
export default function HomePage() {
  redirect('/recommend')
}
