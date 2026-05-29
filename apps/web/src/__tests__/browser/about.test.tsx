import { screen } from "@testing-library/react";
// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";

import { renderWithFileRoutes } from "./file-route-utils";

describe("About Page Route", () => {
  it("should render the about page correctly", async () => {
    // Render the app starting at the '/about' route
    renderWithFileRoutes(<div />, {
      initialLocation: "/about",
    });

    // Verify that the title and headings render correctly from src/routes/about.tsx
    const mainHeading = await screen.findByRole("heading", {
      name: /About ReLUXURY/i,
    });
    expect(mainHeading).toBeInTheDocument();

    const subHeading = screen.getByRole("heading", {
      name: /Elevated Resale & Alterations/i,
    });
    expect(subHeading).toBeInTheDocument();

    // Verify some values or texts
    expect(screen.getByText(/Sustainable Luxury/i)).toBeInTheDocument();
    expect(screen.getByText(/Curated Quality/i)).toBeInTheDocument();
  });
});
