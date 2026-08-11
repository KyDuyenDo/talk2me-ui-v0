/**
 * useSpeechToTextFallback — browser-native SpeechRecognition wrapper, used as the "no AI
 * model downloaded yet" default for pronunciation practice (Shadowing / Pronounce mode):
 * transcribes what the user said so they can visually compare it against the target
 * sentence themselves, with no automatic scoring. Mirrors the working pattern already used
 * in SpeakingExercise.tsx (continuous + interimResults, accumulate transcript in onresult).
 */
import { useRef, useState } from 'react';

interface UseSpeechToTextFallbackResult {
  transcript: string;
  isListening: boolean;
  /** True if this browser has no SpeechRecognition API at all (e.g. non-Chromium browsers). */
  unsupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechToTextFallback(): UseSpeechToTextFallbackResult {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const start = () => {
    setTranscript('');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUnsupported(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        let combined = '';
        for (let i = 0; i < event.results.length; i++) {
          combined += event.results[i][0].transcript;
        }
        setTranscript(combined);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.warn('[SpeechToTextFallback] Failed to start:', err);
      setUnsupported(true);
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  const reset = () => {
    setTranscript('');
  };

  return { transcript, isListening, unsupported, start, stop, reset };
}
