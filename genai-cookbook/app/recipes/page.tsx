import { Title } from '@mantine/core'
import { appShellContentHeight } from '@/lib/theme'

export default function Recipes() {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: appShellContentHeight,
            }}
        >
            <Title order={3} mb="sm">
                Choose a recipe to get started
            </Title>
        </div>
    )
}
