import { Flex, Group, Title } from '@mantine/core'
import { SelectEndpoint } from './SelectEndpoint'
import { SelectModel } from './SelectModel'
import { CodeToggle } from './CodeToggle'

export function Toolbar({ title }: { title?: string }) {
    return (
        <Flex w="100%" direction="row" justify="space-between" align="center">
            <Group>
                <Title order={3}>{title ?? ''}</Title>
                <CodeToggle />
            </Group>
            <Group>
                <SelectEndpoint />
                <SelectModel />
            </Group>
        </Flex>
    )
}
