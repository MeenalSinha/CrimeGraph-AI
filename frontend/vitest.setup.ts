import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom doesn't implement matchMedia, ResizeObserver, or the Web Speech API --
// several components (charts, the voice hook) touch these, so provide minimal
// mocks rather than letting every test that renders them fail on unrelated
// missing-browser-API errors.

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error -- test shim
window.ResizeObserver = MockResizeObserver;

// Web Speech API is not implemented in jsdom at all; useVoice.ts already
// feature-detects for this (`supported: false`), so leaving these undefined
// is itself a real test of that fallback path -- no mock needed here.
