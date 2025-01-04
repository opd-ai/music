export class AudioPlayer extends HTMLElement {
    constructor() {
        super();
        console.log('[AudioPlayer] Initializing new audio player instance');
        
        this.template = document.getElementById('audio-player-template');
        if (!this.template) {
            console.error('[AudioPlayer] Template not found: audio-player-template');
            return;
        }
        console.log('[AudioPlayer] Template found and loaded');

        this.attachShadow({ mode: 'open' });
        console.log('[AudioPlayer] Shadow DOM attached');

        this.shadowRoot.appendChild(this.template.content.cloneNode(true));
        console.log('[AudioPlayer] Template content cloned to shadow DOM');

        // Initialize elements with error checking
        this.initializeElements();
        
        this.setupEventListeners();
        console.log('[AudioPlayer] Construction complete');
    }

    initializeElements() {
        this.audio = this.shadowRoot.querySelector('audio');
        this.playButton = this.shadowRoot.querySelector('.play-pause');
        this.progress = this.shadowRoot.querySelector('.progress');
        this.currentTime = this.shadowRoot.querySelector('.current-time');
        this.duration = this.shadowRoot.querySelector('.duration');

        // Validate all required elements are present
        const elements = {
            audio: this.audio,
            playButton: this.playButton,
            progress: this.progress,
            currentTime: this.currentTime,
            duration: this.duration
        };

        Object.entries(elements).forEach(([name, element]) => {
            if (!element) {
                console.error(`[AudioPlayer] Required element not found: ${name}`);
            } else {
                console.log(`[AudioPlayer] Element initialized: ${name}`);
            }
        });
    }

    setupEventListeners() {
        console.log('[AudioPlayer] Setting up event listeners');

        this.playButton.addEventListener('click', () => {
            console.log('[AudioPlayer] Play button clicked');
            this.togglePlay();
        });

        // Audio element event listeners with detailed logging
        const audioEvents = {
            timeupdate: () => this.updateProgress(),
            loadedmetadata: () => this.setDuration(),
            ended: () => this.resetPlayer(),
            error: (e) => this.handleError(e),
            waiting: () => console.log('[AudioPlayer] Buffering...'),
            playing: () => console.log('[AudioPlayer] Playback started'),
            pause: () => console.log('[AudioPlayer] Playback paused'),
            seeking: () => console.log('[AudioPlayer] Seeking...'),
            seeked: () => console.log('[AudioPlayer] Seek completed'),
            loadstart: () => console.log('[AudioPlayer] Loading track...'),
            canplay: () => console.log('[AudioPlayer] Track can begin playing'),
            canplaythrough: () => console.log('[AudioPlayer] Track can play through')
        };

        Object.entries(audioEvents).forEach(([event, handler]) => {
            this.audio.addEventListener(event, handler);
            console.log(`[AudioPlayer] Added event listener: ${event}`);
        });
    }

    handleError(error) {
        const errorMessages = {
            MEDIA_ERR_ABORTED: 'Playback aborted by user',
            MEDIA_ERR_NETWORK: 'Network error while loading',
            MEDIA_ERR_DECODE: 'Audio decoding failed',
            MEDIA_ERR_SRC_NOT_SUPPORTED: 'Audio format not supported'
        };

        const errorCode = this.audio.error?.code;
        const errorMessage = errorMessages[Object.keys(errorMessages)[errorCode - 1]] || 'Unknown error';
        console.error(`[AudioPlayer] Audio Error: ${errorMessage}`, error);
    }

    togglePlay() {
        const action = this.audio.paused ? 'play' : 'pause';
        console.log(`[AudioPlayer] Attempting to ${action}`);

        try {
            if (this.audio.paused) {
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('[AudioPlayer] Playback started successfully');
                            this.updatePlayButton(true);
                        })
                        .catch(error => {
                            console.error('[AudioPlayer] Playback failed:', error);
                            this.updatePlayButton(false);
                        });
                }
            } else {
                this.audio.pause();
                console.log('[AudioPlayer] Playback paused successfully');
                this.updatePlayButton(false);
            }
        } catch (error) {
            console.error('[AudioPlayer] Error during play/pause:', error);
        }
    }

    updatePlayButton(playing) {
        const label = playing ? 'Pause' : 'Play';
        console.log(`[AudioPlayer] Updating play button state to: ${label}`);
        this.playButton.setAttribute('aria-label', label);
        this.playButton.classList.toggle('playing', playing);
    }

    updateProgress() {
        try {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progress.style.width = `${percent}%`;
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
            
            if (percent % 10 === 0) { // Log every 10%
                console.log(`[AudioPlayer] Playback progress: ${Math.floor(percent)}%`);
            }
        } catch (error) {
            console.error('[AudioPlayer] Error updating progress:', error);
        }
    }

    setDuration() {
        try {
            const formattedDuration = this.formatTime(this.audio.duration);
            this.duration.textContent = formattedDuration;
            console.log(`[AudioPlayer] Duration set: ${formattedDuration}`);
        } catch (error) {
            console.error('[AudioPlayer] Error setting duration:', error);
        }
    }

    formatTime(seconds) {
        try {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            return formattedTime;
        } catch (error) {
            console.error('[AudioPlayer] Error formatting time:', error);
            return '0:00';
        }
    }

    resetPlayer() {
        console.log('[AudioPlayer] Resetting player state');
        try {
            this.progress.style.width = '0%';
            this.playButton.classList.remove('playing');
            this.playButton.setAttribute('aria-label', 'Play');
            console.log('[AudioPlayer] Player reset complete');
        } catch (error) {
            console.error('[AudioPlayer] Error resetting player:', error);
        }
    }

    loadTrack(trackUrl) {
        console.log(`[AudioPlayer] Loading track: ${trackUrl}`);
        try {
            this.audio.src = trackUrl;
            this.resetPlayer();
            console.log('[AudioPlayer] Track loaded successfully');
        } catch (error) {
            console.error('[AudioPlayer] Error loading track:', error);
        }
    }

    // Lifecycle callbacks
    connectedCallback() {
        console.log('[AudioPlayer] Component connected to DOM');
    }

    disconnectedCallback() {
        console.log('[AudioPlayer] Component removed from DOM');
    }

    adoptedCallback() {
        console.log('[AudioPlayer] Component adopted into new document');
    }
}

try {
    customElements.define('audio-player', AudioPlayer);
    console.log('[AudioPlayer] Custom element registered successfully');
} catch (error) {
    console.error('[AudioPlayer] Failed to register custom element:', error);
}