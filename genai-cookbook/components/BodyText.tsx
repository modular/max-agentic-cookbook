import React from 'react';
import { Text, type TextProps, type ElementProps } from '@mantine/core';

interface BodyTextProps extends TextProps, ElementProps<'p', keyof TextProps> {}

export function BodyText(props: BodyTextProps) {
  return <Text unstyled p={0} m={0} {...props} />;
}
