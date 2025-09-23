import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { cookbookRoute } from '@/lib/constants'

export function useRecipeSlug(): string | null {
    const [initialRecipe, setInitialRecipe] = useState<string | null>(null)
    const pathname = usePathname()

    useEffect(() => {
        try {
            const base = cookbookRoute()
            let slug: string | null = null
            if (pathname && pathname.startsWith(`${base}/`)) {
                const rest = pathname.slice(base.length + 1)
                slug = rest.split('/')[0] || null
            }
            if (initialRecipe !== slug) {
                setInitialRecipe(slug)
            }
        } catch {
            setInitialRecipe(null)
        }
    }, [initialRecipe, pathname])

    return initialRecipe
}
