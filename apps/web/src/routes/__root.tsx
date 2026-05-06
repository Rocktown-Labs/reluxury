import { Toaster } from "@reluxury/ui/components/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import Footer from "../components/footer";
import Header from "../components/header";
import { queryClient } from "../lib/query-client";

import appCss from "../index.css?url";

// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type
export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootDocument,

  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
      {
        href: "https://fonts.googleapis.com",
        rel: "preconnect",
      },
      {
        crossOrigin: "anonymous",
        href: "https://fonts.gstatic.com",
        rel: "preconnect",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "ReLUXURY | Elevated Resale & Alterations Boutique",
      },
      {
        content:
          "ReLUXURY Consignment & Alterations Boutique - Elevated resale fashion and expert alterations in Maumelle, AR. Shop pre-loved luxury or book our alteration services.",
        name: "description",
      },
      {
        content: "#0a0a0a",
        name: "theme-color",
      },
      {
        content: "ReLUXURY | Elevated Resale & Alterations Boutique",
        property: "og:title",
      },
      {
        content:
          "Elevated resale fashion and expert alterations in Maumelle, AR.",
        property: "og:description",
      },
      {
        content: "website",
        property: "og:type",
      },
    ],
  }),
});

function RootDocument() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              <Outlet />
            </main>
            <Footer />
          </div>
          <Toaster richColors />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
