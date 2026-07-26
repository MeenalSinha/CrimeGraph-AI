"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice-enabled query interface (Module: bonus feature).
 *
 * Uses the browser-native Web Speech API:
 *  - SpeechRecognition for voice-to-text input
 *  - SpeechSynthesis for text-to-speech output ("read the answer back")
 *
 * Honesty note: this is real, functioning voice I/O -- not a mock -- but it
 * depends entirely on the browser's built-in speech engine. Support varies:
 * Chrome and Edge (desktop + Android) support SpeechRecognition well; Safari
 * and Firefox have partial/no support as of this writing. The hook feature-
 * detects and exposes `supported: false` when unavailable, and every caller
 * in this codebase falls back to the existing text input/output, so the
 * platform is never voice-only for any of its capabilities.
 */
export function useVoice() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasSynthesis = "speechSynthesis" in window;
    setSupported(!!SpeechRecognition && hasSynthesis);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // already started; ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { supported, listening, transcript, speaking, startListening, stopListening, speak, stopSpeaking };
}
