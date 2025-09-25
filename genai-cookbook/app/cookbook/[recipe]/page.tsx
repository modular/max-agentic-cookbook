'use client'

export default function Page({ params }: { params: { recipe?: string } }) {
    return <>{params.recipe && <div>Demo of {params.recipe}</div>}</>
}
