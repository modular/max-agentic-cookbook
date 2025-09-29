import { Button, ButtonCssVariables, CSSProperties, rem } from '@mantine/core';
import styles from './themeButton.module.scss';
import clsx from 'clsx';

type RootVars = Partial<Record<ButtonCssVariables['root'], string>>;
export default Button.extend({
  defaultProps: {
    style: { fontWeight: '400' },
  },
  vars: (theme, props) => {
    let rootProps: RootVars = {};
    rootProps = {
      ...rootProps,
      ...sizeVars(props.size ?? 'md'),
      ...radiusVars(props.variant ?? 'filled'),
      ...mainColor(props.color ?? 'primary', props.variant ?? 'filled'),
    };

    return { root: rootProps };
  },
  styles: (theme, props) => {
    let rootProps: CSSProperties = {};

    if (props.disabled) {
      rootProps = {
        ...rootProps,
        ...disabledStyles(props.color ?? 'primary', props.variant ?? 'filled'),
      };
    }

    return { root: rootProps };
  },
  classNames: (theme, props) => {
    if (props.variant === 'comic') {
      return {
        root: clsx(
          styles.root,
          'transition-all duration-200 active:!translate-y-[10px]'
        ),
        label: clsx(
          styles.label,
          '-ml-1',
          'lh-normal cbm:text-xl',
          'tracking-[1.92px] cbm:tracking-[2.4px] cbl:text-3xl cbl:tracking-[1.92px]'
        ),
        section: styles.section,
      };
    }
    return {
      root: clsx(
        styles.onActive,
        styles.onHover,
        'no-transition',
        '!font-normal'
      ),
      section: styles.section,
    };
  },
});

function sizeVars(size?: string): RootVars {
  switch (size) {
    case 'lg':
      return {
        '--button-height': rem(48),
        '--button-padding-x': rem(26),
        '--button-fz': rem(18),
      };
    case 'compact-lg':
      return {
        '--button-height': rem(34),
        '--button-padding-x': rem(12),
        '--button-fz': rem(18),
      };
    case 'md':
      return {
        '--button-height': rem(40),
        '--button-padding-x': rem(22),
        '--button-fz': rem(16),
      };
    case 'compact-md':
      return {
        '--button-height': rem(30),
        '--button-padding-x': rem(12),
        '--button-fz': rem(16),
      };
    case 'sm':
      return {
        '--button-height': rem(36),
        '--button-padding-x': rem(18),
        '--button-fz': rem(14),
      };
    case 'compact-sm':
      return {
        '--button-height': rem(26),
        '--button-padding-x': rem(8),
        '--button-fz': rem(14),
      };
    case 'xs':
      return {
        '--button-height': rem(28),
        '--button-padding-x': rem(14),
        '--button-fz': rem(12),
      };
    case 'compact-xs':
      return {
        '--button-height': rem(22),
        '--button-padding-x': rem(7),
        '--button-fz': rem(12),
      };
    default:
      throw new Error(`${size} not found`);
  }
}

function mainColor(color: string, variant: string): CSSProperties {
  if (variant === 'comic') {
    return {
      '--button-bg': color,
      '--button-color': 'var(--Elements-Twilight-100)',
      '--button-hover': `hwb(from ${color} h calc(w - 20) calc(b + 5))`,
    };
  }
  if (variant === 'subtle') {
    return {
      '--button-bg': 'transparent',
      '--button-color': 'var(--Elements-Twilight-60-50)',
      '--button-hover': 'var(--Elements-Twilight-5-80)',
    };
  }
  switch (color) {
    case 'primary':
      return {
        '--button-bg': 'var(--Elements-Neb-90-Ultra)',
        '--button-color': 'var(--Elements-Twilight-100)',
        '--button-hover': 'var(--Elements-Neb-Ultra-Super)',
      };
    case 'danger':
      if (variant === 'outline') {
        return {
          '--button-bg': 'transparent',
          '--button-color': 'var(--Elements-Red-110-60)',
          '--button-hover-color': 'var(--Elements-Red-60)',
          '--button-hover': 'transparent',
          '--button-bd': '1px solid var(--Elements-Red-110-60)',
          '--button-bd-hover': 'var(--Elements-Red-60)',
        };
      }
      return {
        '--button-bg': 'var(--Elements-Red-110)',
        '--button-color': 'var(--Color-White)',
        '--button-hover': 'var(--Elements-Red-60)',
      };
    case 'black':
      if (variant === 'outline') {
        return {
          '--button-bg': 'transparent',
          '--button-color': 'var(--Black)',
          '--button-hover-color': 'var(--Elements-Twilight-60-50)',
          '--button-hover': 'transparent',
          '--button-bd': '1px solid var(--Black)',
          '--button-bd-hover': 'var(--Elements-Twilight-70-50)',
        };
      }
      return {
        '--button-bg': 'var(--Black)',
        '--button-color': 'var(--White)',
        '--button-hover': 'var(--Elements-Twilight-60-50)',
      };
    case 'gray':
      if (variant === 'outline') {
        return {
          '--button-bg': 'transparent',
          '--button-color': 'var(--Black)',
          '--button-hover-color': 'var(--Black)',
          '--button-hover': 'transparent',
          '--button-bd': '1px solid var(--Elements-Twilight-5-80)',
          '--button-bd-hover': 'var(--Elements-Twilight-30-60)',
        };
      }
      return {
        '--button-bg': 'var(--Elements-Twilight-5-80)',
        '--button-color': 'var(--Black)',
        '--button-hover': 'var(--Elements-Twilight-30-70)',
      };
    case 'green':
      return {
        '--button-bg': 'var(--Elements-Green-60-Alpha)',
        '--button-color': 'var(--Elements-Twilight-100-0)',
        '--button-hover': 'var(--Elements-Green-100-140)',
      };
    default:
      return {};
  }
}

function disabledStyles(color: string, variant: string): CSSProperties {
  if (variant === 'subtle') {
    return {
      opacity: 1,
      background: 'var(--Elements-Twilight-5-80)',
      color: 'var(--Elements-Twilight-40-60)',
      borderColor: 'transparent',
    };
  }
  switch (color) {
    case 'primary':
      return {
        opacity: 0.4,
        background: 'var(--Elements-Neb-100-Twilight-60)',
        color: 'var(--Black)',
      };
    case 'danger':
      return {
        opacity: 1,
        background: 'var(--Elements-Red-Dark-Alpha)',
        color: 'var(--Elements-Twilight-60-40)',
        borderColor: 'transparent',
      };
    case 'black':
      if (variant === 'outline') {
        return {
          opacity: 1,
          background: 'var(--Elements-Twilight-5-80)',
          color: 'var(--Elements-Twilight-40-60)',
          borderColor: 'transparent',
        };
      }
      return {
        opacity: 1,
        background: 'var(--Elements-Twilight-30-70)',
        color: 'var(--Elements-Twilight-60-40)',
        borderColor: 'transparent',
      };
    default:
      return {};
  }
}

function radiusVars(variant: string): RootVars {
  if (variant === 'comic') {
    return {
      '--button-radius': rem(50),
    };
  }
  return {};
}
