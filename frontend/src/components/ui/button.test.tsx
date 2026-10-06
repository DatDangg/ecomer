import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders a pill button with its Vietnamese label", () => {
    render(<Button>Thêm vào giỏ</Button>);

    const button = screen.getByRole("button", { name: "Thêm vào giỏ" });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("min-h-11");
  });
});
