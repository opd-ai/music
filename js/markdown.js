import { marked } from './marked.esm.js';

export class MarkdownParser {
    static #logPrefix = '[MarkdownParser]';

    static #log(message, level = 'log', data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `${this.#logPrefix} ${message}`;
        
        switch(level) {
            case 'error':
                console.error(timestamp, logMessage, data || '');
                break;
            case 'warn':
                console.warn(timestamp, logMessage, data || '');
                break;
            case 'debug':
                console.debug(timestamp, logMessage, data || '');
                break;
            default:
                console.log(timestamp, logMessage, data || '');
        }
    }

    static async loadContent(filepath) {
        this.#log(`Starting to load content from: ${filepath}`);
        
        try {
            this.#log(`Fetching file: ${filepath}`);
            const response = await fetch(filepath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.#log(`File fetch successful, status: ${response.status}`);

            const text = await response.text();
            this.#log(`File content loaded, length: ${text.length} characters`);

            const parsedContent = this.parseContent(text);
            this.#log('Content parsed successfully', 'debug', {
                hasMetadata: Object.keys(parsedContent.metadata).length > 0,
                contentLength: parsedContent.content.length
            });

            return parsedContent;

        } catch (error) {
            this.#log(`Error loading markdown file: ${filepath}`, 'error', error);
            return null;
        }
    }

    static parseContent(markdown) {
        this.#log('Starting content parsing');
        
        try {
            const [frontMatter, content] = this.splitFrontMatter(markdown);
            
            this.#log('Content split completed', 'debug', {
                hasFrontMatter: frontMatter.length > 0,
                contentLength: content.length
            });

            const result = {
                metadata: this.parseFrontMatter(frontMatter),
                content: this.parseMarkdown(content)
            };

            this.#log('Content parsing completed', 'debug', {
                metadataKeys: Object.keys(result.metadata),
                parsedContentLength: result.content.length
            });

            return result;

        } catch (error) {
            this.#log('Error parsing content', 'error', error);
            return { metadata: {}, content: '' };
        }
    }

    static splitFrontMatter(markdown) {
        this.#log('Splitting front matter from content');
        
        try {
            const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            
            if (match) {
                this.#log('Front matter found and split successfully');
                return [match[1], match[2]];
            } else {
                this.#log('No front matter found, treating entire content as markdown', 'warn');
                return ['', markdown];
            }

        } catch (error) {
            this.#log('Error splitting front matter', 'error', error);
            return ['', markdown];
        }
    }

    static parseFrontMatter(frontMatter) {
        this.#log('Parsing front matter');
        
        const metadata = {};
        const lines = frontMatter.split('\n');
        
        try {
            lines.forEach((line, index) => {
                if (line.trim() === '') {
                    this.#log(`Skipping empty line at index ${index}`, 'debug');
                    return;
                }

                const [key, ...values] = line.split(':');
                if (key && values.length) {
                    const trimmedKey = key.trim();
                    const trimmedValue = values.join(':').trim();
                    metadata[trimmedKey] = trimmedValue;
                    this.#log(`Parsed metadata: ${trimmedKey} = ${trimmedValue}`, 'debug');
                } else {
                    this.#log(`Invalid front matter line at index ${index}: ${line}`, 'warn');
                }
            });

            this.#log('Front matter parsing completed', 'debug', {
                parsedFields: Object.keys(metadata)
            });

            return metadata;

        } catch (error) {
            this.#log('Error parsing front matter', 'error', error);
            return {};
        }
    }

    static parseMarkdown(markdown) {
        this.#log('Starting markdown parsing');
        
        try {
            return marked.parse(markdown);
        } catch (error) {
            this.#log('Error parsing markdown', 'error', error);
            return markdown; // Return original text if parsing fails
        }
    }
}

export default MarkdownParser;