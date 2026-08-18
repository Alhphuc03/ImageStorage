// Trợ lý giọng nói tiếng Việt hỗ trợ người lớn tuổi
class SpeechAssistant {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voice = null;
    this.enabled = true;
    this.initVoice();
  }

  initVoice() {
    if (!this.synth) return;
    
    const setVoice = () => {
      const voices = this.synth.getVoices();
      // Ưu tiên giọng tiếng Việt
      this.voice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI')) || 
                   voices.find(v => v.name.includes('Vietnamese')) || 
                   voices[0];
    };

    setVoice();
    if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  }

  speak(text, force = false) {
    if (!this.synth) return;
    if (!this.enabled && !force) return;
    if (!text || typeof text !== 'string') return;

    // Dừng giọng đọc trước nếu đang đọc
    this.synth.cancel();

    const cleanText = text.replace(/[^\p{L}\p{N}\s.,!?-]/gu, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9; // Giọng đọc chậm rãi, rõ ràng cho người lớn tuổi
    utterance.pitch = 1.0;

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (!this.enabled) {
      this.stop();
    }
  }
}

export const speechAssistant = new SpeechAssistant();
