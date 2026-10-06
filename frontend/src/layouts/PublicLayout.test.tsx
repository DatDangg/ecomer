import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { PublicLayout } from "@/layouts/PublicLayout";

describe("PublicLayout", () => {
  it("renders the brand, primary navigation and main landmark", () => {
    render(
      <MemoryRouter>
        <PublicLayout />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Chợ Việt").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Sản phẩm" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
