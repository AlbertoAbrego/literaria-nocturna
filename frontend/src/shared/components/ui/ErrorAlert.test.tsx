import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorAlert from "./ErrorAlert";

describe("ErrorAlert", () => {
  it("renders the error message", () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("uses role='alert' for accessibility", () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies error styling classes", () => {
    render(<ErrorAlert message="Error" />);
    const el = screen.getByRole("alert");
    expect(el.className).toContain("text-error");
    expect(el.className).toContain("border-error");
  });

  it("renders an empty message without crashing", () => {
    render(<ErrorAlert message="" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
