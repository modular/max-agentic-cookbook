'use client'

import { Flex } from '@mantine/core'

import { appShellContentHeight } from '@/lib/theme'
import { Toolbar } from '@/components/recipe-partials/Toolbar'
import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/lib/constants'

export default function Page({
    children,
    params,
}: {
    children: React.ReactNode
    params: { recipe?: string }
}) {
    if (!params.recipe) return redirect(cookbookRoute())

    return (
        <>
            <Flex
                direction="column"
                gap="sm"
                style={{ overflow: 'hidden' }}
                h={appShellContentHeight}
            >
                {params.recipe && <Toolbar title={params.recipe} />}
                {children}
            </Flex>
        </>
    )
}
