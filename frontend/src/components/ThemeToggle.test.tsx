import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { ThemeToggle } from './ThemeToggle';

// Mock the Mantine color scheme hook
const mockSetColorScheme = vi.fn();
const mockColorScheme = vi.fn(() => 'light');

vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual('@mantine/core');
  return {
    ...actual,
    useMantineColorScheme: () => ({
      colorScheme: mockColorScheme(),
      setColorScheme: mockSetColorScheme,
    }),
  };
});

describe('ThemeToggle', () => {
  it('renders the sun icon in light mode', () => {
    mockColorScheme.mockReturnValue('light');

    render(
      <MantineProvider>
        <ThemeToggle stroke={1.5} />
      </MantineProvider>
    );

    const button = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(button).toBeInTheDocument();
  });

  it('renders the moon icon in dark mode', () => {
    mockColorScheme.mockReturnValue('dark');

    render(
      <MantineProvider>
        <ThemeToggle stroke={1.5} />
      </MantineProvider>
    );

    const button = screen.getByRole('button', { name: /switch to light theme/i });
    expect(button).toBeInTheDocument();
  });

  it('toggles the color scheme when clicked', async () => {
    mockColorScheme.mockReturnValue('light');
    const user = userEvent.setup();

    render(
      <MantineProvider>
        <ThemeToggle stroke={1.5} />
      </MantineProvider>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockSetColorScheme).toHaveBeenCalledWith('dark');
  });

  it('has correct accessibility label', () => {
    mockColorScheme.mockReturnValue('light');

    render(
      <MantineProvider>
        <ThemeToggle stroke={1.5} />
      </MantineProvider>
    );

    const button = screen.getByLabelText(/switch to dark theme/i);
    expect(button).toBeInTheDocument();
  });
});
