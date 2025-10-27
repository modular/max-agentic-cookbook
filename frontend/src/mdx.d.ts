/**
 * TypeScript declarations for MDX files
 */

declare module '*.mdx' {
    import { ComponentType } from 'react'
    const Component: ComponentType
    export default Component
}
