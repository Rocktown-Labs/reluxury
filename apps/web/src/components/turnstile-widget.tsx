import { useEffect, useRef } from "react";

import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import type { TurnstileAction } from "@/lib/turnstile";

interface TurnstileWindow {
  render: (
    container: HTMLElement,
    options: {
      action: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      sitekey: string;
    }
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileWindow;
  }
}

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

function loadTurnstileScript(): Promise<boolean> {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }
  if (window.turnstile) {
    return Promise.resolve(true);
  }
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${TURNSTILE_SCRIPT_SRC}"]`
  );
  if (existing) {
    // oxlint-disable-next-line promise/avoid-new
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), {
        once: true,
      });
    });
  }
  // oxlint-disable-next-line promise/avoid-new
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(true), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    // oxlint-disable-next-line unicorn/prefer-dom-node-append: workers-types narrows ParentNode.append
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({
  action,
  onError,
  onExpire,
  onToken,
  resetKey,
}: {
  action: TurnstileAction;
  onError: () => void;
  onExpire: () => void;
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onError, onExpire, onToken });
  callbacksRef.current = { onError, onExpire, onToken };

  useEffect(() => {
    let cancelled = false;
    const mount = async () => {
      const loaded = await loadTurnstileScript();
      if (cancelled || !loaded || !containerRef.current || !window.turnstile) {
        if (!cancelled && !loaded) {
          callbacksRef.current.onError();
        }
        return;
      }
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          action,
          callback: (token: string) => callbacksRef.current.onToken(token),
          "error-callback": () => callbacksRef.current.onError(),
          "expired-callback": () => callbacksRef.current.onExpire(),
          sitekey: TURNSTILE_SITE_KEY,
        });
      } catch {
        callbacksRef.current.onError();
      }
    };
    void mount();
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // widget already gone
        }
        widgetIdRef.current = null;
      }
    };
  }, [action]);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // widget already gone
      }
    }
  }, [resetKey]);

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
