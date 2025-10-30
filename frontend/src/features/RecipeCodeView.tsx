/**
 * RecipeCodeView - Display recipe source code
 *
 * This component fetches and displays the source code for a recipe
 * with syntax highlighting using highlight.js.
 */

import { Container, Text, Tabs, Alert, useMantineColorScheme } from '@mantine/core'
import { useLocation } from 'react-router-dom'
import useSWR from 'swr'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import { fetchFrontendCode, fetchBackendCode } from '~/lib/api'

// Register languages
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)

// Highlight code using highlight.js
const highlightCode = (code: string, language: string) => {
    try {
        const highlighted = hljs.highlight(code, { language })
        return highlighted.value
    } catch (error) {
        console.error('Error highlighting code:', error)
        return code
    }
}

interface CodeBlockProps {
    code: string | undefined
    isLoading: boolean
    error: Error | undefined
    language: string
}

function CodeBlock({ code, isLoading, error, language }: CodeBlockProps) {
    const { colorScheme } = useMantineColorScheme()

    if (isLoading) {
        return <Text c="dimmed">Loading code...</Text>
    }

    if (error) {
        return (
            <Alert color="red" title="Error loading code">
                {error.message}
            </Alert>
        )
    }

    if (!code) {
        return null
    }

    return (
        <pre
            style={{
                fontSize: '0.9rem',
                backgroundColor:
                    colorScheme === 'dark'
                        ? 'var(--mantine-color-default)'
                        : 'var(--mantine-color-gray-1)',
                padding: '1rem',
                borderRadius: 'var(--mantine-radius-sm)',
                overflow: 'auto',
            }}
        >
            <code
                className="hljs"
                dangerouslySetInnerHTML={{
                    __html: highlightCode(code, language),
                }}
            />
        </pre>
    )
}

export function Component() {
    const location = useLocation()

    // Extract recipe slug from pathname
    // e.g., "/multiturn-chat/code" -> "multiturn-chat"
    const slug = location.pathname.split('/')[1]

    // Fetch frontend code
    const {
        data: frontendCode,
        error: frontendError,
        isLoading: frontendLoading,
    } = useSWR(`/code/${slug}/frontend`, () => fetchFrontendCode(slug))

    // Fetch backend code
    const {
        data: backendCode,
        error: backendError,
        isLoading: backendLoading,
    } = useSWR(`/code/${slug}/backend`, () => fetchBackendCode(slug))

    return (
        <Container size="xl" py="xl">
            <Tabs defaultValue="backend">
                <Tabs.List>
                    <Tabs.Tab value="backend">Backend (Python)</Tabs.Tab>
                    <Tabs.Tab value="frontend">Frontend (TypeScript)</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="backend" pt="md">
                    <CodeBlock
                        code={backendCode}
                        isLoading={backendLoading}
                        error={backendError}
                        language="python"
                    />
                </Tabs.Panel>

                <Tabs.Panel value="frontend" pt="md">
                    <CodeBlock
                        code={frontendCode}
                        isLoading={frontendLoading}
                        error={frontendError}
                        language="typescript"
                    />
                </Tabs.Panel>
            </Tabs>
        </Container>
    )
}
