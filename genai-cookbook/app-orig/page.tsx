import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/lib/constants'

export default function Home() {
    redirect(cookbookRoute())
}
