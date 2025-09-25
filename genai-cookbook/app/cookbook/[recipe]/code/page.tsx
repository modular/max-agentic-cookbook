'use client'

import { redirect } from 'next/navigation'
import { useCookbook } from '@/hooks/useCookbook'
import { cookbookRoute } from '@/lib/constants'
import { CodeBlock } from '@/components/CodeBlock'

export default function Page({ params }: { params: { recipe?: string } }) {
    const { recipeFromSlug } = useCookbook()
    const recipe = recipeFromSlug(params.recipe)

    if (!recipe) return redirect(cookbookRoute())

    return <CodeBlock recipe={recipe} />
}
