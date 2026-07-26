import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the correct URL and parses JSON on success", async () => {
    const mockResponse = { total_incidents: { value: 100, change_pct: 5 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    }) as any;

    const result = await api.kpis();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/dashboard/kpis"),
      expect.objectContaining({ cache: "no-store" })
    );
    expect(result).toEqual(mockResponse);
  });

  it("sends a POST with a JSON body for predictRisk", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ risk_score: 42 }),
    }) as any;

    await api.predictRisk("Old City", 21, 4, "Rain", true);

    const [, options] = (global.fetch as any).mock.calls[0];
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body).toEqual({ ward: "Old City", hour: 21, weekday: 4, weather: "Rain", is_festival_day: true });
  });

  it("throws a descriptive error when the response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    }) as any;

    await expect(api.kpis()).rejects.toThrow(/429/);
  });

  it("URL-encodes path parameters (e.g. ward names with spaces)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as any;

    await api.forecast("Central Zone");

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toContain("Central%20Zone");
  });

  it("builds correct report URLs for both PDF and CSV formats", () => {
    expect(api.reportUrl("crime-trend", "pdf")).toMatch(/crime-trend\.pdf$/);
    expect(api.reportUrl("patrol", "csv")).toMatch(/patrol\.csv$/);
    expect(api.reportUrl("network")).toMatch(/network\.pdf$/); // default format
  });
});
