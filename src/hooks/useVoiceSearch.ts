import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browsers that support it
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

interface UseVoiceSearchOptions {
  lang?: string;
  onTranscriptChange?: (text: string, isFinal: boolean) => void;
  onFinalResult?: (finalText: string) => void;
  silenceTimeoutMs?: number; // Auto-stop after silence
}

export function useVoiceSearch({
  lang = 'es-NI',
  onTranscriptChange,
  onFinalResult,
  silenceTimeoutMs = 2500
}: UseVoiceSearchOptions = {}) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const accumulatedFinalRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  // Check browser support on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition might already be stopped
      }
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after user stopped speaking
      stopListening();
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, silenceTimeoutMs, stopListening]);

  const abortListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        // Ignore
      }
    }
    setIsListening(false);
    setLiveTranscript('');
    accumulatedFinalRef.current = '';
  }, [clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'La búsqueda por voz no es compatible con este navegador. Te recomendamos usar Google Chrome, Microsoft Edge o Safari.'
      );
      return;
    }

    // If already listening, stop first
    if (isListening && recognitionRef.current) {
      stopListening();
      return;
    }

    setErrorMessage(null);
    setLiveTranscript('');
    accumulatedFinalRef.current = '';

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        resetSilenceTimer();

        // Optional haptic vibration on mobile
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate?.(40);
          } catch (e) {
            // Ignore
          }
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentInterim = '';
        let currentFinal = accumulatedFinalRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0]?.transcript || '';

          if (result.isFinal) {
            currentFinal = currentFinal
              ? `${currentFinal} ${transcriptText.trim()}`
              : transcriptText.trim();
            accumulatedFinalRef.current = currentFinal;
          } else {
            currentInterim += transcriptText;
          }
        }

        const combinedText = (currentFinal + ' ' + currentInterim).trim();
        setLiveTranscript(combinedText);

        if (combinedText) {
          onTranscriptChange?.(combinedText, false);
        }

        resetSilenceTimer();
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        clearSilenceTimer();
        setIsListening(false);

        if (event.error === 'no-speech') {
          setErrorMessage('No detectamos ninguna voz. Presiona el micrófono e inténtalo de nuevo.');
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage('Permiso de micrófono bloqueado. Habilita el acceso en los ajustes de tu navegador.');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('No se encontró un micrófono disponible en tu dispositivo.');
        } else if (event.error === 'network') {
          setErrorMessage('Error de conexión al procesar el audio por voz.');
        } else if (event.error !== 'aborted') {
          setErrorMessage(`No se pudo procesar la voz (${event.error}).`);
        }
      };

      recognition.onend = () => {
        clearSilenceTimer();
        setIsListening(false);

        const finalOutput = (accumulatedFinalRef.current || liveTranscript).trim();
        if (finalOutput) {
          onTranscriptChange?.(finalOutput, true);
          onFinalResult?.(finalOutput);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('Error starting speech recognition:', err);
      setIsListening(false);
      setErrorMessage('No fue posible activar el micrófono. Intenta recargar la página.');
    }
  }, [
    isListening,
    lang,
    liveTranscript,
    onFinalResult,
    onTranscriptChange,
    resetSilenceTimer,
    stopListening,
    clearSilenceTimer
  ]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [clearSilenceTimer]);

  return {
    isSupported,
    isListening,
    liveTranscript,
    errorMessage,
    startListening,
    stopListening,
    abortListening,
    toggleListening,
    clearError
  };
}
