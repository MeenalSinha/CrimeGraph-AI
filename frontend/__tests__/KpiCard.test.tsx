import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import KpiCard from "@/components/KpiCard";

describe("KpiCard", () => {
  it("renders the label and value", () => {
    render(<KpiCard label="Total Incidents" value={2352} icon={<svg />} />);
    expect(screen.getByText("Total Incidents")).toBeInTheDocument();
    expect(screen.getByText("2352")).toBeInTheDocument();
  });

  it("shows a positive change in green with a plus sign", () => {
    render(<KpiCard label="Wanted Persons" value={42} change={3.1} icon={<svg />} />);
    const change = screen.getByText("+3.1%");
    expect(change).toBeInTheDocument();
    expect(change.className).toMatch(/emerald/);
  });

  it("shows a negative change without a plus sign, in red", () => {
    render(<KpiCard label="High Risk Areas" value={5} change={-2.4} icon={<svg />} />);
    const change = screen.getByText("-2.4%");
    expect(change).toBeInTheDocument();
    expect(change.className).toMatch(/red/);
  });

  it("renders without a change badge when change is undefined", () => {
    render(<KpiCard label="Active Investigations" value={128} icon={<svg />} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("handles string values (e.g. '--' loading placeholder)", () => {
    render(<KpiCard label="Total Incidents" value="--" icon={<svg />} />);
    expect(screen.getByText("--")).toBeInTheDocument();
  });
});
