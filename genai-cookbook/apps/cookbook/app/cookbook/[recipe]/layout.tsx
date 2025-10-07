'use client'

import { Flex } from '@mantine/core'

import { appShellContentHeight } from '@modular/recipe-sdk/theme'
import { Toolbar } from '@/components/Toolbar'
import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/lib/constants'
import { useCookbook } from '@modular/recipe-sdk/context'

export default function RecipeShell({
    children,
    params,
}: {
    children: React.ReactNode
    params: { recipe?: string }
}) {
    const { recipeFromSlug } = useCookbook()
    const recipe = recipeFromSlug(params.recipe)

    if (!recipe) return redirect(cookbookRoute())

    return (
        <>
            <Flex
                direction="column"
                gap="sm"
                style={{ overflow: 'hidden' }}
                h={appShellContentHeight}
            >
                <Toolbar title={recipe.title} />
                {children}
            </Flex>
        </>
    )
}
