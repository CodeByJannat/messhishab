import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { forwardRef, useCallback, useTransition, MouseEvent } from 'react';
import { preloadRoute } from '@/lib/routePreloader';

interface PreloadLinkProps extends LinkProps {
  preloadOnHover?: boolean;
  preloadOnMount?: boolean;
}

/**
 * Enhanced Link component that preloads routes on hover/focus
 * for instant navigation transitions
 */
export const PreloadLink = forwardRef<HTMLAnchorElement, PreloadLinkProps>(
  ({ to, preloadOnHover = true, preloadOnMount = false, onMouseEnter, onFocus, ...props }, ref) => {
    const path = typeof to === 'string' ? to : to.pathname || '';

    const handlePreload = useCallback(() => {
      if (path) {
        preloadRoute(path);
      }
    }, [path]);

    const handleMouseEnter = useCallback(
      (e: MouseEvent<HTMLAnchorElement>) => {
        if (preloadOnHover) {
          handlePreload();
        }
        onMouseEnter?.(e);
      },
      [preloadOnHover, handlePreload, onMouseEnter]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        if (preloadOnHover) {
          handlePreload();
        }
        onFocus?.(e);
      },
      [preloadOnHover, handlePreload, onFocus]
    );

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      />
    );
  }
);

PreloadLink.displayName = 'PreloadLink';

/**
 * Hook for programmatic navigation with transition
 */
export function useTransitionNavigate() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  const transitionNavigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      startTransition(() => {
        navigate(to, options);
      });
    },
    [navigate]
  );

  return { navigate: transitionNavigate, isPending };
}
