import { Flex } from '@mantine/core'

import { appShellContentHeight } from '@/lib/theme'
import { Toolbar } from '../recipe-partials'
import { useCookbook } from '@/hooks'

export function RecipeShell({ children }: { children: React.ReactNode }) {
    const { selectedRecipe } = useCookbook()

    return (
        <>
            <Flex
                direction="column"
                gap="sm"
                style={{ overflow: 'hidden' }}
                h={appShellContentHeight}
            >
                {selectedRecipe && <Toolbar title={selectedRecipe.title} />}
                {children}
            </Flex>
        </>
    )
}
