'use client'

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div>Recipe:</div>
            <div>{children}</div>
        </>
    )
}
