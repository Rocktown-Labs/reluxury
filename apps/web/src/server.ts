import * as Sentry from "@sentry/cloudflare";
import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler from "@tanstack/react-start/server-entry";

export default Sentry.withSentry(
  () => ({
    dsn: "https://f9b043523361c4f6d1499e357ce17ab1@o4510278858309632.ingest.us.sentry.io/4511468981059584",
    enableLogs: true,
    sendDefaultPii: true,
    tracesSampleRate: 1,
  }),
  // @ts-expect-error - handler is not typed as a Cloudflare handler
  wrapFetchWithSentry(handler)
);
