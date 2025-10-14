import { FormEvent, useCallback, useState } from 'react'
import { RecipeProps } from '../types'
import { nanoid } from 'nanoid'
import { Button, Divider, Flex, Stack, Table, TextInput } from '@mantine/core'

interface GenData {
    id: string
    input: string
    output?: string
}

interface MultiGenRequest {
    inputs: GenData[]
    systemPrompt: string
    endpointId: string
    modelName: string
    api: string
}

export default function Recipe({ endpoint, model, pathname }: RecipeProps) {
    const [input, setInput] = useState('')
    const [data, setData] = useState<GenData[]>([])

    const handleAdd = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setData((prev) => [
            ...prev,
            {
                id: nanoid(),
                input,
            },
        ])
        setInput('')
    }

    const handleGenerate = useCallback(() => {}, [data])

    return (
        <Stack align="stretch" justify="flex-start" gap="md">
            <Divider />
            <form onSubmit={handleAdd}>
                <Flex
                    gap="md"
                    justify="flex-start"
                    align="flex-start"
                    direction="row"
                    wrap="nowrap"
                >
                    <TextInput
                        value={input}
                        onChange={(event) => setInput(event.currentTarget.value)}
                    />
                    <Button type="submit" variant="light" disabled={input === ''}>
                        Add
                    </Button>
                    <div style={{ flex: 1 }} />
                    <Button
                        variant="light"
                        onClick={() => handleGenerate()}
                        disabled={
                            data.length === 0 ||
                            data.some((item) => item.output !== undefined)
                        }
                    >
                        Generate Predictions
                    </Button>
                </Flex>
            </form>
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Input</Table.Th>
                        <Table.Th>Safe or Unsafe?</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {data.map((item) => {
                        return (
                            <Table.Tr key={item.id}>
                                <Table.Td>{item.input}</Table.Td>
                                <Table.Td>{item.output}</Table.Td>
                            </Table.Tr>
                        )
                    })}
                </Table.Tbody>
            </Table>
        </Stack>
    )
}
