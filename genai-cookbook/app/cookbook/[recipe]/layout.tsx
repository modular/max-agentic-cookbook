'use client'

export default function Template({
    children,
    params,
}: {
    children: React.ReactNode
    params: { recipe?: string }
}) {
    return (
        <>
            <div>Recipe:</div>
            <div>{children}</div>
        </>
    )
}
