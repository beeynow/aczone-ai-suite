export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

const createWavFromPCM = (pcmData: Uint8Array): Uint8Array => {
  const int16Data = new Int16Array(pcmData.length / 2);
  for (let i = 0; i < pcmData.length; i += 2) {
    int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
  }
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + int16Data.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, int16Data.byteLength, true);

  const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
  wavArray.set(new Uint8Array(wavHeader), 0);
  wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
  
  return wavArray;
};

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = createWavFromPCM(audioData);
      const buffer = wavData.buffer instanceof ArrayBuffer ? wavData.buffer : new ArrayBuffer(0);
      const audioBuffer = await this.audioContext.decodeAudioData(buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

export class VoiceMeetingClient {
  private ws: WebSocket | null = null;
  private audioRecorder: AudioRecorder | null = null;
  private audioQueue: AudioQueue | null = null;
  private audioContext: AudioContext | null = null;
  private isMuted = false;
  private transcript = "";

  constructor(
    private projectId: string,
    private onTranscript: (text: string, isFinal: boolean) => void,
    private onSpeaking: (isSpeaking: boolean) => void,
    private onError: (error: string) => void
  ) {}

  async connect() {
    try {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.audioQueue = new AudioQueue(this.audioContext);

      // Connect to our WebSocket relay
      this.ws = new WebSocket(
        `wss://${this.projectId}.supabase.co/functions/v1/meeting-voice-relay`
      );

      this.ws.onopen = () => {
        console.log("Connected to voice meeting");
        this.startAudioRecording();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Message type:", data.type);

          if (data.type === "response.audio.delta") {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await this.audioQueue?.addToQueue(bytes);
          } else if (data.type === "response.audio_transcript.delta") {
            this.transcript += data.delta;
            this.onTranscript(data.delta, false);
          } else if (data.type === "response.audio_transcript.done") {
            this.onTranscript(data.transcript, true);
            this.transcript = "";
          } else if (data.type === "input_audio_buffer.speech_started") {
            this.onSpeaking(false); // AI stops when user speaks
          } else if (data.type === "response.audio.done") {
            this.onSpeaking(false);
          } else if (data.type === "response.created") {
            this.onSpeaking(true);
          } else if (data.type === "error") {
            this.onError(data.message || "Voice connection error");
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.onError("Connection error");
      };

      this.ws.onclose = () => {
        console.log("Voice connection closed");
        this.cleanup();
      };
    } catch (error) {
      console.error("Error connecting:", error);
      this.onError("Failed to connect to voice meeting");
    }
  }

  private async startAudioRecording() {
    try {
      this.audioRecorder = new AudioRecorder((audioData) => {
        if (!this.isMuted && this.ws?.readyState === WebSocket.OPEN) {
          const base64Audio = encodeAudioForAPI(audioData);
          this.ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      });
      await this.audioRecorder.start();
      console.log("Audio recording started");
    } catch (error) {
      console.error("Error starting audio recording:", error);
      this.onError("Microphone access denied");
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  disconnect() {
    this.cleanup();
  }

  private cleanup() {
    this.audioRecorder?.stop();
    this.audioRecorder = null;
    this.audioQueue?.clear();
    this.audioQueue = null;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}