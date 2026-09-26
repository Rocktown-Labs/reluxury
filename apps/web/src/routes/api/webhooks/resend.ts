import { createFileRoute } from "@tanstack/react-router";

import { handleResendWebhook } from "@/functions/resend-webhook";

export const Route = createFileRoute("/api/webhooks/resend")({
  server: {
    handlers: {
      POST: ({ request }) => handleResendWebhook(request),
    },
  },
});
