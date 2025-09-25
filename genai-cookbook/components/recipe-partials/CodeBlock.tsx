'use client'

import { useMemo, type CSSProperties } from 'react'
import { Text } from '@mantine/core'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import lightCode from 'react-syntax-highlighter/dist/esm/styles/prism/material-light'
import darkCode from 'react-syntax-highlighter/dist/esm/styles/prism/material-dark'

import {
    Divider,
    ScrollArea,
    Space,
    Stack,
    Title,
    useMantineColorScheme,
} from '@mantine/core'
import { RecipeMetadata } from '@/lib/types'

type PrismTheme = Record<string, CSSProperties>

SyntaxHighlighter.registerLanguage('jsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', ts)

export function CodeBlock({ recipe }: { recipe: RecipeMetadata }) {
    const { colorScheme } = useMantineColorScheme()

    const codeTheme = useMemo(() => {
        const baseTheme = (colorScheme === 'dark' ? darkCode : lightCode) as PrismTheme
        const customTheme: PrismTheme = { ...baseTheme }

        customTheme['code[class*="language-"]'] = {
            ...(baseTheme['code[class*="language-"]'] ?? {}),
            background: 'transparent',
        }

        const commentColor = colorScheme === 'dark' ? '#e15573' : '#ea3396'
        const commentFontFamily =
            'var(--mantine-font-family, "Inter", "Segoe UI", sans-serif)'
        const commentSelectors = ['comment', 'prolog', 'doctype', 'cdata']

        commentSelectors.forEach((selector) => {
            customTheme[selector] = {
                ...(baseTheme[selector] ?? {}),
                color: commentColor,
                fontFamily: commentFontFamily,
                fontStyle: 'normal',
            }
        })

        customTheme['linenumber'] = {
            ...(baseTheme['linenumber'] ?? {}),
            fontFamily: 'monospace',
            color:
                colorScheme === 'dark'
                    ? 'var(--mantine-color-gray-7)'
                    : 'var(--mantine-color-dark-1)',
        }

        return customTheme
    }, [colorScheme])

    const Code = ({ code }: { code: string }) => {
        return (
            <SyntaxHighlighter
                language="typescript"
                showLineNumbers={true}
                style={codeTheme}
                customStyle={{
                    fontSize: '0.9rem',
                    backgroundColor:
                        colorScheme === 'dark'
                            ? 'var(--mantine-color-dark-8)'
                            : 'var(--mantine-color-gray-1)',
                }}
            >
                {code}
            </SyntaxHighlighter>
        )
    }

    return (
        <ScrollArea type="scroll">
            {(recipe?.beCode || recipe?.feCode || recipe?.description) && (
                <Divider mb="md" />
            )}
            {recipe?.description && <Text mb="xl">{recipe.description}</Text>}
            {recipe?.beCode && (
                <Stack gap={0}>
                    <Title order={4}>Back-end</Title>
                    <Code code={recipe.beCode} />
                </Stack>
            )}
            {recipe?.beCode && recipe?.feCode && <Space h="md" />}
            {recipe?.feCode && (
                <Stack gap={0}>
                    <Title order={4}>Front-end</Title>
                    <Code code={recipe.feCode} />
                </Stack>
            )}
        </ScrollArea>
    )
}
