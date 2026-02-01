import { useEffect, useRef, memo } from "react";
import { useLocation } from "react-router-dom";
import { preloadAdjacentRoutes } from "@/lib/routePreloader";

/**
 * Optimized ScrollToTop component that:
 * 1. Scrolls to top on route change
 * 2. Preloads adjacent routes for faster navigation
 */
export const ScrollToTop = memo(function ScrollToTop() {
  const { pathname } = useLocation();
  const lastPathRef = useRef(pathname);

  useEffect(() => {
    // Only scroll if the path actually changed (not just hash)
    if (lastPathRef.current !== pathname) {
      // Use instant scroll for faster perceived performance
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      lastPathRef.current = pathname;
      
      // Preload adjacent routes after navigation settles
      requestAnimationFrame(() => {
        preloadAdjacentRoutes(pathname);
      });
    }
  }, [pathname]);

  return null;
});
