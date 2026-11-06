/**
 * Utilities for recording, encoding, generating, and playing Voice Audio Notes
 * in El Clóset de Jié with High-Definition Natural Voice (Voz Original).
 */

export interface RecordedAudioResult {
  audioUrl: string; // Base64 data URL
  duration: number; // in seconds
  blob?: Blob;
}

/**
 * Creates a synthetic melodic voice note WAV as a Base64 data URL.
 * Useful for demo pre-seeded voice notes or as a safe fallback when microphone
 * permissions are denied in sandboxed iframes.
 */
export function generateSyntheticVoiceNote(
  phraseType: 'saludo' | 'pregunta_talla' | 'consulta_envio' | 'oferta' = 'saludo'
): RecordedAudioResult {
  const sampleRate = 22050;
  let duration = 3.5;
  let frequencies: number[] = [440, 554.37, 659.25, 880]; // A major arpeggio

  if (phraseType === 'pregunta_talla') {
    duration = 4.2;
    frequencies = [392, 493.88, 587.33, 783.99, 587.33]; // G major
  } else if (phraseType === 'consulta_envio') {
    duration = 5.0;
    frequencies = [349.23, 440, 523.25, 698.46, 523.25, 440]; // F major
  } else if (phraseType === 'oferta') {
    duration = 4.5;
    frequencies = [523.25, 659.25, 783.99, 1046.5]; // C major
  }

  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  const freqDuration = duration / frequencies.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freqIndex = Math.min(frequencies.length - 1, Math.floor(t / freqDuration));
    const currentFreq = frequencies[freqIndex];

    // Combine fundamental with voice-like warm formants (simulating speech envelope)
    const voiceEnvelope = Math.sin((Math.PI * (t % freqDuration)) / freqDuration);
    const fundamental = Math.sin(2 * Math.PI * currentFreq * t);
    const harmonic2 = 0.4 * Math.sin(2 * Math.PI * currentFreq * 2 * t);
    const harmonic3 = 0.2 * Math.sin(2 * Math.PI * currentFreq * 3 * t);
    const formant = 0.15 * Math.sin(2 * Math.PI * 800 * t); // Speech formant warmth

    const sampleVal = (fundamental + harmonic2 + harmonic3 + formant) * voiceEnvelope * 0.7;
    // Scale to 16-bit signed PCM
    buffer[i] = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 28000)));
  }

  // Generate WAV Header
  const wavBytes = new Uint8Array(44 + numSamples * 2);
  const view = new DataView(wavBytes.buffer);

  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Write PCM data
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, buffer[i], true);
  }

  // Convert to Base64 data URL
  let binary = '';
  const len = wavBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(wavBytes[i]);
  }
  const base64Wav = btoa(binary);

  return {
    audioUrl: `data:audio/wav;base64,${base64Wav}`,
    duration: Math.round(duration * 10) / 10
  };
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * High-Definition Voice Note Recorder Manager
 * Preserves the speaker's original timbre, warm tone and clarity (sin efectos robóticos)
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private onLevelCallback: ((level: number) => void) | null = null;

  async start(onAudioLevel?: (level: number) => void): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Tu navegador o dispositivo no soporta grabación con micrófono.');
    }

    this.onLevelCallback = onAudioLevel || null;

    // Studio-fidelity constraints to preserve natural voice timbre (voz original)
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,  // Avoid artificial clipping of room resonance
          noiseSuppression: false,  // Prevents robotic / metallic suppression artifacts
          autoGainControl: true,   // Keeps microphone volume comfortable
          sampleRate: 48000,
          channelCount: 1
        }
      });
    } catch {
      // Fallback to standard audio if specialized constraints aren't accepted
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    // Set up real-time audio volume visualizer
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass && this.onLevelCallback) {
        this.audioCtx = new AudioCtxClass();
        const source = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const checkLevel = () => {
          if (!this.analyser || !this.onLevelCallback) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 128);
          this.onLevelCallback(normalized);
          this.animFrameId = requestAnimationFrame(checkLevel);
        };
        this.animFrameId = requestAnimationFrame(checkLevel);
      }
    } catch {
      // Non-fatal if audio analysis is unsupported
    }

    this.audioChunks = [];
    this.startTime = Date.now();

    // Prefer high-definition Opus / WebM / MP4 codecs
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      ''
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (!mime || (window.MediaRecorder && MediaRecorder.isTypeSupported(mime))) {
        selectedMime = mime;
        break;
      }
    }

    const options: MediaRecorderOptions = {
      ...(selectedMime ? { mimeType: selectedMime } : {}),
      audioBitsPerSecond: 128000 // 128 kbps high clarity voice quality
    };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch {
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);
    return true;
  }

  async stop(): Promise<RecordedAudioResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No hay grabación activa'));
        return;
      }

      this.cleanupAudioContext();

      this.mediaRecorder.onstop = async () => {
        const durationSec = Math.max(1, Math.round(((Date.now() - this.startTime) / 1000) * 10) / 10);
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });

        // Cleanup stream tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            audioUrl: reader.result as string,
            duration: durationSec,
            blob
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel() {
    this.cleanupAudioContext();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }

  private cleanupAudioContext() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {
        // ignore
      }
      this.audioCtx = null;
    }
    this.analyser = null;
    this.onLevelCallback = null;
  }
}

/**
 * Format duration in mm:ss format
 */
export function formatAudioDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
