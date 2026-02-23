// Enhanced Voice and UI Management with improved permission handling
class VoiceAssistant {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.activePanel = null;
        this.responsiveVoiceLoaded = false;
        this.speechHistory = [];
        this.currentBubble = null;
        this.microphonePermissionGranted = false;
        this.isContinuousMode = false;
        this.retryCount = 0;
        this.restartTimeout = null;
        this.listenTimeout = null;
        this.initialize();
    }

    async initialize() {
        this.loadSpeechRecognition();
        this.createUIElements();
        this.bindEvents();
        
        // Load responsive voice after a short delay
        setTimeout(async () => {
            await this.loadResponsiveVoice();
            
            // Check microphone permission
            await this.checkMicrophonePermission();
        }, 1000);
    }

    loadSpeechRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 3;
            
            this.recognition.onstart = () => this.onRecognitionStart();
            this.recognition.onresult = (event) => this.onRecognitionResult(event);
            this.recognition.onend = () => this.onRecognitionEnd();
            this.recognition.onerror = (event) => this.onRecognitionError(event);
            
            console.log('Speech recognition initialized');
        } else {
            console.warn('Speech recognition not supported in this browser');
            this.showNotification('Voice input is not supported in your browser', 'warning');
        }
    }

    async loadResponsiveVoice() {
        return new Promise((resolve) => {
            console.log('🚀 Loading ResponsiveVoice...');
            
            // Method 1: Check if already loaded globally
            if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
                this.responsiveVoiceLoaded = true;
                this.updateStatus('speaker', true);
                console.log('✅ ResponsiveVoice already loaded globally');
                resolve(true);
                return;
            }
            
            // Method 2: Check in different namespaces
            if (typeof responsiveVoice !== 'undefined' && typeof responsiveVoice.speak === 'function') {
                window.responsiveVoice = responsiveVoice;
                this.responsiveVoiceLoaded = true;
                this.updateStatus('speaker', true);
                console.log('✅ ResponsiveVoice found in responsiveVoice namespace');
                resolve(true);
                return;
            }
            
            // Remove any existing scripts to avoid conflicts
            document.querySelectorAll('script[src*="responsivevoice"]').forEach(script => script.remove());
            
            // Method 3: Load new script with a better key
            const script = document.createElement('script');
            script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=H4BkFZc4S';
            script.type = 'text/javascript';
            script.async = false; // Set to false to ensure it loads before continuing
            script.defer = false;
            
            let loaded = false;
            
            const onScriptLoad = () => {
                if (loaded) return;
                loaded = true;
                console.log('📦 ResponsiveVoice script loaded');
                
                // Try multiple times to detect the library
                let attempts = 0;
                const maxAttempts = 10;
                
                const checkLibrary = () => {
                    attempts++;
                    console.log(`Attempt ${attempts} to detect ResponsiveVoice...`);
                    
                    // Check multiple possible locations
                    if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
                        this.responsiveVoiceLoaded = true;
                        this.updateStatus('speaker', true);
                        console.log('✅ ResponsiveVoice detected in window.responsiveVoice');
                        this.initializeResponsiveVoice();
                        resolve(true);
                        return;
                    }
                    
                    if (typeof responsiveVoice !== 'undefined' && typeof responsiveVoice.speak === 'function') {
                        window.responsiveVoice = responsiveVoice;
                        this.responsiveVoiceLoaded = true;
                        this.updateStatus('speaker', true);
                        console.log('✅ ResponsiveVoice detected in responsiveVoice global');
                        this.initializeResponsiveVoice();
                        resolve(true);
                        return;
                    }
                    
                    if (attempts < maxAttempts) {
                        setTimeout(checkLibrary, 300);
                    } else {
                        console.error('❌ Could not detect ResponsiveVoice after all attempts');
                        this.updateStatus('speaker', false);
                        this.showNotification('Voice output not available. Some features may be limited.', 'warning');
                        resolve(false);
                    }
                };
                
                // Start checking
                setTimeout(checkLibrary, 100);
            };
            
            script.onload = onScriptLoad;
            script.onreadystatechange = function() {
                if (this.readyState === 'complete' || this.readyState === 'loaded') {
                    onScriptLoad();
                }
            };
            
            script.onerror = (error) => {
                console.error('❌ Failed to load ResponsiveVoice script:', error);
                this.updateStatus('speaker', false);
                this.showNotification('Could not load voice features. Please check your internet connection.', 'error');
                resolve(false);
            };
            
            // Add to document
            document.head.appendChild(script);
            console.log('📝 Added ResponsiveVoice script to document');
            
            // Fallback timeout
            setTimeout(() => {
                if (!this.responsiveVoiceLoaded) {
                    console.warn('⚠️ ResponsiveVoice loading timeout');
                    if (!loaded) {
                        this.showNotification('Voice features taking longer to load...', 'info');
                    }
                }
            }, 5000);
        });
    }
    
    initializeResponsiveVoice() {
        try {
            if (window.responsiveVoice && typeof window.responsiveVoice.setDefaultVoice === 'function') {
                window.responsiveVoice.setDefaultVoice('US English Female');
                window.responsiveVoice.enableWindowClickHook = false;
                console.log('🔧 ResponsiveVoice configured');
                
                // Test speaker
                setTimeout(() => {
                    if (this.responsiveVoiceLoaded) {
                        console.log('🔊 Testing speaker...');
                        window.responsiveVoice.speak("Ready!", "US English Female", {
                            pitch: 1,
                            rate: 0.9,
                            volume: 0.5,
                            onstart: () => console.log('🔊 Speaker test started'),
                            onend: () => console.log('🔊 Speaker test completed')
                        });
                    }
                }, 1000);
            }
        } catch (error) {
            console.warn('⚠️ Could not configure ResponsiveVoice:', error);
        }
    }

    async checkMicrophonePermission() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn('getUserMedia not supported');
                return false;
            }
            
            // Check permission state
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'microphone' });
                console.log('Microphone permission state:', result.state);
                
                if (result.state === 'granted') {
                    this.microphonePermissionGranted = true;
                    this.updateStatus('mic', true);
                    document.querySelector('.permission-indicator')?.classList.remove('show');
                    return true;
                } else if (result.state === 'denied') {
                    this.microphonePermissionGranted = false;
                    this.updateStatus('mic', false);
                    this.showPermissionIndicator();
                    return false;
                }
                // 'prompt' state means we need to request permission
            }
            
            // Fallback: Try to get permission
            return await this.requestMicrophonePermission();
        } catch (error) {
            console.error('Error checking microphone permission:', error);
            return false;
        }
    }

    async requestMicrophonePermission() {
        return new Promise((resolve) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showNotification('Microphone access is not supported in your browser', 'error');
                resolve(false);
                return;
            }

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // Stop all tracks immediately after getting permission
                    stream.getTracks().forEach(track => track.stop());
                    
                    this.microphonePermissionGranted = true;
                    this.updateStatus('mic', true);
                    document.querySelector('.permission-indicator')?.classList.remove('show');
                    
                    this.showNotification('Microphone permission granted!', 'success');
                    console.log('✅ Microphone permission granted');
                    resolve(true);
                })
                .catch(error => {
                    console.error('Microphone permission denied:', error);
                    this.microphonePermissionGranted = false;
                    this.updateStatus('mic', false);
                    this.showPermissionIndicator();
                    
                    if (error.name === 'NotAllowedError') {
                        this.showNotification('Microphone permission denied. Please allow access in your browser settings.', 'error');
                    } else if (error.name === 'NotFoundError') {
                        this.showNotification('No microphone found on your device.', 'error');
                    } else {
                        this.showNotification('Could not access microphone: ' + error.message, 'error');
                    }
                    resolve(false);
                });
        });
    }

    showPermissionIndicator() {
        const indicator = document.querySelector('.permission-indicator');
        if (indicator) {
            indicator.classList.add('show');
        }
    }

    createUIElements() {
        // Create voice status panel
        const voiceStatus = document.createElement('div');
        voiceStatus.className = 'voice-status';
        voiceStatus.innerHTML = `
            <div class="voice-status-header">
                <h4>🎤 Voice Assistant</h4>
                <button class="close-status" title="Close">×</button>
            </div>
            <div class="status-grid">
                <div class="status-card mic-status">
                    <div class="status-icon">🎤</div>
                    <div class="status-info">
                        <div class="status-title">Microphone</div>
                        <div class="status-value" id="micStatusText">Checking...</div>
                    </div>
                    <div class="status-indicator" id="micStatus"></div>
                </div>
                <div class="status-card speaker-status">
                    <div class="status-icon">🔊</div>
                    <div class="status-info">
                        <div class="status-title">Speaker</div>
                        <div class="status-value" id="speakerStatusText">Loading...</div>
                    </div>
                    <div class="status-indicator" id="speakerStatus"></div>
                </div>
            </div>
            <div class="status-actions">
                <button class="action-btn" id="testMicBtn">Test Mic</button>
                <button class="action-btn" id="testSpeakerBtn">Test Speaker</button>
            </div>
            <div class="speech-history-section">
                <div class="history-header">
                    <span>Recent Activity</span>
                    <button class="clear-history" title="Clear History">🗑️</button>
                </div>
                <div class="speech-history" id="speechHistory"></div>
            </div>
        `;
        document.body.appendChild(voiceStatus);

        // Create permission indicator
        const permIndicator = document.createElement('div');
        permIndicator.className = 'permission-indicator';
        permIndicator.innerHTML = `
            <div class="perm-content">
                <div class="perm-icon">🎤</div>
                <div class="perm-text">
                    <strong>Microphone Access Required</strong><br>
                    <small>Voice input requires microphone permission. Click below to grant access.</small>
                </div>
                <button class="perm-btn" id="requestPermBtn">Grant Access</button>
            </div>
        `;
        document.body.appendChild(permIndicator);

        // Update mic buttons
        document.querySelectorAll('.micBtn').forEach(btn => {
            btn.innerHTML = '<div class="mic-icon">🎤</div>';
            btn.title = 'Click to speak answer';
        });

        // Add volume visualizers
        document.querySelectorAll('.answerInput').forEach(container => {
            if (!container.querySelector('.volume-visualizer')) {
                const visualizer = document.createElement('div');
                visualizer.className = 'volume-visualizer';
                visualizer.innerHTML = `
                    <div class="volume-label">Volume</div>
                    <div class="volume-levels">
                        <div class="volume-bar"></div>
                    </div>
                `;
                container.appendChild(visualizer);
            }
        });
    }

    bindEvents() {
        // Mic button events - use event delegation for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.closest('.micBtn')) {
                e.preventDefault();
                const btn = e.target.closest('.micBtn');
                const panelId = btn.closest('.panel').id;
                const panel = panelId === 'panel1' ? panel1 : panel2;
                this.handleMicButtonClick(panel, btn);
            }
        });

        // Voice status panel events
        document.addEventListener('click', (e) => {
            const voiceStatus = document.querySelector('.voice-status');
            
            if (e.target.closest('.close-status')) {
                voiceStatus.classList.remove('active');
            }
            
            if (e.target.closest('#testMicBtn')) {
                this.testMicrophone();
            }
            
            if (e.target.closest('#testSpeakerBtn')) {
                this.testSpeaker();
            }
            
            if (e.target.closest('.clear-history')) {
                this.clearHistory();
            }
            
            if (e.target.closest('#requestPermBtn')) {
                this.requestMicrophonePermission();
            }
        });

        // Show voice status on microphone hover
        document.addEventListener('mouseenter', (e) => {
            if (e.target.closest('.micBtn')) {
                document.querySelector('.voice-status').classList.add('active');
            }
        }, true);
    }

    async handleMicButtonClick(panel, button) {
        console.log('Mic button clicked, permission status:', this.microphonePermissionGranted);
        
        if (!this.microphonePermissionGranted) {
            // Request permission first
            const granted = await this.requestMicrophonePermission();
            if (!granted) {
                return;
            }
        }
        
        // Toggle listening mode
        if (this.isListening) {
            this.stopContinuousListening();
        } else {
            this.startContinuousListening(panel, button);
        }
    }

    startContinuousListening(panel, button) {
        if (!this.recognition) {
            this.showNotification('Speech recognition is not available', 'error');
            return;
        }

        this.activePanel = panel;
        this.isContinuousMode = true;
        
        // Update UI to show continuous mode
        button.classList.add('active');
        button.innerHTML = '<div class="mic-icon">🔴</div>';
        button.title = 'Continuous listening active - Click to stop';
        
        // Show notification
        this.showSpeechBubble(button, '🎤 Continuous listening ON - Speak answers anytime');
        this.showNotification('Continuous listening enabled. Speak answers anytime!', 'success');
        
        // Start recognition
        this.startRecognition();
    }

    startRecognition() {
        // Clear any pending restart
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }
        
        if (!this.recognition || this.isListening) {
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            this.retryCount = 0; // Reset retry count on successful start
            this.updateStatus('mic', true);
            this.addToHistory('recognition', 'Started listening');
            
            console.log('✅ Listening started');
        } catch (error) {
            console.error('❌ Failed to start recognition:', error);
            this.isListening = false;
            this.retryCount++;
            
            // Only show error for first few retries
            if (this.retryCount <= 2) {
                this.showNotification('Voice recognition failed, retrying...', 'warning');
            }
            
            // Try again if in continuous mode
            if (this.isContinuousMode) {
                const retryDelay = Math.min(2000, 500 * this.retryCount);
                this.restartTimeout = setTimeout(() => {
                    if (this.isContinuousMode && !this.isListening) {
                        this.startRecognition();
                    }
                }, retryDelay);
            }
        }
    }

    stopContinuousListening() {
        this.isContinuousMode = false;
        this.retryCount = 0;
        
        // Clear all timeouts
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }
        
        if (this.listenTimeout) {
            clearTimeout(this.listenTimeout);
            this.listenTimeout = null;
        }
        
        // Stop recognition if active
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
            this.isListening = false;
            this.updateStatus('mic', false);
            
            console.log('🛑 Continuous listening stopped');
        }
        
        // Reset UI with better feedback
        document.querySelectorAll('.micBtn').forEach(btn => {
            if (btn.classList.contains('active')) {
                btn.classList.add('stopping');
                setTimeout(() => {
                    btn.classList.remove('active', 'stopping');
                    btn.innerHTML = '<div class="mic-icon">🎤</div>';
                    btn.title = 'Click for continuous listening';
                }, 300);
            }
        });
        
        this.hideSpeechBubble();
        this.showNotification('Continuous listening disabled', 'info');
    }

    // Automatically restart listening after a question is answered
    restartListeningForNextQuestion() {
        if (this.isContinuousMode && this.activePanel && !this.isListening) {
            console.log('Auto-restarting listening for next question...');
            setTimeout(() => {
                if (this.isContinuousMode && !this.isListening) {
                    this.startRecognition();
                }
            }, 1000);
        }
    }

    onRecognitionStart() {
        console.log('Speech recognition started');
        this.addToHistory('recognition', 'Started listening');
    }

    onRecognitionResult(event) {
        // Update volume visualization
        this.updateVolumeVisualization();
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript.trim().toLowerCase();
                console.log('Recognized:', transcript);
                this.addToHistory('recognition', `Heard: "${transcript}"`);
                
                // Process the answer
                const answer = this.extractNumberFromSpeech(transcript);
                if (answer !== null && this.activePanel) {
                    this.activePanel.inputElem.value = answer;
                    
                    // Show recognition feedback
                    this.showSpeechBubble(this.activePanel.inputElem, `Recognized: ${answer}`);
                    
                    // Auto-submit after delay
                    setTimeout(() => {
                        checkAnswer(this.activePanel)();
                        this.stopListening();
                    }, 800);
                } else if (this.activePanel) {
                    this.activePanel.resultElem.textContent = 'Could not understand the number. Please try again.';
                    this.activePanel.resultElem.style.color = 'red';
                    this.stopListening();
                }
            }
        }
    }

    onRecognitionEnd() {
        console.log('Speech recognition ended');
        this.isListening = false;
        
        // If in continuous mode, restart automatically with exponential backoff
        if (this.isContinuousMode) {
            const retryDelay = this.retryCount < 5 ? Math.pow(2, this.retryCount) * 200 : 2000;
            console.log(`Auto-restarting in ${retryDelay}ms (retry ${this.retryCount + 1})...`);
            
            this.restartTimeout = setTimeout(() => {
                if (this.isContinuousMode && !this.isListening) {
                    this.retryCount++;
                    this.startRecognition();
                }
            }, retryDelay);
        }
    }

    onRecognitionError(event) {
        console.error('Recognition error:', event.error);
        this.addToHistory('recognition', `Error: ${event.error}`);
        this.isListening = false;
        
        if (this.activePanel && event.error !== 'aborted' && event.error !== 'no-speech') {
            this.activePanel.resultElem.textContent = `Voice error: ${event.error}`;
            this.activePanel.resultElem.style.color = 'red';
        }
        
        // Reset retry count on certain errors
        if (event.error === 'network' || event.error === 'not-allowed') {
            this.retryCount = 0;
            this.stopContinuousListening();
            return;
        }
        
        // For other errors in continuous mode, try to restart
        if (this.isContinuousMode) {
            const retryDelay = Math.min(2000, 500 * (this.retryCount + 1));
            console.log(`Retrying after error in ${retryDelay}ms...`);
            
            this.restartTimeout = setTimeout(() => {
                if (this.isContinuousMode && !this.isListening) {
                    this.retryCount = Math.min(5, this.retryCount + 1);
                    this.startRecognition();
                }
            }, retryDelay);
        }
    }

    extractNumberFromSpeech(transcript) {
        // Remove common filler words
        const cleanTranscript = transcript.replace(/\b(please|the|answer|is|what|uh|um|er)\b/gi, '').trim();
        
        // Try to extract number directly
        const numberMatch = cleanTranscript.match(/[-+]?[0-9]*\.?[0-9]+/);
        if (numberMatch) {
            return parseInt(numberMatch[0]);
        }
        
        // Word to number mapping
        const numberWords = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
            'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
            'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
            'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
        };
        
        // Split into words and convert
        const words = cleanTranscript.toLowerCase().split(/\s+/);
        let total = 0;
        
        for (const word of words) {
            if (numberWords[word] !== undefined) {
                total += numberWords[word];
            }
        }
        
        return total > 0 ? total : null;
    }

    speak(text) {
        if (this.responsiveVoiceLoaded && typeof window.responsiveVoice !== 'undefined') {
            try {
                console.log('Speaking:', text);
                window.responsiveVoice.speak(text, "US English Female", {
                    pitch: 1,
                    rate: 0.9,
                    volume: 1,
                    onend: () => {
                        console.log('Finished speaking');
                    }
                });
                this.addToHistory('speaker', `Said: "${text}"`);
                return true;
            } catch (error) {
                console.error('Speech synthesis error:', error);
                this.showNotification('Could not speak message', 'error');
                return false;
            }
        } else {
            console.warn('Speech synthesis not available');
            return false;
        }
    }

    testMicrophone() {
        if (!this.recognition) {
            this.showNotification('Speech recognition not available', 'error');
            return;
        }

        this.showNotification('Say "test" to check microphone', 'info');
        
        const testRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        testRecognition.lang = 'en-US';
        testRecognition.maxAlternatives = 1;
        
        testRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            if (transcript.includes('test')) {
                this.showNotification('Microphone test successful!', 'success');
            }
        };
        
        testRecognition.onerror = () => {
            this.showNotification('Microphone test failed', 'error');
        };
        
        testRecognition.start();
        
        setTimeout(() => {
            try { testRecognition.stop(); } catch (e) {}
        }, 3000);
    }

    testSpeaker() {
        if (this.speak("This is a speaker test. If you can hear this, your speaker is working.")) {
            this.showNotification('Playing test sound...', 'info');
        } else {
            this.showNotification('Speaker not available. Please refresh the page.', 'error');
        }
    }

    clearHistory() {
        const historyContainer = document.getElementById('speechHistory');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            this.speechHistory = [];
            this.showNotification('History cleared', 'success');
        }
    }

    updateStatus(type, active) {
        const statusElem = document.getElementById(`${type}Status`);
        const textElem = document.getElementById(`${type}StatusText`);
        
        if (statusElem && textElem) {
            if (active) {
                statusElem.classList.add('active');
                textElem.textContent = 'Active';
                textElem.style.color = '#4CAF50';
            } else {
                statusElem.classList.remove('active');
                textElem.textContent = type === 'speaker' ? 'Not Loaded' : 'Inactive';
                textElem.style.color = '#666';
            }
            
            // Show status panel temporarily
            const voiceStatus = document.querySelector('.voice-status');
            voiceStatus.classList.add('active');
            setTimeout(() => {
                voiceStatus.classList.remove('active');
            }, 3000);
        }
    }

    addToHistory(type, message) {
        const historyItem = document.createElement('div');
        historyItem.className = `speech-item ${type}`;
        historyItem.textContent = message;
        
        const historyContainer = document.getElementById('speechHistory');
        if (historyContainer) {
            historyContainer.prepend(historyItem);
            
            // Limit to 10 items
            if (historyContainer.children.length > 10) {
                historyContainer.removeChild(historyContainer.lastChild);
            }
        }
        
        this.speechHistory.unshift({ type, message, timestamp: new Date() });
        if (this.speechHistory.length > 50) this.speechHistory.pop();
    }

    showSpeechBubble(element, text) {
        this.hideSpeechBubble();
        
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.textContent = text;
        
        const rect = element.getBoundingClientRect();
        bubble.style.position = 'fixed';
        bubble.style.top = `${rect.top - 50}px`;
        bubble.style.left = `${rect.left + rect.width / 2}px`;
        bubble.style.transform = 'translateX(-50%)';
        
        document.body.appendChild(bubble);
        
        setTimeout(() => bubble.classList.add('show'), 10);
        
        this.currentBubble = bubble;
        
        setTimeout(() => this.hideSpeechBubble(), 3000);
    }

    hideSpeechBubble() {
        if (this.currentBubble) {
            this.currentBubble.classList.remove('show');
            setTimeout(() => {
                if (this.currentBubble?.parentNode) {
                    this.currentBubble.parentNode.removeChild(this.currentBubble);
                }
            }, 300);
            this.currentBubble = null;
        }
    }

    updateVolumeVisualization() {
        const visualizers = document.querySelectorAll('.volume-visualizer');
        visualizers.forEach(viz => {
            viz.classList.add('active');
            const bar = viz.querySelector('.volume-bar');
            const volume = 30 + Math.random() * 70;
            bar.style.width = `${volume}%`;
        });
        
        setTimeout(() => {
            visualizers.forEach(viz => viz.classList.remove('active'));
        }, 500);
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelectorAll('.voice-notification');
        existing.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `voice-notification ${type}`;
        
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': '💡'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || '💡'}</div>
            <div class="notification-text">${message}</div>
            <button class="notification-close">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
}

// Initialize voice assistant
const voiceAssistant = new VoiceAssistant();

// Enhanced answer checking with speech
function checkAnswer(panel) {
    return function() {
        const userAnswer = parseFloat(panel.inputElem.value);
        
        if (userAnswer === panel.answer) {
            panel.marks++;
            panel.marksElem.textContent = panel.marks;
            panel.resultElem.style.color = 'green';
            panel.resultElem.textContent = '✓ Correct! +1 point';
            
            voiceAssistant.addToHistory('correct', `Correct: ${panel.answer}`);
            
            // Speak and move to next question
            if (voiceAssistant.speak(`Correct! The answer is ${panel.answer}. Next question.`)) {
                setTimeout(() => {
                    newQuestion(panel);
                    setTimeout(() => {
                        voiceAssistant.speak(`What is ${panel.num1} plus ${panel.num2}?`);
                        
                        // Restart listening for continuous mode
                        voiceAssistant.restartListeningForNextQuestion();
                    }, 500);
                }, 1500);
            } else {
                // If speech fails, just move to next question
                setTimeout(() => {
                    newQuestion(panel);
                    voiceAssistant.restartListeningForNextQuestion();
                }, 1000);
            }
        } else {
            panel.resultElem.style.color = 'red';
            panel.resultElem.textContent = '✗ Try again!';
            
            voiceAssistant.addToHistory('incorrect', `Wrong: ${userAnswer}, Correct: ${panel.answer}`);
            
            // Speak try again message
            voiceAssistant.speak("Try again!");
            
            // Restart listening for continuous mode if wrong answer
            voiceAssistant.restartListeningForNextQuestion();
        }
        
        // Clear input
        setTimeout(() => {
            panel.inputElem.value = '';
            panel.resultElem.textContent = '';
        }, 3000);
    };
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
    .micBtn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        position: relative;
        overflow: hidden;
        margin-left: 12px;
        border: 2px solid transparent;
    }

    .micBtn:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 12px 25px rgba(102, 126, 234, 0.4);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .micBtn.active {
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        animation: pulse 1.5s infinite, glow 2s infinite alternate;
        transform: scale(1.1);
        box-shadow: 0 0 30px rgba(255, 65, 108, 0.6);
    }

    .micBtn .mic-icon {
        font-size: 1.8rem;
        transition: transform 0.3s ease;
    }

    .micBtn.active .mic-icon {
        animation: bounce 0.5s infinite alternate;
    }

    @keyframes bounce {
        from { transform: scale(1); }
        to { transform: scale(1.2); }
    }

    @keyframes glow {
        from { box-shadow: 0 0 20px rgba(255, 65, 108, 0.6); }
        to { box-shadow: 0 0 30px rgba(255, 65, 108, 0.8); }
    }

    @keyframes pulse {
        0% { 
            box-shadow: 0 0 0 0 rgba(255, 65, 108, 0.7),
                        0 0 20px rgba(255, 65, 108, 0.6);
        }
        70% { 
            box-shadow: 0 0 0 15px rgba(255, 65, 108, 0),
                        0 0 30px rgba(255, 65, 108, 0.8);
        }
        100% { 
            box-shadow: 0 0 0 0 rgba(255, 65, 108, 0),
                        0 0 20px rgba(255, 65, 108, 0.6);
        }
    }

    .speech-bubble {
        position: absolute;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 18px;
        border-radius: 25px;
        font-size: 0.9rem;
        white-space: nowrap;
        z-index: 1000;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateY(15px) scale(0.9);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        font-weight: 500;
        backdrop-filter: blur(10px);
    }

    .speech-bubble.show {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    .speech-bubble:after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 10px;
        border-style: solid;
        border-color: #667eea transparent transparent transparent;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
    }

    .voice-status {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: white;
        border-radius: 20px;
        padding: 0;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        max-width: 350px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        display: none;
        overflow: hidden;
        backdrop-filter: blur(20px);
        background: rgba(255, 255, 255, 0.95);
    }

    .voice-status.active {
        display: block;
        animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
    }

    .voice-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 20px 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .voice-status-header h4 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .close-status {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }

    .close-status:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .status-grid {
        padding: 20px;
        display: grid;
        gap: 15px;
    }

    .status-card {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: #f8f9ff;
        border-radius: 15px;
        border: 1px solid rgba(102, 126, 234, 0.1);
        transition: all 0.3s ease;
    }

    .status-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    }

    .status-icon {
        font-size: 1.8rem;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .status-info {
        flex: 1;
    }

    .status-title {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 4px;
        font-weight: 500;
    }

    .status-value {
        font-size: 1rem;
        font-weight: 600;
        color: #333;
    }

    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #e0e0e0;
        transition: all 0.3s ease;
    }

    .status-indicator.active {
        background: #4CAF50;
        box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
        animation: blink 1.5s infinite;
    }

    @keyframes blink {
        0%, 100% { 
            opacity: 1;
            box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.2);
        }
        50% { 
            opacity: 0.7;
            box-shadow: 0 0 0 8px rgba(76, 175, 80, 0);
        }
    }

    .status-actions {
        padding: 0 20px 20px;
        display: flex;
        gap: 10px;
    }

    .action-btn {
        flex: 1;
        padding: 10px 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .speech-history-section {
        padding: 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        background: #fafbff;
    }

    .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .history-header span {
        font-size: 0.9rem;
        font-weight: 600;
        color: #555;
    }

    .clear-history {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        font-size: 1rem;
        padding: 5px;
        border-radius: 5px;
        transition: all 0.2s;
    }

    .clear-history:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #ff4757;
    }

    .speech-history {
        max-height: 200px;
        overflow-y: auto;
        padding-right: 10px;
    }

    .speech-item {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        font-size: 0.85rem;
        border-radius: 8px;
        margin-bottom: 8px;
        background: white;
        transition: all 0.2s;
    }

    .speech-item:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    .speech-item.correct { 
        border-left: 4px solid #4CAF50;
        background: linear-gradient(90deg, rgba(76, 175, 80, 0.1), white);
    }
    .speech-item.incorrect { 
        border-left: 4px solid #ff4757;
        background: linear-gradient(90deg, rgba(255, 71, 87, 0.1), white);
    }
    .speech-item.recognition { 
        border-left: 4px solid #2d87f0;
        background: linear-gradient(90deg, rgba(45, 135, 240, 0.1), white);
    }
    .speech-item.speaker { 
        border-left: 4px solid #9C27B0;
        background: linear-gradient(90deg, rgba(156, 39, 176, 0.1), white);
    }

    .volume-visualizer {
        width: 120px;
        margin-top: 10px;
        display: none;
    }

    .volume-visualizer.active {
        display: block;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .volume-label {
        font-size: 0.75rem;
        color: #666;
        margin-bottom: 5px;
        font-weight: 500;
    }

    .volume-levels {
        height: 8px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        overflow: hidden;
    }

    .volume-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        width: 0%;
        border-radius: 4px;
        transition: width 0.15s ease;
        box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
    }

    .permission-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 15px;
        padding: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        max-width: 300px;
        display: none;
        border: 1px solid rgba(0, 0, 0, 0.05);
        animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .permission-indicator.show {
        display: block;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .perm-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .perm-icon {
        font-size: 1.5rem;
        color: #667eea;
    }

    .perm-text {
        flex: 1;
        font-size: 0.85rem;
        color: #555;
        line-height: 1.4;
    }

    .perm-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .perm-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(102, 126, 234, 0.3);
    }

    .voice-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: white;
        border-radius: 12px;
        padding: 15px 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 1002;
        min-width: 300px;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border-left: 4px solid #667eea;
    }

    .voice-notification.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }

    .voice-notification.success {
        border-left-color: #4CAF50;
        background: linear-gradient(90deg, rgba(76, 175, 80, 0.1), white);
    }

    .voice-notification.error {
        border-left-color: #ff4757;
        background: linear-gradient(90deg, rgba(255, 71, 87, 0.1), white);
    }

    .voice-notification.warning {
        border-left-color: #ffa502;
        background: linear-gradient(90deg, rgba(255, 165, 2, 0.1), white);
    }

    .voice-notification.info {
        border-left-color: #2d87f0;
        background: linear-gradient(90deg, rgba(45, 135, 240, 0.1), white);
    }

    .notification-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
    }

    .notification-text {
        flex: 1;
        font-size: 0.9rem;
        color: #333;
        line-height: 1.4;
    }

    .notification-close {
        background: none;
        border: none;
        color: #999;
        font-size: 1.2rem;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }

    .notification-close:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #333;
    }

    @media (max-width: 768px) {
        .voice-status {
            bottom: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }
        
        .permission-indicator {
            left: 10px;
            right: 10px;
            max-width: none;
        }
        
        .voice-notification {
            left: 10px;
            right: 10px;
            max-width: none;
            transform: translateX(0) translateY(-20px);
        }
        
        .voice-notification.show {
            transform: translateX(0) translateY(0);
        }
    }
`;
document.head.appendChild(style);
