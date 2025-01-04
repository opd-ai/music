import { ContentManager } from './contentManager.js';

document.addEventListener('DOMContentLoaded', async () => {
    const contentManager = new ContentManager();
    await contentManager.initialize();
    
    // Load initial content (homepage)
    await contentManager.loadSection('home');
});