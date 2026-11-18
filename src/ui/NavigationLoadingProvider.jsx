"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { usePathname } from "next/navigation";

const NavigationLoadingContext = createContext(null);

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);

  if (!context) {
    throw new Error(
      "useNavigationLoading must be used inside NavigationLoadingProvider",
    );
  }

  return context;
}

export default function NavigationLoadingProvider({ children }) {
  const pathname = usePathname();

  const [navigationStartPath, setNavigationStartPath] = useState(null);

  // Start navigation without modifying refs or effects.
  const startNavigation = useCallback(() => {
    setNavigationStartPath(pathname);
  }, [pathname]);

  // The overlay is visible only while the original pathname remains active.
  const isNavigating =
    navigationStartPath !== null && navigationStartPath === pathname;

  // Detect internal Next.js link navigation.
  useEffect(() => {
    function handleLinkClick(event) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest("a[href]");

      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);

      if (destination.origin !== window.location.origin) return;

      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }

      setNavigationStartPath(pathname);
    }

    document.addEventListener("click", handleLinkClick, true);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
    };
  }, [pathname]);

  // Detect browser back and forward navigation.
  useEffect(() => {
    function handlePopState() {
      setNavigationStartPath(pathname);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname]);

  return (
    <NavigationLoadingContext.Provider value={{ startNavigation }}>
      {children}

      {isNavigating && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-5 bg-white/95 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-stone-200 border-t-yellow-400" />

          <div className="text-center">
            <p className="text-lg font-semibold tracking-wide text-stone-800">
              Joey&apos;s Pizza
            </p>

            <p className="mt-2 text-sm text-stone-500">
              Preparing your next page...
            </p>
          </div>
        </div>
      )}
    </NavigationLoadingContext.Provider>
  );
}
