'use client'

import {
    createTheme,
    TextInput,
    Avatar,
    type AvatarCssVariables,
    Radio,
    RadioCssVariables,
    Table,
} from '@mantine/core'
import themeButton from './themeButton'
import themeAlert from './themeAlert'
import { baseTheme } from './theme'

export function clientTheme(fontFamily: string, fontFamilyMonospace: string) {
    const base = baseTheme(fontFamily, fontFamilyMonospace)

    return createTheme({
        ...base,
        components: {
            Alert: themeAlert,
            Avatar: Avatar.extend({
                vars: () => {
                    const rootProps: Partial<
                        Record<AvatarCssVariables['root'], string>
                    > = {}

                    rootProps['--avatar-bd'] = 'transparent'
                    return { root: rootProps }
                },
            }),
            Button: themeButton,
            TextInput: TextInput.extend({
                classNames: {
                    label: 'textInputLabel',
                },
            }),
            Radio: Radio.extend({
                vars: () => {
                    const rootProps: Partial<
                        Record<RadioCssVariables['root'], string>
                    > = {}

                    rootProps['--radio-icon-color'] = 'var(--White)'
                    rootProps['--radio-color'] = 'var(--Elements-Neb-Ultra-Super)'
                    return { root: rootProps }
                },
                classNames() {
                    return {
                        radio: 'border-Elements-Twilight-60-50',
                    }
                },
            }),
            Table: Table.extend({
                classNames(theme, props) {
                    const buttonSizeClasses = {
                        md: ['h-10', 'px-[22px]', 'text-[16px]'],
                        sm: ['h-9', 'px-[18px]', 'text-[14px]'],
                        xs: ['h-7', 'px-[14px]', 'text-[12px]'],
                    }
                    function buttonSizeClassString(size: string) {
                        return buttonSizeClasses[size as keyof typeof buttonSizeClasses]
                            .map((className: string) => `[&>button]:!${className}`)
                            .join(' ')
                    }
                    const classes: Record<string, string> = {}
                    switch (props.verticalSpacing) {
                        case 'lg':
                            classes.td = `!py-4 ${buttonSizeClassString('md')}`
                            break
                        case 'md':
                            classes.td = `!py-3 ${buttonSizeClassString('sm')}`
                            break
                        case 'sm':
                            classes.td = `!py-2 ${buttonSizeClassString('xs')}`
                            break
                        default:
                            classes.td = `!py-1 ${buttonSizeClassString('xs')}`
                            break
                    }
                    return classes
                },
            }),
        },
    })
}
