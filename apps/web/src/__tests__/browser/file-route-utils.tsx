import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from "@tanstack/react-router";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import React from "react";

// Import the generated route tree
import { routeTree } from "../../routeTree.gen";

// Create a helper to generate a fresh test router
export function createTestRouterFromFiles(initialLocation = "/") {
  const router = createRouter({
    context: {},
    history: createMemoryHistory({
      initialEntries: [initialLocation],
    }),
    routeTree,
  });

  return router;
}

interface RenderWithFileRoutesOptions extends Omit<RenderOptions, "wrapper"> {
  initialLocation?: string;
  routerContext?: Record<string, unknown>;
  queryClient?: QueryClient;
}

export function renderWithFileRoutes(
  ui: React.ReactElement,
  {
    initialLocation = "/",
    routerContext = {},
    queryClient,
    ...renderOptions
  }: RenderWithFileRoutesOptions = {}
) {
  const qClient =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: false,
        },
      },
    });

  // Pre-seed common queries to prevent unhandled loader/component query errors
  qClient.setQueryData(["session"], null);

  const router = createRouter({
    context: routerContext,
    history: createMemoryHistory({
      initialEntries: [initialLocation],
    }),
    routeTree,
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qClient}>
        <RouterProvider router={router}>{children}</RouterProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: qClient,
    router,
  };
}
