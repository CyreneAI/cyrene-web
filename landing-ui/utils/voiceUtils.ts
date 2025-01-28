export interface VoiceConfig {
  useMockData: boolean;
  modelPath: string;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

class VoiceManager {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
      }
    }
  }

  startListening(onResult: (text: string) => void, onEnd: () => void): void {
    if (!this.recognition) {
      console.error('Speech recognition not supported');
      return;
    }

    if (this.isListening) return;

    this.isListening = true;
    
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (!this.recognition || !this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
  }

  async generateVoice(text: string): Promise<string | null> {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to generate voice');
      
      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Error generating voice:', error);
      return null;
    }
  }
}

export default VoiceManager; 