import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoice } from "@/hooks/useVoice";

describe("useVoice", () => {
  it("reports supported: false in jsdom (no SpeechRecognition/SpeechSynthesis implemented)", () => {
    // This is a real, meaningful assertion: jsdom deliberately does not
    // implement the Web Speech API, so this test exercises the exact
    // fallback path a Safari/Firefox user hits in production -- the hook
    // must degrade gracefully rather than throw.
    const { result } = renderHook(() => useVoice());
    expect(result.current.supported).toBe(false);
    expect(result.current.listening).toBe(false);
    expect(result.current.transcript).toBe("");
  });

  it("startListening does not throw when unsupported (no-op guard)", () => {
    const { result } = renderHook(() => useVoice());
    expect(() => {
      act(() => {
        result.current.startListening();
      });
    }).not.toThrow();
    // Listening should stay false since there's no recognizer to start.
    expect(result.current.listening).toBe(false);
  });

  it("speak() does not throw when speechSynthesis is unavailable", () => {
    const { result } = renderHook(() => useVoice());
    expect(() => {
      act(() => {
        result.current.speak("test");
      });
    }).not.toThrow();
  });
});
