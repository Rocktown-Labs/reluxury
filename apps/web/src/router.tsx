import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import Loader from "./components/loader";

import "./index.css";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createTanStackRouter({
    context: {},
    defaultNotFoundComponent: () => <div>Not Found</div>,
    defaultPendingComponent: () => <Loader />,
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

  if (!router.isServer) {
    Sentry.init({
      dsn: "https://f9b043523361c4f6d1499e357ce17ab1@o4510278858309632.ingest.us.sentry.io/4511468981059584",
      enableLogs: true,
      integrations: [
        Sentry.tanstackRouterBrowserTracingIntegration(router),
        Sentry.replayIntegration(),
      ],
      replaysOnErrorSampleRate: 1,
      replaysSessionSampleRate: 0.1,
      sendDefaultPii: true,
      tracesSampleRate: 1,
    });
  }

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
