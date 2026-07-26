import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommandConsole from "@/components/CommandConsole";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    networkStats: vi.fn().mockResolvedValue({ node_count: 4640, edge_count: 8138 }),
    chat: vi.fn().mockResolvedValue({ answer: "Central Zone shows a high risk band.", facts: {}, source: "risk_service" }),
  },
}));

describe("CommandConsole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the initial greeting message", async () => {
    render(<CommandConsole />);
    expect(screen.getByText(/Command AI online/i)).toBeInTheDocument();
    await waitFor(() => expect(api.networkStats).toHaveBeenCalled());
  });

  it("loads and displays graph node/edge counts", async () => {
    render(<CommandConsole />);
    await waitFor(() => {
      expect(screen.getByText("4640")).toBeInTheDocument();
      expect(screen.getByText("8138")).toBeInTheDocument();
    });
  });

  it("sends a chat query and displays the response", async () => {
    const user = userEvent.setup();
    render(<CommandConsole />);

    const input = screen.getByLabelText("Ask Command AI");
    await user.type(input, "why is central zone high risk");
    await user.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => {
      expect(api.chat).toHaveBeenCalledWith("why is central zone high risk");
    });
    await waitFor(() => {
      expect(screen.getByText("Central Zone shows a high risk band.")).toBeInTheDocument();
    });
  });

  it("does not send an empty query", async () => {
    const user = userEvent.setup();
    render(<CommandConsole />);
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(api.chat).not.toHaveBeenCalled();
  });

  it("does not render a mic button in jsdom (Web Speech API unsupported)", async () => {
    render(<CommandConsole />);
    await waitFor(() => expect(api.networkStats).toHaveBeenCalled());
    expect(screen.queryByLabelText(/voice input/i)).not.toBeInTheDocument();
    expect(screen.getByText(/isn't supported in this browser/i)).toBeInTheDocument();
  });
});
