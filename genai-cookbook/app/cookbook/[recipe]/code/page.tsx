export default function Page({ params }: { params: { recipe?: string } }) {
    return <>{params.recipe && <div>Code for {params.recipe}</div>}</>
}
