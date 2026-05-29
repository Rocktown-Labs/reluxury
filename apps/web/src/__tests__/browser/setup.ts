import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock better-auth/react to return a clean null session by default in JSDOM tests
vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({
    signIn: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
    signUp: {
      email: vi.fn(),
    },
    useSession: () => ({
      data: null,
      error: null,
      isPending: false,
    }),
  }),
}));

// Browser-only JSDOM setup
if (typeof window !== "undefined") {
  // Mock window.matchMedia which JSDOM doesn't support by default
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockImplementation((query) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(), // deprecated
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(), // deprecated,
    })),
    writable: true,
  });

  // Mock window.scrollTo
  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    writable: true,
  });
}
