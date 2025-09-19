import CookbookShell from '@/components/cookbook-shell'
import loadRecipes from '@/lib/loadRecipes'
import { fileURLToPath } from 'url'

const basePath = fileURLToPath(import.meta.url)

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <CookbookShell recipes={loadRecipes(basePath)}>{children}</CookbookShell>
}
