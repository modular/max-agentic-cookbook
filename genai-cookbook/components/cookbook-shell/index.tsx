'use client'

import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { headerHeight, navbarWidth } from '@/lib/theme'

import { CookbookProvider } from '@/hooks'
import { RecipeMetadata } from '@/lib/types'

import Header from './Header'
import Navbar from './Navbar'
import { RecipeShell } from './RecipeShell'

interface CookbookShellProps {
    recipes: RecipeMetadata[]
    children: React.ReactNode
}

export default function CookbookShell({ recipes, children }: CookbookShellProps) {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)

    return (
        <CookbookProvider recipes={recipes}>
            <AppShell
                header={{ height: headerHeight }}
                navbar={{
                    width: navbarWidth,
                    breakpoint: 'sm',
                    collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
                }}
                padding="md"
            >
                <AppShell.Header>
                    <Header
                        mobileOpened={mobileOpened}
                        toggleMobile={toggleMobile}
                        toggleDesktop={toggleDesktop}
                    />
                </AppShell.Header>
                <AppShell.Navbar p="md">
                    <Navbar recipes={recipes} />
                </AppShell.Navbar>
                <AppShell.Main>
                    <RecipeShell>{children}</RecipeShell>
                </AppShell.Main>
            </AppShell>
        </CookbookProvider>
    )
}
