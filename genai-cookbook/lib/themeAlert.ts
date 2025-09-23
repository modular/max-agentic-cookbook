import { Alert, AlertCssVariables, CSSProperties, rem } from '@mantine/core';

type RootVars = Partial<Record<AlertCssVariables['root'], string>>;
export default Alert.extend({
  vars: (theme, props) => {
    let rootProps: RootVars = {};
    rootProps = {
      ...rootProps,
      ...mainColor(props.color ?? 'blue', props.variant ?? 'light'),
    };

    return { root: rootProps };
  },
  styles: (theme, props) => {
    return {
      closeButton: closeButtonStyles(props.color, props.variant),
    };
  },
  classNames: () => {
    return {
      title: 'body-14 !font-semibold sentenceCase',
      message: 'body-14-light',
    };
  },
});

function mainColor(color: string, variant: string): CSSProperties {
  switch (color) {
    case 'success':
      return {
        '--alert-bg':
          variant === 'outline'
            ? 'transparent'
            : 'var(--Elements-Green-20-Alpha)',
        '--alert-color': 'var(--Elements-Green-140-100)',
        '--alert-bd':
          variant === 'outline'
            ? `${rem(1)} solid var(--Elements-Green-120)`
            : 'none',
      };

    case 'warning':
      return {
        '--alert-bg':
          variant === 'outline'
            ? 'transparent'
            : 'var(--Elements-Orange-20-Alpha)',
        '--alert-color': 'var(--Elements-Orange-120-100)',
        '--alert-bd':
          variant === 'outline' ? `${rem(1)} solid var(--orange)` : 'none',
      };
    case 'danger':
      if (variant === 'outline') {
        return {
          '--alert-bg': 'transparent',
          '--alert-color': 'var(--Elements-Red-110-60)',
          '--alert-bd': `${rem(1)} solid var(--Elements-Red-110)`,
        };
      }
      return {
        '--alert-bg':
          variant === 'filled'
            ? 'var(--Elements-Red-110-60)'
            : 'var(--Elements-Red-20-Alpha)',
        '--alert-color':
          variant === 'filled'
            ? 'var(--Color-White)'
            : 'var(--Elements-Red-110-60)',
      };
    case null:
    case 'blue':
      if (variant === 'outline') {
        return {
          '--alert-bg': 'transparent',
          '--alert-color': 'var(--Elements-Neb-Ultra-Super)',
          '--alert-bd': `${rem(1)} solid var(--Elements-Neb-Ultra)`,
        };
      }
      return {
        '--alert-bg':
          variant === 'filled'
            ? 'var(--Elements-Neb-Ultra)'
            : 'var(--Elements-Neb-30-Alpha)',
        '--alert-color':
          variant === 'filled'
            ? 'var(--Color-White)'
            : 'var(--Elements-Neb-Ultra-Super)',
      };
    default:
      throw new Error(`"${color}" is not an allowed color`);
  }
}

function closeButtonStyles(color?: string, variant?: string) {
  return {
    color:
      variant === 'filled' && (color === 'danger' || color === 'blue' || !color)
        ? 'var(--Color-White)'
        : 'var(--Black)',
  };
}
