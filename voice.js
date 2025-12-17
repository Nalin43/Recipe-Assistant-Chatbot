// Voice input functionality for recipe chatbot
class VoiceInput {
    constructor(language, onTranscript) {
        this.recognition = null;
        this.isListening = false;
        this.voiceBtn = document.getElementById('voice-btn');
        this.userInput = document.getElementById('user-input');
        this.currentLanguage = language;
        this.onTranscript = onTranscript;
        this.isSupported = false;
        this.hasPermission = false;

        this.init();
    }

    async init() {
        // Check if browser supports speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.isSupported = true;
            
            // Request microphone permission first
            try {
                await this.requestMicrophonePermission();
                this.setupSpeechRecognition();
            } catch (error) {
                console.error('Microphone permission denied:', error);
                this.showError('Microphone access denied. Please allow microphone access and try again.');
                this.disableVoiceButton();
            }
        } else {
            // Fallback for browsers that don't support speech recognition
            this.showError('Voice input not supported in this browser. Please use Chrome, Edge, or Safari.');
            this.disableVoiceButton();
        }
    }

    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately as we only needed permission
            stream.getTracks().forEach(track => track.stop());
            this.hasPermission = true;
            return true;
        } catch (error) {
            this.hasPermission = false;
            throw error;
        }
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configure recognition settings
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = this.getCurrentLanguage();

        // Event handlers
        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
            this.voiceBtn.classList.add('listening');
            this.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
            this.voiceBtn.title = 'Stop Listening';
            this.showListeningIndicator();
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            this.isListening = false;
            this.voiceBtn.classList.remove('listening');
            this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            this.voiceBtn.title = 'Voice Input';
            this.hideListeningIndicator();
        };

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Show interim results in input field
            if (interimTranscript) {
                this.userInput.value = interimTranscript;
                this.userInput.style.fontStyle = 'italic';
                this.userInput.style.opacity = '0.7';
            }

            // Process final result
            if (finalTranscript) {
                this.userInput.style.fontStyle = 'normal';
                this.userInput.style.opacity = '1';
                this.onTranscript(finalTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.voiceBtn.classList.remove('listening');
            this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            this.voiceBtn.title = 'Voice Input';
            this.hideListeningIndicator();

            let errorMessage = 'Voice recognition failed. ';
            switch (event.error) {
                case 'no-speech':
                    errorMessage += 'No speech detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage += 'Microphone not accessible. Please check permissions.';
                    break;
                case 'not-allowed':
                    errorMessage += 'Microphone access denied. Please allow microphone access.';
                    break;
                case 'network':
                    errorMessage += 'Network error. Please check your internet connection.';
                    break;
                case 'service-not-allowed':
                    errorMessage += 'Speech service not available. Please try again later.';
                    break;
                default:
                    errorMessage += 'Please try again.';
            }
            this.showError(errorMessage);
        };

        this.recognition.onnomatch = () => {
            console.log('No speech match found');
            this.showError('Could not understand speech. Please try again.');
        };

        // Add click handler for voice button
        this.voiceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleListening();
        });

        // Update language when language selector changes
        const languageSelect = document.getElementById('language');
        if (languageSelect) {
            languageSelect.addEventListener('change', () => {
                if (this.recognition) {
                    this.recognition.lang = this.getCurrentLanguage();
                    console.log('Speech recognition language updated to:', this.getCurrentLanguage());
                }
            });
        }

        console.log('Speech recognition initialized successfully');
    }

    disableVoiceButton() {
        if (this.voiceBtn) {
            this.voiceBtn.style.opacity = '0.5';
            this.voiceBtn.style.cursor = 'not-allowed';
            this.voiceBtn.title = 'Voice input not available';
            this.voiceBtn.disabled = true;
        }
    }

    toggleListening() {
        if (!this.isSupported) {
            this.showError('Voice input not supported in this browser.');
            return;
        }

        if (!this.hasPermission) {
            this.showError('Microphone permission required. Please refresh and allow microphone access.');
            return;
        }

        if (!this.recognition) {
            this.showError('Speech recognition not available. Please try again.');
            return;
        }

        try {
            if (this.isListening) {
                console.log('Stopping speech recognition...');
                this.recognition.stop();
            } else {
                console.log('Starting speech recognition...');
                // Update language before starting
                this.recognition.lang = this.getCurrentLanguage();
                this.recognition.start();
            }
        } catch (error) {
            console.error('Error toggling speech recognition:', error);
            this.showError('Failed to start voice recognition. Please try again.');
        }
    }

    getCurrentLanguage() {
        const languageMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'ta': 'ta-IN',
            'ml': 'ml-IN',
            'te': 'te-IN',
            'kn': 'kn-IN',
            'bn': 'bn-IN',
            'pa': 'pa-IN',
            'gu': 'gu-IN',
            'mr': 'mr-IN',
            'or': 'or-IN',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'zh': 'zh-CN'
        };

        const languageSelect = document.getElementById('language');
        const currentLang = languageSelect ? languageSelect.value : 'en';
        return languageMap[currentLang] || 'en-US';
    }

    showListeningIndicator() {
        // Remove existing indicator if any
        this.hideListeningIndicator();
        
        // Create listening indicator
        const indicator = document.createElement('div');
        indicator.id = 'listening-indicator';
        indicator.innerHTML = `
            <div class="listening-overlay">
                <div class="listening-modal">
                    <div class="listening-icon">
                        <i class="fas fa-microphone"></i>
                    </div>
                    <p>Listening... Speak your recipe request</p>
                    <div class="listening-language">
                        Language: ${this.getLanguageDisplayName()}
                    </div>
                    <button id="stop-listening-btn">Stop Listening</button>
                </div>
            </div>
        `;
        document.body.appendChild(indicator);

        // Add stop button functionality
        const stopBtn = document.getElementById('stop-listening-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.recognition.stop();
            });
        }
    }

    hideListeningIndicator() {
        const indicator = document.getElementById('listening-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    getLanguageDisplayName() {
        const languageNames = {
            'en': 'English',
            'hi': 'Hindi',
            'ta': 'Tamil',
            'ml': 'Malayalam',
            'te': 'Telugu',
            'kn': 'Kannada',
            'bn': 'Bengali',
            'pa': 'Punjabi',
            'gu': 'Gujarati',
            'mr': 'Marathi',
            'or': 'Odia',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'zh': 'Chinese'
        };

        const languageSelect = document.getElementById('language');
        const currentLang = languageSelect ? languageSelect.value : 'en';
        return languageNames[currentLang] || 'English';
    }

    showError(message) {
        console.error('Voice Input Error:', message);
        
        // Remove existing error if any
        const existingError = document.querySelector('.voice-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'voice-error';
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Method to check if voice input is working
    testVoiceInput() {
        console.log('Testing voice input...');
        console.log('Browser support:', this.isSupported);
        console.log('Microphone permission:', this.hasPermission);
        console.log('Recognition object:', !!this.recognition);
        console.log('Current language:', this.getCurrentLanguage());
        
        if (this.isSupported && this.hasPermission && this.recognition) {
            console.log('Voice input should be working');
            return true;
        } else {
            console.log('Voice input has issues');
            return false;
        }
    }

    // Method to reinitialize voice input (useful for debugging)
    async reinitialize() {
        console.log('Reinitializing voice input...');
        this.recognition = null;
        this.isListening = false;
        this.hasPermission = false;
        await this.init();
    }
}

// Global function to test voice input (for debugging)
window.testVoiceInput = function() {
    if (window.voiceInput) {
        return window.voiceInput.testVoiceInput();
    } else {
        console.log('Voice input not initialized');
        return false;
    }
};

// Global function to reinitialize voice input (for debugging)
window.reinitializeVoiceInput = function() {
    if (window.voiceInput) {
        window.voiceInput.reinitialize();
    } else {
        console.log('Voice input not initialized');
    }
};
