(function () {
  // Default configuration - can be overridden by window.aiChatConfig
  const defaultConfig = {
    chatUrl:
      "https://cyrene.us01.erebrus.io/b450db11-332b-0fc2-a144-92824a34f699/message",
    agentName: "Assistant",
    primaryColor: "#1366d9",
    position: "bottom-right",
    size: "medium", // New size parameter: small, medium, large
    greeting: null,
    placeholder: "Type your message...",
    buttonIcon: "💬",
    theme: "light",
    voiceModel: "af_bella", // Default voice model
    ttsApiUrl: "https://kokoro.cyreneai.com", // Default TTS API URL
    enableVoice: true, // Enable voice features by default
    autoPlayVoiceResponses: true, // Auto-play voice responses in voice mode
  };

  // Merge user config with defaults
  const config = Object.assign({}, defaultConfig, window.aiChatConfig || {});

  // Position styles
  const positions = {
    "bottom-right": "bottom: 20px; right: 20px;",
    "bottom-left": "bottom: 20px; left: 20px;",
    "top-right": "top: 20px; right: 20px;",
    "top-left": "top: 20px; left: 20px;",
  };

  // Size configurations
  const sizeConfigs = {
    small: {
      maxWidth: "300px",
      minWidth: "250px",
    },
    medium: {
      maxWidth: "400px",
      minWidth: "350px",
    },
    large: {
      maxWidth: "600px",
      minWidth: "400px",
    },
  };

  // Get size configuration
  const sizeConfig = sizeConfigs[config.size] || sizeConfigs["medium"];

  // API endpoints
  const agentChatUrl = config.chatUrl;
  const agentInfoUrl = config.agentInfoUrl;
  const ttsApiUrl = config.ttsApiUrl;

  let agentInfo;
  async function loadAgentInfo() {
    try {
      if (agentInfoUrl) {
        const response = await fetch(agentInfoUrl);
        agentInfo = await response.json();
      }
    } catch (error) {
      console.error("Error fetching agent info:", error);
    }
  }
  loadAgentInfo();

  // Voice Manager
  class VoiceManager {
    constructor() {
      this.recognition = this.initSpeechRecognition();
      this.isListening = false;
      this.currentAudio = null;
      this.audioQueue = [];
      this.isPlaying = false;
    }

    initSpeechRecognition() {
      if (typeof window !== "undefined") {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US'; // Set language
          return recognition;
        }
      }
      return null;
    }

    startListening(onResult, onEnd, onError) {
      if (!this.recognition) {
        console.error("Speech recognition not supported");
        if (onError) onError("Speech recognition not supported");
        return;
      }

      if (this.isListening) return;

      this.isListening = true;

      this.recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        onResult(text);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        console.error("Speech recognition error:", event.error);
        if (onError) onError(event.error);
        onEnd();
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        console.error("Failed to start speech recognition:", error);
        if (onError) onError("Failed to start speech recognition");
        onEnd();
      }
    }

    stopListening() {
      if (!this.recognition || !this.isListening) return;
      this.recognition.stop();
      this.isListening = false;
    }

    async generateVoice(text, voiceModel) {
      console.log("Attempting to generate voice for:", text);
      
      try {
        // Clean the text for better TTS
        const cleanText = this.cleanTextForTTS(text);
        console.log("Cleaned text:", cleanText);
        
        console.log("Making TTS API call to:", `${ttsApiUrl}/v1/audio/speech`);
        
        const requestBody = {
          model: "kokoro",
          input: cleanText,
          voice: voiceModel || config.voiceModel,
          response_format: "mp3",
          speed: 1,
        };
        
        console.log("Request body:", requestBody);
        
        const response = await fetch(`${ttsApiUrl}/v1/audio/speech`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("TTS API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("TTS API error response:", errorText);
          
          // Fallback to browser TTS if API fails
          console.log("Falling back to browser TTS");
          return this.generateBrowserTTS(cleanText);
        }

        const audioBlob = await response.blob();
        console.log("Audio blob size:", audioBlob.size, "bytes");
        
        if (audioBlob.size === 0) {
          console.warn("Empty audio response, trying browser TTS fallback");
          return this.generateBrowserTTS(cleanText);
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log("Generated audio URL:", audioUrl);
        
        return audioUrl;
      } catch (error) {
        console.error("Error generating voice:", error);
        console.log("Falling back to browser TTS");
        return this.generateBrowserTTS(text);
      }
    }

    async generateBrowserTTS(text, isForMessageAudio = false) {
      return new Promise((resolve) => {
        try {
          if ('speechSynthesis' in window) {
            console.log("Using browser speech synthesis");
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Try to find a good voice
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => 
              voice.lang.includes('en') && voice.name.includes('Google')
            ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
            
            if (preferredVoice) {
              utterance.voice = preferredVoice;
                console.log("Using voice:", preferredVoice.name);
            }
            
            utterance.onstart = () => {
              console.log("Browser TTS started");
            };
            
            utterance.onend = () => {
              console.log("Browser TTS ended");
            };
            
            utterance.onerror = (error) => {
              console.error("Browser TTS error:", error);
            };
            
            speechSynthesis.speak(utterance);
            
            // Return a special marker for browser TTS
            resolve('BROWSER_TTS');
          } else {
            console.warn("Browser TTS not supported");
            resolve(null);
          }
        } catch (error) {
          console.error("Browser TTS error:", error);
          resolve(null);
        }
      });
    }

    cleanTextForTTS(text) {
      // Remove markdown formatting and clean text for better TTS
      return text
        .replace(/[*_`~]/g, '') // Remove markdown formatting
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\n+/g, '. ') // Convert newlines to periods
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }

    async playVoiceResponse(audioUrl, onPlayStart, onPlayEnd) {
      console.log("Attempting to play audio:", audioUrl);
      
      if (!audioUrl) {
        console.warn("No audio URL provided");
        return;
      }

      // Handle browser TTS (speechSynthesis) case
      if (audioUrl === 'BROWSER_TTS') {
        console.log("Browser TTS is already playing, managing state");
        this.isPlaying = true;
        if (onPlayStart) onPlayStart();
        
        // Monitor speech synthesis to know when it's done
        const checkSpeechEnd = () => {
          if (!speechSynthesis.speaking) {
            this.isPlaying = false;
            if (onPlayEnd) onPlayEnd();
          } else {
            setTimeout(checkSpeechEnd, 100);
          }
        };
        checkSpeechEnd();
        return;
      }

      // Stop any currently playing audio
      this.stopCurrentAudio();

      try {
        this.currentAudio = new Audio(audioUrl);
        this.isPlaying = true;

        // Add event listeners
        this.currentAudio.addEventListener('loadstart', () => {
          console.log("Audio loading started");
          if (onPlayStart) onPlayStart();
        });

        this.currentAudio.addEventListener('canplay', () => {
          console.log("Audio can start playing");
        });

        this.currentAudio.addEventListener('play', () => {
          console.log("Audio started playing");
        });

        this.currentAudio.addEventListener('ended', () => {
          console.log("Audio finished playing");
          this.isPlaying = false;
          this.currentAudio = null;
          if (onPlayEnd) onPlayEnd();
        });

        this.currentAudio.addEventListener('error', (error) => {
          console.error("Audio playback error:", error);
          console.error("Audio error details:", this.currentAudio.error);
          this.isPlaying = false;
          this.currentAudio = null;
          if (onPlayEnd) onPlayEnd();
        });

        // Attempt to play
        console.log("Starting audio playback");
        const playPromise = this.currentAudio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log("Audio playback started successfully");
        }
        
      } catch (error) {
        console.error("Failed to play audio:", error);
        
        // Check if it's an autoplay policy error
        if (error.name === 'NotAllowedError') {
          console.warn("Autoplay was prevented by browser policy. User interaction required.");
          alert("Click OK to enable voice responses. Your browser requires user interaction to play audio.");
          
          // Try to play again after user interaction
          try {
            if (this.currentAudio) {
              await this.currentAudio.play();
              console.log("Audio playback started after user interaction");
            }
          } catch (retryError) {
            console.error("Still failed to play audio after user interaction:", retryError);
          }
        }
        
        this.isPlaying = false;
        this.currentAudio = null;
        if (onPlayEnd) onPlayEnd();
      }
    }

    stopCurrentAudio() {
      // Stop browser TTS if it's speaking
      if ('speechSynthesis' in window && speechSynthesis.speaking) {
        console.log("Stopping browser TTS");
        speechSynthesis.cancel();
      }
      
      if (this.currentAudio) {
        console.log("Stopping current audio");
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }
      this.isPlaying = false;
    }

    isCurrentlyPlaying() {
      return this.isPlaying;
    }
  }

  const voiceManager = new VoiceManager();

  // Inject CSS with dynamic sizing
  const style = document.createElement("style");
  style.textContent = `
    /* Widget Container */
    #agent-widget {
        position: fixed;
        ${positions[config.position]}
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Chat Button */
    #agent-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${config.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    #agent-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 25px rgba(0,0,0,0.25);
    }

    #agent-button:active {
        transform: scale(0.98);
    }

    /* Button pulse animation when closed */
    #agent-button.pulse::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        background: ${config.primaryColor};
        animation: pulse 2s infinite;
        z-index: -1;
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.3); opacity: 0; }
    }

    /* Chat Panel with dynamic sizing */
    #agent-panel {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: min(${sizeConfig.maxWidth}, 85vw);
        min-width: ${sizeConfig.minWidth || "300px"};
        aspect-ratio: 1 / 1.4;
        max-height: 85vh;
        height: auto;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        transform: translateY(20px) scale(0.95);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #e2e8f0;
    }

    #agent-panel.open {
        transform: translateY(0) scale(1);
        opacity: 1;
        visibility: visible;
    }

    #agent-panel.minimized {
        height: 60px;
    }

    /* Position adjustments for different corners */
    #agent-widget[data-position="bottom-left"] #agent-panel {
        right: auto;
        left: 0;
    }

    #agent-widget[data-position="top-right"] #agent-panel {
        bottom: auto;
        top: 80px;
    }

    #agent-widget[data-position="top-left"] #agent-panel {
        bottom: auto;
        top: 80px;
        right: auto;
        left: 0;
    }

    /* Header */
    #agent-header {
        padding: 20px;
        background: linear-gradient(135deg, ${config.primaryColor}, #1e40af);
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        flex-shrink: 0;
    }

    #agent-header:hover {
        background: linear-gradient(135deg, #1e40af, ${config.primaryColor});
    }

    .agent-agent-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .agent-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 600;
        flex-shrink: 0;
    }

    .agent-agent-details h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .agent-status {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .agent-status::before {
        content: '';
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        display: inline-block;
    }

    .agent-controls {
        display: flex;
        gap: 8px;
    }

    .agent-control-btn {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    #agent-close:hover {
        background: rgba(255,255,255,0.2);
    }

    /* Messages */
    #agent-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    #agent-panel.minimized #agent-messages {
        display: none;
    }

    .agent-message {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }

    .agent-message.user {
        flex-direction: row-reverse;
    }

    .agent-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        flex-shrink: 0;
    }

    .agent-message.user .agent-message-avatar {
        background: ${config.primaryColor};
        color: white;
    }

    .agent-message.bot .agent-message-avatar {
        background: #e5e7eb;
        color: #6b7280;
    }

    .agent-message-content {
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 18px;
        line-height: 1.4;
        word-wrap: break-word;
        position: relative;
    }

    .agent-message.user .agent-message-content {
        background: ${config.primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
    }

    .agent-message.bot .agent-message-content {
        background: white;
        color: #374151;
        border: 1px solid #e5e7eb;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .agent-timestamp {
        font-size: 11px;
        color: #9ca3af;
        text-align: center;
        margin-top: 4px;
    }

    /* Input Area */
    #agent-input-area {
        padding: 16px 20px 20px;
        background: white;
        border-top: 1px solid #e5e7eb;
        flex-shrink: 0;
    }

    #agent-panel.minimized #agent-input-area {
        display: none;
    }

    .agent-input-container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    #agent-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        font-size: 14px;
        outline: none;
        resize: none;
        font-family: inherit;
        max-height: 100px;
        min-height: 44px;
        transition: border-color 0.2s;
        background: #f9fafb;
    }

    #agent-input:focus {
        border-color: ${config.primaryColor};
        background: white;
    }

    #agent-input::placeholder {
        color: #9ca3af;
    }

    #agent-send {
        background: ${config.primaryColor};
        border: none;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    #agent-send:hover:not(:disabled) {
        background: #1e40af;
        transform: scale(1.05);
    }

    #agent-send:disabled {
        background: #d1d5db;
        cursor: not-allowed;
        transform: none;
    }

    /* Typing Indicator */
    .agent-typing {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        width: fit-content;
    }

    .agent-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #9ca3af;
        animation: agent-typing 1.4s infinite ease-in-out;
    }

    .agent-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .agent-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    .agent-typing-dot:nth-child(3) { animation-delay: 0s; }

    @keyframes agent-typing {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
    }

    /* Notification Badge */
    .agent-notification {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        animation: notification-bounce 0.5s ease-out;
    }

    @keyframes notification-bounce {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }

    /* Audio message controls */
    .agent-audio-control {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .agent-audio-control:hover {
        color: ${config.primaryColor};
        background: rgba(0,0,0,0.05);
        transform: scale(1.1);
    }

    .agent-audio-control.playing {
        color: ${config.primaryColor};
        background: rgba(19, 102, 217, 0.1);
    }

    .agent-audio-control:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Loading animation for audio controls */
    .agent-audio-control svg circle {
        transform-origin: center;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Voice mode UI */
    .agent-voice-mode {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #f8fafc;
        border-radius: 16px;
        margin: 10px;
    }

    .agent-voice-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${config.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin: 10px;
        transition: all 0.3s;
    }

    .agent-voice-btn:hover {
        transform: scale(1.05);
    }

    .agent-voice-btn.listening {
        background: #ef4444;
        animation: pulse 1.5s infinite;
    }

    .agent-voice-btn.speaking {
        background: #10b981;
        animation: pulse 1.5s infinite;
    }

    .agent-transcription {
        margin-top: 10px;
        color: #6b7280;
        font-size: 14px;
        text-align: center;
    }

    .agent-voice-status {
        margin-top: 10px;
        color: #374151;
        font-size: 12px;
        text-align: center;
        font-weight: 500;
    }

    /* Voice mode toggle */
    .agent-voice-toggle {
        
        background: ${config.primaryColor};
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .agent-voice-toggle:hover {
        background: #1e40af;
    }

    .agent-voice-toggle.active {
        background: #ef4444;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
        #agent-panel {
            width: calc(100vw - 40px);
            aspect-ratio: 1 / 1.4;
            max-height: 85vh;
            height: auto;
            right: 20px;
            left: 20px;
            max-width: none;
            min-width: none;
        }

        #agent-widget[data-position="bottom-left"] #agent-panel {
            left: 20px;
            right: 20px;
        }

        #agent-header {
            padding: 16px;
        }

        .agent-avatar {
            width: 32px;
            height: 32px;
            font-size: 14px;
        }

        .agent-agent-details h3 {
            font-size: 14px;
        }

        #agent-messages {
            padding: 16px;
        }

        #agent-input-area {
            padding: 12px 16px 16px;
        }
    }

    /* Extra small screens for large size */
    @media (max-width: 480px) {
        #agent-panel {
            width: calc(100vw - 20px);
            right: 10px;
            left: 10px;
        }

        #agent-widget[data-position="bottom-left"] #agent-panel {
            left: 10px;
            right: 10px;
        }
    }

    /* Large screens adjustments */
    @media (min-width: 1200px) {
        #agent-panel {
            ${config.size === "large" ? "max-width: 900px;" : ""}
            ${config.size === "medium" ? "max-width: 650px;" : ""}
        }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        #agent-panel {
            border: 2px solid #000;
        }
        
        .agent-message.bot .agent-message-content {
            border: 2px solid #374151;
        }
    }

    /* Scrollbar styling */
    #agent-messages::-webkit-scrollbar {
        width: 6px;
    }

    #agent-messages::-webkit-scrollbar-track {
        background: transparent;
    }

    #agent-messages::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
    }

    #agent-messages::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
    }
  `;
  document.head.appendChild(style);

  // Create widget HTML
  const widget = document.createElement("div");
  widget.id = "agent-widget";
  widget.setAttribute("data-position", config.position);
  widget.setAttribute("data-size", config.size);
  widget.innerHTML = `
    <button id="agent-button" class="pulse">
      ${config.buttonIcon}
    </button>
    
    <div id="agent-panel">
      <div id="agent-header">
        <div class="agent-agent-info">
          <div class="agent-avatar">
            AI
          </div>
          <div class="agent-agent-details">
            <h3>${config.agentName}</h3>
            <p class="agent-status">Online</p>
          </div>
        </div>
        <div class="agent-controls">
          <button id="agent-minimize" class="agent-control-btn"></button>
          <button id="agent-close" class="agent-control-btn" title="Close">-</button>
        </div>
      </div>
      
      <div id="agent-messages">
        <div class="agent-message bot">
          <div class="agent-message-avatar">AI</div>
          <div class="agent-message-content">
            ${config.greeting || `How can I help you today?`}
            <div class="agent-timestamp">${new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</div>
          </div>
        </div>
      </div>
      
      <div id="agent-input-area">
        <div class="agent-input-container">
          <textarea id="agent-input" placeholder="${
            config.placeholder
          }" rows="1"></textarea>
          ${
        config.enableVoice
          ? `
      <button id="agent-voice-toggle" class="agent-voice-toggle" title="Voice Mode">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" fill="currentColor"/>
          <path d="M5 11C5.55228 11 6 11.4477 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 11.4477 18.4477 11 19 11C19.5523 11 20 11.4477 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 11.4477 4.44772 11 5 11Z" fill="currentColor"/>
          <path d="M12 19C12.5523 19 13 19.4477 13 20V23C13 23.5523 12.5523 24 12 24C11.4477 24 11 23.5523 11 23V20C11 19.4477 11.4477 19 12 19Z" fill="currentColor"/>
        </svg>
      </button>
      `
          : ""
      }
          <button id="agent-send">→</button>
        </div>
      </div>
      
      <div id="agent-voice-ui" style="display: none;">
        <div class="agent-voice-mode">
          <button id="agent-voice-btn" class="agent-voice-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" fill="currentColor"/>
              <path d="M5 11C5.55228 11 6 11.4477 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 11.4477 18.4477 11 19 11C19.5523 11 20 11.4477 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 11.4477 4.44772 11 5 11Z" fill="currentColor"/>
              <path d="M12 19C12.5523 19 13 19.4477 13 20V23C13 23.5523 12.5523 24 12 24C11.4477 24 11 23.5523 11 23V20C11 19.4477 11.4477 19 12 19Z" fill="currentColor"/>
            </svg>
          </button>
          <div id="agent-transcription" class="agent-transcription"></div>
          <div id="agent-voice-status" class="agent-voice-status"></div>
          <button id="agent-exit-voice" class="agent-control-btn" style="margin-top: 10px;">
            Exit Voice Mode
          </button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(widget);

  // Widget functionality
  const button = document.getElementById("agent-button");
  const panel = document.getElementById("agent-panel");
  const closeBtn = document.getElementById("agent-close");
  const minimizeBtn = document.getElementById("agent-minimize");
  const header = document.getElementById("agent-header");
  const input = document.getElementById("agent-input");
  const sendBtn = document.getElementById("agent-send");
  const messagesContainer = document.getElementById("agent-messages");
  const voiceToggle = config.enableVoice
    ? document.getElementById("agent-voice-toggle")
    : null;
  const voiceUI = document.getElementById("agent-voice-ui");
  const voiceBtn = document.getElementById("agent-voice-btn");
  const transcriptionEl = document.getElementById("agent-transcription");
  const voiceStatusEl = document.getElementById("agent-voice-status");
  const exitVoiceBtn = document.getElementById("agent-exit-voice");

  let isOpen = false;
  let isMinimized = false;
  let isLoading = false;
  let unreadCount = 0;
  let isVoiceMode = false;
  let isRecording = false;
  let isSpeaking = false;
  let audioElements = {}; // To store audio elements for each message
  let currentlyPlayingAudio = null;

  // Event listeners
  button.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", closePanel);
  minimizeBtn.addEventListener("click", toggleMinimize);
  header.addEventListener("click", () => {
    if (isMinimized) toggleMinimize();
  });
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  if (config.enableVoice) {
    voiceToggle.addEventListener("click", toggleVoiceMode);
    voiceBtn.addEventListener("click", handleVoiceInput);
    exitVoiceBtn.addEventListener("click", exitVoiceMode);
  }

  // Auto-resize textarea
  input.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";
  });

  function togglePanel() {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    button.classList.remove("pulse");
    if (!isVoiceMode) {
      input.focus();
    }
    clearNotifications();
  }

  function closePanel() {
    isOpen = false;
    isMinimized = false;
    panel.classList.remove("open", "minimized");
    button.classList.add("pulse");
    exitVoiceMode();
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    panel.classList.toggle("minimized", isMinimized);
    if (!isMinimized && !isVoiceMode) {
      input.focus();
    }
  }

  function updateVoiceStatus(status) {
    if (voiceStatusEl) {
      voiceStatusEl.textContent = status;
    }
  }

  function addMessage(content, isUser = false, audioUrl = null) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `agent-message ${isUser ? "user" : "bot"}`;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isUser) {
      messageDiv.innerHTML = `
        <div class="agent-message-avatar">You</div>
        <div class="agent-message-content">
          ${escapeHtml(content)}
          <div class="agent-timestamp">${timestamp}</div>
        </div>
      `;
    } else {
      // Always add audio controls for bot messages (even if no audio URL initially)
      const audioControls = `
        <button class="agent-audio-control" data-message-text="${escapeHtml(content)}" data-audio-id="${messagesContainer.children.length}" title="Play message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
          </svg>
        </button>
      `;

      messageDiv.innerHTML = `
        <div class="agent-message-avatar">AI</div>
        <div class="agent-message-content">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${audioControls}
            <div>${escapeHtml(content)}</div>
          </div>
          <div class="agent-timestamp">${timestamp}</div>
        </div>
      `;

      const audioId = messagesContainer.children.length;
      
      // Store the message text for potential re-generation
      if (!window.messageTexts) window.messageTexts = {};
      window.messageTexts[audioId] = content;

      if (audioUrl) {
        console.log("Created audio element for message:", audioId, "URL:", audioUrl);
        
        audioElements[audioId] = new Audio(audioUrl);
        audioElements[audioId].addEventListener("play", () => {
          const btn = messageDiv.querySelector(".agent-audio-control");
          if (btn) {
            btn.classList.add("playing");
            btn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H8V20H6V4ZM16 4H18V20H16V4Z" fill="currentColor"/>
              </svg>
            `;
          }
          currentlyPlayingAudio = audioId;
        });
        
        audioElements[audioId].addEventListener("pause", () => {
          const btn = messageDiv.querySelector(".agent-audio-control");
          if (btn) {
            btn.classList.remove("playing");
            btn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
            `;
          }
          if (currentlyPlayingAudio === audioId) {
            currentlyPlayingAudio = null;
          }
        });
        
        audioElements[audioId].addEventListener("ended", () => {
          const btn = messageDiv.querySelector(".agent-audio-control");
          if (btn) {
            btn.classList.remove("playing");
            btn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
            `;
          }
          if (currentlyPlayingAudio === audioId) {
            currentlyPlayingAudio = null;
          }
        });

        audioElements[audioId].addEventListener("error", (error) => {
          console.error("Audio playback error for message", audioId, ":", error);
          const btn = messageDiv.querySelector(".agent-audio-control");
          if (btn) {
            btn.classList.remove("playing");
            btn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
            `;
          }
          if (currentlyPlayingAudio === audioId) {
            currentlyPlayingAudio = null;
          }
        });
      }

      // Add click handler for audio control
      messageDiv
        .querySelector(".agent-audio-control")
        ?.addEventListener("click", async (e) => {
          const audioId = parseInt(e.currentTarget.getAttribute("data-audio-id"));
          const messageText = e.currentTarget.getAttribute("data-message-text");
          await handleAudioPlayback(audioId, messageText, e.currentTarget);
        });
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add notification if panel is closed or minimized
    if (!isOpen || isMinimized) {
      if (!isUser) {
        showNotification();
      }
    }
  }

  async function playVoiceResponse(audioUrl) {
    if (!audioUrl || !isVoiceMode) return;

    try {
      isSpeaking = true;
      voiceBtn.classList.add("speaking");
      updateVoiceStatus("AI is speaking");

      await voiceManager.playVoiceResponse(
        audioUrl,
        () => {
          // On play start
          console.log("Voice response started playing");
        },
        () => {
          // On play end
          isSpeaking = false;
          voiceBtn.classList.remove("speaking");
          updateVoiceStatus("Ready to listen");
          console.log("Voice response finished playing");
        }
      );
    } catch (error) {
      console.error("Error playing voice response:", error);
      isSpeaking = false;
      voiceBtn.classList.remove("speaking");
      updateVoiceStatus("Ready to listen");
    }
  }

  async function handleAudioPlayback(audioId, messageText, buttonElement) {
    console.log("Audio playback requested for message:", audioId, "Text:", messageText);

    try {
      // If currently playing this audio, pause it
      if (currentlyPlayingAudio === audioId && audioElements[audioId]) {
        console.log("Pausing currently playing audio");
        audioElements[audioId].pause();
        return;
      }

      // Stop any other playing audio
      if (currentlyPlayingAudio !== null && currentlyPlayingAudio !== audioId && audioElements[currentlyPlayingAudio]) {
        console.log("Stopping other playing audio");
        audioElements[currentlyPlayingAudio].pause();
      }

      // Stop voice manager audio if playing (from voice mode responses)
      if (voiceManager.isCurrentlyPlaying()) {
        console.log("Stopping voice manager audio");
        voiceManager.stopCurrentAudio();
      }

      // Show loading state
      buttonElement.classList.add("playing");
      buttonElement.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="32" stroke-dashoffset="32">
            <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `;

      // If audio element doesn't exist or is broken, generate new audio
      if (!audioElements[audioId] || audioElements[audioId].error) {
        console.log("Generating new audio for message");

        const audioUrl = await voiceManager.generateVoice(messageText, config.voiceModel);
        
        if (audioUrl === 'BROWSER_TTS') {
          // Browser TTS is already playing, just update UI
          console.log("Using browser TTS");
          
          // Monitor when speech ends
          const checkSpeechEnd = () => {
            if (!speechSynthesis.speaking) {
              buttonElement.classList.remove("playing");
              buttonElement.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                </svg>
              `;
              currentlyPlayingAudio = null;
            } else {
              setTimeout(checkSpeechEnd, 100);
            }
          };
          
          currentlyPlayingAudio = audioId;
          checkSpeechEnd();
          return;
        }
        
        if (audioUrl) {
          // Create new audio element
          audioElements[audioId] = new Audio(audioUrl);
          
          // Add event listeners
          audioElements[audioId].addEventListener("play", () => {
            buttonElement.classList.add("playing");
            buttonElement.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4H8V20H6V4ZM16 4H18V20H16V4Z" fill="currentColor"/>
              </svg>
            `;
            currentlyPlayingAudio = audioId;
          });
          
          audioElements[audioId].addEventListener("pause", () => {
            buttonElement.classList.remove("playing");
            buttonElement.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
            `;
            if (currentlyPlayingAudio === audioId) {
              currentlyPlayingAudio = null;
            }
          });
          
          audioElements[audioId].addEventListener("ended", () => {
            buttonElement.classList.remove("playing");
            buttonElement.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
            `;
            if (currentlyPlayingAudio === audioId) {
              currentlyPlayingAudio = null;
            }
          });

          audioElements[audioId].addEventListener("error", (error) => {
            console.error("Audio playback error:", error);
            buttonElement.classList.remove("playing");
            buttonElement.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V10C2 16 6 20.09 11.14 21L12 21.03L12.86 21C18 20.09 22 16 22 10V7L12 2ZM11 14H13V16H11V14ZM13 12H11V7H13V12Z" fill="currentColor"/>
              </svg>
            `;
            if (currentlyPlayingAudio === audioId) {
              currentlyPlayingAudio = null;
            }
          });
        } else {
          // Audio generation failed
          console.error("Failed to generate audio");
          buttonElement.classList.remove("playing");
          buttonElement.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7V10C2 16 6 20.09 11.14 21L12 21.03L12.86 21C18 20.09 22 16 22 10V7L12 2ZM11 14H13V16H11V14ZM13 12H11V7H13V12Z" fill="currentColor"/>
            </svg>
          `;
          return;
        }
      }

      // Play the audio
      if (audioElements[audioId]) {
        console.log("Playing audio for message:", audioId);
        
        try {
          await audioElements[audioId].play();
        } catch (error) {
          console.error("Audio play failed:", error);
          
          // Reset button state
          buttonElement.classList.remove("playing");
          buttonElement.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
            </svg>
          `;
          
          // Try browser TTS as fallback
          if (error.name === 'NotAllowedError') {
            console.log("Autoplay blocked, trying browser TTS fallback");
            const browserAudio = await voiceManager.generateBrowserTTS(messageText);
            if (browserAudio === 'BROWSER_TTS') {
              currentlyPlayingAudio = audioId;
              buttonElement.classList.add("playing");
              buttonElement.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 4H8V20H6V4ZM16 4H18V20H16V4Z" fill="currentColor"/>
                </svg>
              `;
            }
          }
        }
      }

    } catch (error) {
      console.error("Audio playback handler error:", error);
      
      // Reset button state
      buttonElement.classList.remove("playing");
      buttonElement.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
        </svg>
      `;
    }
  }

  function toggleAudio(audioId) {
    // Legacy function - now handled by handleAudioPlayback
    if (audioElements[audioId]) {
      if (currentlyPlayingAudio === audioId) {
        audioElements[audioId].pause();
      } else {
        if (currentlyPlayingAudio !== null && audioElements[currentlyPlayingAudio]) {
          audioElements[currentlyPlayingAudio].pause();
        }
        audioElements[audioId].play().catch(error => {
          console.error("Legacy audio play failed:", error);
        });
      }
    }
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "agent-message bot agent-typing-message";
    typingDiv.innerHTML = `
      <div class="agent-message-avatar">AI</div>
      <div class="agent-typing">
        <div class="agent-typing-dot"></div>
        <div class="agent-typing-dot"></div>
        <div class="agent-typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
  }

  function removeTypingIndicator(typingElement) {
    if (typingElement && typingElement.parentNode) {
      typingElement.parentNode.removeChild(typingElement);
    }
  }

  function showNotification() {
    unreadCount++;
    let notificationBadge = button.querySelector(".agent-notification");

    if (!notificationBadge) {
      notificationBadge = document.createElement("div");
      notificationBadge.className = "agent-notification";
      button.appendChild(notificationBadge);
    }

    notificationBadge.textContent = unreadCount > 9 ? "9+" : unreadCount;
  }

  function clearNotifications() {
    unreadCount = 0;
    const notificationBadge = button.querySelector(".agent-notification");
    if (notificationBadge) {
      notificationBadge.remove();
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function toggleVoiceMode() {
    if (!config.enableVoice) return;

    isVoiceMode = !isVoiceMode;
    voiceToggle.classList.toggle("active", isVoiceMode);

    if (isVoiceMode) {
      input.style.display = "none";
      sendBtn.style.display = "none";
      voiceUI.style.display = "block";
      updateVoiceStatus("Ready to listen");
      
      // Stop any currently playing audio when entering voice mode
      voiceManager.stopCurrentAudio();
    } else {
      input.style.display = "";
      sendBtn.style.display = "";
      voiceUI.style.display = "none";
      exitVoiceMode();
    }
  }

  function exitVoiceMode() {
    if (isVoiceMode) {
      isVoiceMode = false;
      voiceToggle.classList.remove("active");
      input.style.display = "";
      sendBtn.style.display = "";
      voiceUI.style.display = "none";
    }

    isRecording = false;
    isSpeaking = false;
    voiceBtn.classList.remove("listening", "speaking");
    voiceManager.stopListening();
    voiceManager.stopCurrentAudio();
    updateVoiceStatus("");
  }

  function handleVoiceInput() {
    if (!config.enableVoice) return;

    // Don't allow recording while AI is speaking
    if (isSpeaking) {
      voiceManager.stopCurrentAudio();
      isSpeaking = false;
      voiceBtn.classList.remove("speaking");
      updateVoiceStatus("Ready to listen");
      return;
    }

    if (isRecording) {
      voiceManager.stopListening();
      isRecording = false;
      voiceBtn.classList.remove("listening");
      updateVoiceStatus("Processing...");
      return;
    }

    isRecording = true;
    voiceBtn.classList.add("listening");
    transcriptionEl.textContent = "";
    updateVoiceStatus("Listening... Click to stop");

    voiceManager.startListening(
      async (text) => {
        transcriptionEl.textContent = text;
        updateVoiceStatus("Processing your message...");
        await sendMessage(text, true);
      },
      () => {
        isRecording = false;
        voiceBtn.classList.remove("listening");
        if (!isSpeaking) {
          updateVoiceStatus("Ready to listen");
        }
      },
      (error) => {
        console.error("Voice input error:", error);
        isRecording = false;
        voiceBtn.classList.remove("listening");
        updateVoiceStatus("Voice recognition failed. Try again.");
        transcriptionEl.textContent = "Error: " + error;
      }
    );
  }

  async function sendMessage(message = null, isVoiceMessage = false) {
    const text = message || input.value.trim();
    if (!text || isLoading) return;

    // Add user message
    addMessage(text, true);
    if (!isVoiceMessage) {
      input.value = "";
      input.style.height = "auto";
    } else {
      transcriptionEl.textContent = "";
    }

    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    isLoading = true;
    sendBtn.disabled = true;

    if (isVoiceMode) {
      updateVoiceStatus("AI is thinking...");
    }

    try {
      // Create FormData for the API call
      const formData = new FormData();
      formData.append("text", text);
      formData.append("userId", "widget-user-" + Date.now());
      formData.append("voice_mode", isVoiceMode.toString());

      console.log("Sending message to API:", text);

      const response = await fetch(agentChatUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botResponse =
        data[0]?.text || "I'm sorry, I couldn't process your request.";

      console.log("Received bot response:", botResponse);

      // Generate audio if in voice mode or if voice responses are enabled
      let audioUrl = null;
      if ((isVoiceMode || config.autoPlayVoiceResponses) && config.enableVoice) {
        if (isVoiceMode) {
          updateVoiceStatus("Generating voice response...");
        }
        
        console.log("Starting voice generation...");
        
        try {
          audioUrl = await voiceManager.generateVoice(
            botResponse,
            config.voiceModel
          );
          
          if (audioUrl) {
            console.log("Voice generation successful, audio URL:", audioUrl);
          } else {
            console.warn("Voice generation returned null");
          }
        } catch (error) {
          console.error("Error generating voice:", error);
        }
      }

      // Remove typing indicator and add bot response
      removeTypingIndicator(typingIndicator);
      addMessage(botResponse, false, audioUrl);

      // Play voice response immediately if in voice mode
      if (isVoiceMode && audioUrl) {
        console.log("Playing voice response in voice mode");
        await playVoiceResponse(audioUrl);
      } else if (isVoiceMode && !audioUrl) {
        console.warn("No audio URL available for voice response");
        updateVoiceStatus("Ready to listen");
      }
    } catch (error) {
      console.error("Agent Widget Error:", error);
      removeTypingIndicator(typingIndicator);
      addMessage(
        "I'm sorry, there was an error processing your request. Please try again."
      );
      
      if (isVoiceMode) {
        updateVoiceStatus("Error occurred. Ready to listen");
      }
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      if (isOpen && !isMinimized && !isVoiceMode) {
        input.focus();
      }
    }
  }

  // Helper function to update agent info in the widget
  function updateAgentInfoUI() {
    if (!agentInfo) return;

    // Update agent name
    const nameEl = document.querySelector(
      "#agent-header .agent-agent-details h3"
    );
    if (nameEl && agentInfo.agent.name) {
      nameEl.textContent = agentInfo.agent.name;
    }

    // Update Header Avatar image if available
    const HeaderAvatarEl = document.querySelector(
      "#agent-header .agent-avatar"
    );
    if (HeaderAvatarEl && agentInfo.agent.avatar_img) {
      // If avatar_img is a URL or IPFS hash
      let avatarUrl = agentInfo.agent.avatar_img;
      if (!avatarUrl.startsWith("http")) {
        avatarUrl = `https://ipfs.erebrus.io/ipfs/${avatarUrl}`;
      }
      const img = document.createElement("img");
      img.src = avatarUrl;
      img.alt = agentInfo.agent.name || "AI";
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      `;
      img.onerror = function () {
        HeaderAvatarEl.textContent = "AI";
      };
      HeaderAvatarEl.innerHTML = "";
      HeaderAvatarEl.appendChild(img);
    }

    // Update Messages Avatar image if available
    const messageAvatars = document.querySelectorAll(
      "#agent-messages .agent-message-avatar"
    );
    messageAvatars.forEach((messageAvatar) => {
      if (messageAvatar && agentInfo.agent.avatar_img) {
        // If avatar_img is a URL or IPFS hash
        let avatarUrl = agentInfo.agent.avatar_img;
        if (!avatarUrl.startsWith("http")) {
          avatarUrl = `https://ipfs.erebrus.io/ipfs/${avatarUrl}`;
        }
        const img = document.createElement("img");
        img.src = avatarUrl;
        img.alt = agentInfo.agent.name || "AI";
        img.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        `;
        img.onerror = function () {
          messageAvatar.textContent = "AI";
        };
        messageAvatar.innerHTML = "";
        messageAvatar.appendChild(img);
      }
    });
  }

  // Make widget globally accessible for customization
  window.agentWidget = {
    open: openPanel,
    close: closePanel,
    minimize: toggleMinimize,
    addMessage: addMessage,
    toggleVoiceMode: toggleVoiceMode,
    config: config,
    voiceManager: voiceManager,
    // Test function for debugging voice
    testVoice: async function(text = "Hello, this is a test of the voice system.") {
      console.log("Testing voice system with text:", text);
      
      try {
        const audioUrl = await voiceManager.generateVoice(text, config.voiceModel);
        if (audioUrl) {
          console.log("Voice generation successful, playing audio");
          await voiceManager.playVoiceResponse(
            audioUrl,
            () => console.log("Voice test playback started"),
            () => console.log("Voice test playback ended")
          );
        } else {
          console.error("Voice generation failed - no audio URL returned");
        }
      } catch (error) {
        console.error("Voice test failed:", error);
      }
    },
    // Test audio playback functionality
    testAudioPlayback: async function() {
      console.log("Testing audio playback functionality");
      
      // Add a test message with audio
      const testMessage = "This is a test message to check audio playback functionality.";
      console.log("Adding test message:", testMessage);
      
      try {
        const audioUrl = await voiceManager.generateVoice(testMessage, config.voiceModel);
        addMessage(testMessage, false, audioUrl);
        
        console.log("Test message added with audio controls");
        console.log("Click the play button next to the message to test audio playback");
      } catch (error) {
        console.error("Test audio playback failed:", error);
      }
    },
    // Debug function to check TTS API
    debugTTS: async function() {
      console.log("Debugging TTS API...");
      console.log("TTS URL:", ttsApiUrl);
      console.log("Voice Model:", config.voiceModel);
      
      try {
        const response = await fetch(`${ttsApiUrl}/v1/audio/speech`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "kokoro",
            input: "Test message",
            voice: config.voiceModel,
            response_format: "mp3",
            speed: 1,
          }),
        });
        
        console.log("API Response Status:", response.status);
        console.log("API Response Headers:", [...response.headers.entries()]);
        
        if (response.ok) {
          const blob = await response.blob();
          console.log("Response blob size:", blob.size);
          console.log("Response blob type:", blob.type);
        } else {
          const errorText = await response.text();
          console.log("Error response:", errorText);
        }
      } catch (error) {
        console.error("API Debug error:", error);
      }
    },
    // Get all message audio elements for debugging
    getAudioElements: function() {
      console.log("🎵 Current audio elements:", audioElements);
      console.log("🎵 Currently playing audio ID:", currentlyPlayingAudio);
      console.log("🎵 Message texts:", window.messageTexts);
      return { audioElements, currentlyPlayingAudio, messageTexts: window.messageTexts };
    }
  };

  // Wait for agentInfo to load, then update UI
  (async () => {
    await loadAgentInfo();
    updateAgentInfoUI();
    
    // Load voices for browser TTS fallback
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices(); // This triggers voice loading
      speechSynthesis.addEventListener('voiceschanged', () => {
        console.log("🎤 Browser voices loaded:", speechSynthesis.getVoices().length);
      });
    }
  })();

  // Auto-pulse the button initially
  setTimeout(() => {
    button.classList.add("pulse");
  }, 2000);
})();