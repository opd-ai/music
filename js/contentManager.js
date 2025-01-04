import { AudioPlayer } from './player.js';
import { MarkdownParser } from './markdown.js';

export class ContentManager {
    #logPrefix = '[ContentManager]';
    
    #log(message, level = 'log', data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `${this.#logPrefix} ${message}`;
        switch(level) {
            case 'error': console.error(timestamp, logMessage, data || ''); break;
            case 'warn': console.warn(timestamp, logMessage, data || ''); break;
            case 'debug': console.debug(timestamp, logMessage, data || ''); break;
            default: console.log(timestamp, logMessage, data || '');
        }
    }

    constructor() {
        this.#log('Initializing ContentManager');
        this.albums = new Map();
        this.contentCache = new Map();
        this.#log('ContentManager initialized', 'debug', {
            albumsSize: this.albums.size,
            cacheSize: this.contentCache.size
        });
    }

    async initialize() {
        this.#log('Starting initialization sequence');
        try {
            await this.discoverAlbums();
            this.#log('Albums discovered successfully');
            
            await this.loadStaticContent();
            this.#log('Static content loaded successfully');
            
            this.setupNavigationHandlers();
            this.#log('Navigation handlers initialized');
            
            this.#log('Initialization completed successfully', 'debug', {
                albumCount: this.albums.size,
                cachedContent: Array.from(this.contentCache.keys())
            });
        } catch (error) {
            this.#log('Initialization failed', 'error', error);
            throw error;
        }
    }

    async discoverAlbums() {
        this.#log('Starting album discovery');
        try {
            const response = await fetch('content/albums/index.json');
            this.#log('Album index fetched', 'debug', { status: response.status });
            
            const indexData = await response.json();
            this.#log('Album index parsed', 'debug', indexData);
            
            const albumDirs = indexData.albumDirectories;
            this.#log(`Found ${albumDirs.length} albums to process`);
            
            for (const dir of albumDirs) {
                this.#log(`Processing album directory: ${dir}`);
                const albumData = await this.loadAlbumData(dir);
                if (albumData) {
                    this.albums.set(dir, albumData);
                    this.#log(`Album "${dir}" loaded successfully`, 'debug', {
                        title: albumData.metadata.title,
                        trackCount: albumData.metadata.tracks?.length
                    });
                }
            }
        } catch (error) {
            this.#log('Album discovery failed', 'error', error);
            throw error;
        }
    }

    async loadAlbumData(albumDir) {
        this.#log(`Loading album data for: ${albumDir}`);
        try {
            const infoPath = `content/albums/${albumDir}/info.md`;
            this.#log(`Fetching album info from: ${infoPath}`);
            
            const albumData = await MarkdownParser.loadContent(infoPath);
            if (!albumData) {
                throw new Error('Album data parsing failed');
            }

            albumData.metadata.coverPath = `content/albums/${albumDir}/cover.jpg`;
            albumData.metadata.tracksDir = `content/albums/${albumDir}/tracks/`;
            albumData.metadata.lyricsDir = `content/albums/${albumDir}/lyrics/`;
            
            this.#log('Album data loaded successfully', 'debug', {
                title: albumData.metadata.title,
                paths: {
                    cover: albumData.metadata.coverPath,
                    tracks: albumData.metadata.tracksDir,
                    lyrics: albumData.metadata.lyricsDir
                }
            });
            
            return albumData;
        } catch (error) {
            this.#log(`Failed to load album data for ${albumDir}`, 'error', error);
            return null;
        }
    }

    async loadStaticContent() {
        this.#log('Loading static content');
        const staticFiles = ['bio', 'news', 'home'];
        
        for (const file of staticFiles) {
            this.#log(`Loading static file: ${file}`);
            try {
                const content = await MarkdownParser.loadContent(`content/${file}.md`);
                if (content) {
                    this.contentCache.set(file, content);
                    this.#log(`Static content "${file}" loaded`, 'debug', {
                        contentLength: content.content.length
                    });
                } else {
                    this.#log(`Failed to load static content: ${file}`, 'warn');
                }
            } catch (error) {
                this.#log(`Error loading static file: ${file}`, 'error', error);
            }
        }
    }
    setupNavigationHandlers() {
        this.#log('Setting up navigation handlers');
        const navLinks = document.querySelectorAll('.nav-menu a');
        this.#log(`Found ${navLinks.length} navigation links`);

        navLinks.forEach(link => {
            const section = link.getAttribute('href').substring(1);
            this.#log(`Adding handler for section: ${section}`);
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.#log(`Navigation clicked: ${section}`);
                this.loadSection(section);
            });
        });
    }

    async loadSection(sectionId) {
        if (sectionId === "")
            return;

        this.#log(`Loading section: ${sectionId}`);
        const contentContainer = document.querySelector(`#${sectionId}`);
        if (!contentContainer) {
            this.#log(`Section container not found: ${sectionId}`, 'error');
            return;
        }

        try {
            switch (sectionId) {
                case 'music':
                    this.#log('Rendering music catalog section');
                    await this.renderMusicCatalog(contentContainer);
                    break;
                case 'about':
                    this.#log('Rendering about section');
                    this.renderStaticContent('bio', contentContainer);
                    break;
                case 'news':
                    this.#log('Rendering news section');
                    this.renderStaticContent('news', contentContainer);
                    break;
                case 'home':
                    this.#log('Rendering home section');
                    this.renderStaticContent('home', contentContainer);
                    break;
                default:
                    this.#log(`Unknown section: ${sectionId}`, 'warn');
            }
            this.#log(`Section ${sectionId} loaded successfully`);
        } catch (error) {
            this.#log(`Error loading section ${sectionId}`, 'error', error);
        }
    }

    async renderMusicCatalog(container) {
        this.#log('Rendering music catalog');
        const albumsGrid = container.querySelector('.albums-grid');
        if (!albumsGrid) {
            this.#log('Albums grid container not found', 'error');
            return;
        }

        albumsGrid.innerHTML = '';
        this.#log(`Rendering ${this.albums.size} albums`);

        for (const [dir, albumData] of this.albums) {
            this.#log(`Creating element for album: ${dir}`);
            const albumElement = this.createAlbumElement(dir, albumData);
            albumsGrid.appendChild(albumElement);
        }
        this.#log('Music catalog rendered successfully');
    }

    createAlbumElement(dir, albumData) {
        this.#log(`Creating album element for: ${albumData.metadata.title}`);
        const album = document.createElement('article');
        album.className = 'album-card';
        
        album.innerHTML = `
            <img src="${albumData.metadata.coverPath}" alt="${albumData.metadata.title} Cover">
            <h3>${albumData.metadata.title}</h3>
            <div class="album-meta">
                <span class="release-date">${albumData.metadata.release_date}</span>
                <span class="track-count">${albumData.metadata.tracks.length} tracks</span>
            </div>
            <div class="album-preview">
                <audio-player data-album="${dir}"></audio-player>
            </div>
        `;

        album.addEventListener('click', () => {
            this.#log(`Album clicked: ${albumData.metadata.title}`);
            this.showAlbumDetails(dir, albumData);
        });
        
        this.#log(`Album element created: ${albumData.metadata.title}`);
        return album;
    }

    async showAlbumDetails(dir, albumData) {
        this.#log(`Showing album details for: ${albumData.metadata.title}`);
        const modal = document.createElement('div');
        modal.className = 'modal album-details';
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="album-full">
                    <img src="${albumData.metadata.coverPath}" alt="${albumData.metadata.title}">
                    <div class="album-info">
                        <h2>${albumData.metadata.title}</h2>
                        <div class="album-description markdown-content">
                            ${albumData.content}
                        </div>
                        <div class="track-list">
                            ${this.createTrackList(albumData.metadata.tracks, dir)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalHandlers(modal);
        this.#log(`Album details modal shown for: ${albumData.metadata.title}`);
    }

    createTrackList(tracks, albumDir) {
        this.#log(`Creating track list for album directory: ${albumDir}`);
        const trackListHtml = tracks.map((track, index) => {
            this.#log(`Processing track ${index + 1}: ${track.title}`);
            return `
                <div class="track-item">
                    <span class="track-number">${index + 1}</span>
                    <span class="track-title">${track.title}</span>
                    <span class="track-duration">${track.duration}</span>
                    <audio-player data-track="${albumDir}/${track.file}"></audio-player>
                    <button class="download-track" data-track="${track.file}">
                        Download
                    </button>
                    ${track.lyrics ? `
                        <button class="show-lyrics" data-lyrics="${track.lyrics}">
                            Lyrics
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        this.#log(`Track list created with ${tracks.length} tracks`);
        return trackListHtml;
    }

    setupModalHandlers(modal) {
        this.#log('Setting up modal handlers');
        modal.querySelector('.close-modal').addEventListener('click', () => {
            this.#log('Modal close button clicked');
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.#log('Modal background clicked, closing modal');
                modal.remove();
            }
        });

        modal.querySelectorAll('.show-lyrics').forEach(button => {
            button.addEventListener('click', async () => {
                const lyricsFile = button.dataset.lyrics;
                this.#log(`Lyrics button clicked for: ${lyricsFile}`);
                const lyrics = await this.loadLyrics(lyricsFile);
                this.showLyricsModal(lyrics);
            });
        });
        this.#log('Modal handlers setup completed');
    }

    async loadLyrics(lyricsFile) {
        this.#log(`Loading lyrics from: ${lyricsFile}`);
        try {
            const content = await MarkdownParser.loadContent(lyricsFile);
            this.#log('Lyrics loaded successfully');
            return content.content;
        } catch (error) {
            this.#log('Error loading lyrics', 'error', error);
            return 'Lyrics not available';
        }
    }

    showLyricsModal(lyricsContent) {
        this.#log('Showing lyrics modal');
        const modal = document.createElement('div');
        modal.className = 'modal lyrics-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="lyrics-content markdown-content">
                    ${lyricsContent}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalHandlers(modal);
        this.#log('Lyrics modal displayed');
    }

    renderStaticContent(type, container) {
        this.#log(`Rendering static content: ${type}`);
        const content = this.contentCache.get(type);
        if (content) {
            const contentDiv = container.querySelector('.markdown-content');
            if (contentDiv) {
                contentDiv.innerHTML = content.content;
                this.#log(`Static content rendered: ${type}`);
            } else {
                this.#log(`Content container not found for: ${type}`, 'error');
            }
        } else {
            this.#log(`No cached content found for: ${type}`, 'warn');
        }
    }

    async renderFeaturedAlbum() {
        this.#log('Rendering featured album');
        const featuredAlbum = Array.from(this.albums.values())
            .find(album => album.metadata.featured === 'true');
            
        if (featuredAlbum) {
            this.#log(`Found featured album: ${featuredAlbum.metadata.title}`);
            const featuredSection = document.querySelector('#featured');
            if (featuredSection) {
                featuredSection.querySelector('.album-art').innerHTML = `
                    <img src="${featuredAlbum.metadata.coverPath}" 
                         alt="${featuredAlbum.metadata.title}">
                `;
                featuredSection.querySelector('.album-title')
                    .textContent = featuredAlbum.metadata.title;
                featuredSection.querySelector('.album-description')
                    .innerHTML = featuredAlbum.content;
                this.#log('Featured album rendered successfully');
            } else {
                this.#log('Featured section not found', 'error');
            }
        } else {
            this.#log('No featured album found', 'warn');
        }
    }
}

export default ContentManager;