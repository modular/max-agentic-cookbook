import { useContext } from 'react'
import { CookbookContext } from './CookbookProvider'

export function useCookbook() {
    const context = useContext(CookbookContext)
    if (!context) {
        throw new Error('useCookbook must be used within CookbookProvider')
    }
    return context
}
