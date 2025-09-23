export default function Page({ params }: { params: { recipe?: string } }) {
    return <>{params.recipe && <div>{params.recipe}</div>}</>
}
