import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/utils/constants'

export default function HomePage() {
    redirect(cookbookRoute())
}
