import { Flex } from '@mantine/core'

import { appShellContentHeight } from '@/lib/theme'
import { Toolbar } from './recipe-partials/Toolbar'
import { useCookbook } from '@/hooks'

export default function RecipeShell({ children }: { children: React.ReactNode }) {
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
