import { Flex, Group, Title } from '@mantine/core'
import { EndpointSelect } from './EndpointSelect'
import { ModelSelect } from './ModelSelect'
import { ShowCodeToggle } from './ShowCodeToggle'

export function Toolbar({ title }: { title?: string }) {
    return (
        <Flex w="100%" direction="row" justify="space-between" align="center">
            <Group>
                <Title order={3}>{title ?? ''}</Title>
                <ShowCodeToggle />
            </Group>
            <Group>
                <EndpointSelect />
                <ModelSelect />
            </Group>
        </Flex>
    )
}
