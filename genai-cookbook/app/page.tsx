import { redirect } from 'next/navigation'
import { recipesPath } from '@/lib/constants'

export default function Home() {
    redirect(recipesPath())
}
