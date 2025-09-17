const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Add stealth plugin
puppeteer.use(StealthPlugin());

class FacebookAutoCommentBot {
    constructor() {
        this.browser = null;
        this.page = null;
        this.comments = [];
        this.groupLinks = [];
        this.geminiApiKeys = [];
        this.currentApiKeyIndex = 0;
        this.commentedPosts = new Set();
        this.cookies = null;
        this.config = null;
        this.logFile = path.join(__dirname, 'logs', `bot-${new Date().toISOString().split('T')[0]}.log`);
    }

    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        console.log(logMessage);
        
        try {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
            await fs.appendFile(this.logFile, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    async loadConfig() {
        try {
            const configData = await fs.readFile('config.json', 'utf-8');
            this.config = JSON.parse(configData);
            await this.log('Configuration loaded successfully');
        } catch (error) {
            await this.log(`Error loading config: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async loadComments() {
        try {
            const commentsData = await fs.readFile('comments.txt', 'utf-8');
            this.comments = commentsData
                .split('---')
                .map(comment => comment.trim())
                .filter(comment => comment.length > 0);
            
            await this.log(`Loaded ${this.comments.length} fallback comments`);
        } catch (error) {
            await this.log(`Error loading comments: ${error.message}`, 'ERROR');
            this.comments = ['Nice post! 👍', 'Great content!', 'Thanks for sharing! 😊'];
        }
    }

    async loadGroupLinks() {
        try {
            const linksData = await fs.readFile('group_links.txt', 'utf-8');
            this.groupLinks = linksData
                .split('\n')
                .map(link => link.trim())
                .filter(link => link.length > 0 && link.startsWith('https://'));
            
            await this.log(`Loaded ${this.groupLinks.length} group links`);
        } catch (error) {
            await this.log(`Error loading group links: ${error.message}`, 'ERROR');
        }
    }

    async loadGeminiApiKeys() {
        try {
            const keysData = await fs.readFile('gemini_api_keys.txt', 'utf-8');
            this.geminiApiKeys = keysData
                .split('\n')
                .map(key => key.trim())
                .filter(key => key.length > 0);
            
            await this.log(`Loaded ${this.geminiApiKeys.length} Gemini API keys`);
        } catch (error) {
            await this.log(`Error loading Gemini API keys: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async loadCookies() {
        try {
            const cookiesData = process.env.FACEBOOK_COOKIES || await fs.readFile('cookies.json', 'utf-8');
            this.cookies = JSON.parse(cookiesData);
            await this.log('Facebook cookies loaded successfully');
        } catch (error) {
            await this.log(`Error loading cookies: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async loadCommentedPosts() {
        try {
            const data = await fs.readFile('ceklink.txt', 'utf-8');
            const posts = data.split('\n').filter(line => line.trim());
            posts.forEach(post => this.commentedPosts.add(post.trim()));
            await this.log(`Loaded ${this.commentedPosts.size} previously commented posts`);
        } catch (error) {
            await this.log('No previous commented posts found, starting fresh');
        }
    }

    async saveCommentedPost(postId) {
        this.commentedPosts.add(postId);
        try {
            await fs.appendFile('ceklink.txt', postId + '\n');
        } catch (error) {
            await this.log(`Error saving commented post: ${error.message}`, 'ERROR');
        }
    }

    async getGeminiAI() {
        if (this.geminiApiKeys.length === 0) {
            throw new Error('No Gemini API keys available');
        }

        // Try current API key
        let attempts = 0;
        while (attempts < this.geminiApiKeys.length) {
            try {
                const apiKey = this.geminiApiKeys[this.currentApiKeyIndex];
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                
                await this.log(`Trying Gemini API key #${this.currentApiKeyIndex + 1}`);
                return { model, keyIndex: this.currentApiKeyIndex };
            } catch (error) {
                await this.log(`API key #${this.currentApiKeyIndex + 1} failed: ${error.message}`, 'WARN');
                this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.geminiApiKeys.length;
                attempts++;
            }
        }
        
        throw new Error('All Gemini API keys exhausted');
    }

    async generateContextualComment(postContent) {
        try {
            const { model } = await this.getGeminiAI();
            
            // Enhanced prompt for contextual comments with call-to-action
            const prompt = `
            Buatkan komentar yang relate dan natural untuk postingan Facebook berikut:
            "${postContent}"

            Requirements:
            - Komentar harus relate dengan konten postingan
            - Gunakan bahasa Indonesia yang natural dan friendly
            - Maksimal 2-3 kalimat
            - Boleh gunakan emoji yang sesuai
            - Tambahkan call-to-action ringan jika sesuai
            - Hindari spam atau promosi berlebihan
            - Buat komentar yang engaging dan authentic

            Contoh style yang diinginkan:
            - "Wah, strategi yang bagus! Memang TikTok Ads Manager jago banget untuk boost penjualan. Yuk dicoba! 🚀"
            - "Setuju banget dengan tips ini! Sangat bermanfaat untuk yang lagi belajar marketing digital 👍"
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const comment = response.text().trim();

            await this.log(`Generated contextual comment: "${comment.slice(0, 50)}..."`);
            return comment;

        } catch (error) {
            await this.log(`Error generating contextual comment: ${error.message}`, 'ERROR');
            // Fallback to predefined comments
            return this.getRandomComment();
        }
    }

    getRandomComment() {
        if (this.comments.length === 0) {
            return 'Nice post! 👍';
        }
        return this.comments[Math.floor(Math.random() * this.comments.length)];
    }

    async initBrowser() {
        try {
            await this.log('Initializing browser...');
            
            this.browser = await puppeteer.launch({
                headless: process.env.NODE_ENV === 'production',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            this.page = await this.browser.newPage();
            
            // Set viewport and user agent
            await this.page.setViewport({ width: 1366, height: 768 });
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            await this.log('Browser initialized successfully');
        } catch (error) {
            await this.log(`Error initializing browser: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async loginWithCookies() {
        try {
            await this.log('Logging in with cookies...');
            
            // Set cookies
            await this.page.setCookie(...this.cookies);
            
            // Go to Facebook
            await this.page.goto('https://facebook.com', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Check if login was successful
            const isLoggedIn = await this.page.$('[role="feed"]') || 
                              await this.page.$('[data-pagelet="FeedUnit"]') ||
                              await this.page.$('.feed');
            
            if (!isLoggedIn) {
                throw new Error('Login verification failed - feed not found');
            }
            
            await this.log('Login successful');
            
        } catch (error) {
            await this.log(`Login failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async randomDelay() {
        const minDelay = this.config.delays.min_delay * 1000;
        const maxDelay = this.config.delays.max_delay * 1000;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        
        await this.log(`Waiting ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async extractPostContent(postElement) {
        try {
            // Try to get text content from various selectors
            const textSelectors = [
                '[data-ad-preview="message"]',
                '[data-testid="post_message"]',
                '.userContent',
                '.text_exposed_root',
                'p'
            ];

            let postText = '';
            for (const selector of textSelectors) {
                try {
                    const element = await postElement.$(selector);
                    if (element) {
                        postText = await element.evaluate(el => el.textContent || el.innerText);
                        if (postText && postText.trim().length > 10) {
                            break;
                        }
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }

            // If no substantial text found, try getting from the whole post
            if (!postText || postText.trim().length < 10) {
                postText = await postElement.evaluate(el => {
                    // Remove script and style elements
                    const cloned = el.cloneNode(true);
                    const scripts = cloned.querySelectorAll('script, style');
                    scripts.forEach(s => s.remove());
                    
                    return cloned.textContent || cloned.innerText || '';
                });
            }

            return postText.trim().slice(0, 500); // Limit length for AI processing
        } catch (error) {
            await this.log(`Error extracting post content: ${error.message}`, 'WARN');
            return '';
        }
    }

    async extractPostId(postElement) {
        try {
            let postId;
            
            // Try various methods to get unique post ID
            const idSelectors = [
                '[aria-posinset]',
                '[data-pagelet]',
                '[data-ft]',
                'article'
            ];

            for (const selector of idSelectors) {
                try {
                    const element = await postElement.$(selector) || postElement;
                    postId = await element.evaluate(el => 
                        el.getAttribute('aria-posinset') ||
                        el.getAttribute('data-pagelet') ||
                        el.getAttribute('data-ft') ||
                        el.id
                    );
                    
                    if (postId) break;
                } catch (e) {
                    // Continue to next method
                }
            }
            
            // If still no ID, generate one based on content
            if (!postId) {
                const textContent = await postElement.evaluate(el => 
                    (el.textContent || '').slice(0, 50)
                );
                postId = Buffer.from(textContent + Date.now()).toString('base64').slice(0, 20);
            }
            
            return postId;
        } catch (error) {
            await this.log(`Error extracting post ID: ${error.message}`, 'ERROR');
            return Date.now().toString();
        }
    }

    async commentOnPost(postElement) {
        try {
            const postId = await this.extractPostId(postElement);
            
            // Check if already commented
            if (this.commentedPosts.has(postId)) {
                await this.log(`Skipping already commented post: ${postId}`);
                return false;
            }

            // Scroll post into view
            await postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.page.waitForTimeout(2000);

            // Extract post content for contextual commenting
            const postContent = await this.extractPostContent(postElement);
            await this.log(`Post content preview: "${postContent.slice(0, 100)}..."`);

            // Find comment button with multiple selectors
            const commentButtonSelectors = [
                '[aria-label*="Comment"]',
                '[aria-label*="Komentar"]', 
                '[data-testid="UFI2CommentsCount/root"]',
                'div[role="button"]:has-text("Comment")',
                'div[role="button"]:has-text("Komentar")'
            ];

            let commentButton = null;
            for (const selector of commentButtonSelectors) {
                try {
                    commentButton = await postElement.$(selector);
                    if (commentButton) break;
                } catch (e) {
                    // Continue to next selector
                }
            }

            if (!commentButton) {
                await this.log('Comment button not found', 'WARN');
                return false;
            }

            await commentButton.click();
            await this.page.waitForTimeout(2000);

            // Find comment input with multiple selectors
            const commentInputSelectors = [
                '[contenteditable="true"]',
                '[data-testid="comment-input"]',
                'div[contenteditable="true"]',
                'textarea',
                '.notranslate'
            ];

            let commentInput = null;
            for (const selector of commentInputSelectors) {
                try {
                    commentInput = await this.page.$(selector);
                    if (commentInput) {
                        // Verify it's visible and interactable
                        const isVisible = await commentInput.evaluate(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.width > 0 && rect.height > 0;
                        });
                        if (isVisible) break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }

            if (!commentInput) {
                await this.log('Comment input not found', 'WARN');
                return false;
            }

            // Generate contextual comment using Gemini AI
            let comment;
            try {
                comment = await this.generateContextualComment(postContent);
            } catch (error) {
                await this.log(`Using fallback comment due to AI error: ${error.message}`, 'WARN');
                comment = this.getRandomComment();
            }

            await this.log(`Commenting: "${comment.slice(0, 50)}..."`);

            // Clear input and type comment
            await commentInput.click();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            
            // Type comment line by line if it contains newlines
            const lines = comment.split('\n');
            for (let i = 0; i < lines.length; i++) {
                await commentInput.type(lines[i], { delay: 50 });
                if (i < lines.length - 1) {
                    await this.page.keyboard.press('Enter');
                    await this.page.waitForTimeout(500);
                }
            }

            await this.page.waitForTimeout(1500);

            // Submit comment with multiple possible selectors
            const submitSelectors = [
                '[aria-label*="Post"]',
                '[aria-label*="Kirim"]',
                'div[role="button"]:has-text("Post")',
                'div[role="button"]:has-text("Kirim")',
                '[data-testid="comment-post-button"]'
            ];

            let submitted = false;
            for (const selector of submitSelectors) {
                try {
                    const submitButton = await this.page.$(selector);
                    if (submitButton) {
                        await submitButton.click();
                        submitted = true;
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }

            if (!submitted) {
                // Try Enter key as fallback
                await this.page.keyboard.press('Enter');
                submitted = true;
            }

            if (submitted) {
                await this.page.waitForTimeout(2000);
                await this.saveCommentedPost(postId);
                await this.log(`✅ Successfully commented on post: ${postId}`);
                return true;
            } else {
                await this.log('❌ Failed to submit comment', 'WARN');
                return false;
            }
            
        } catch (error) {
            await this.log(`Error commenting on post: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async processFriendsFeed() {
        try {
            await this.log('Processing friends feed...');
            await this.page.goto('https://facebook.com', { waitUntil: 'networkidle2', timeout: 30000 });
            
            return await this.processFeedPosts(this.config.comment_limits.friends_feed);
        } catch (error) {
            await this.log(`Error processing friends feed: ${error.message}`, 'ERROR');
            return 0;
        }
    }

    async processVideoFeed() {
        try {
            await this.log('Processing video feed...');
            await this.page.goto('https://facebook.com/watch', { waitUntil: 'networkidle2', timeout: 30000 });
            
            return await this.processFeedPosts(this.config.comment_limits.video_feed);
        } catch (error) {
            await this.log(`Error processing video feed: ${error.message}`, 'ERROR');
            return 0;
        }
    }

    async processGroupFeed() {
        try {
            await this.log('Processing group feeds...');
            
            let totalComments = 0;
            const commentsPerGroup = Math.ceil(this.config.comment_limits.group_feed / this.groupLinks.length);

            for (const groupLink of this.groupLinks) {
                if (totalComments >= this.config.comment_limits.group_feed) break;

                try {
                    await this.log(`Processing group: ${groupLink}`);
                    await this.page.goto(groupLink, { waitUntil: 'networkidle2', timeout: 30000 });
                    
                    const remainingComments = this.config.comment_limits.group_feed - totalComments;
                    const commentsInThisGroup = await this.processFeedPosts(Math.min(commentsPerGroup, remainingComments));
                    totalComments += commentsInThisGroup;
                    
                    if (totalComments < this.config.comment_limits.group_feed) {
                        await this.randomDelay();
                    }
                } catch (error) {
                    await this.log(`Error processing group ${groupLink}: ${error.message}`, 'ERROR');
                }
            }

            return totalComments;
        } catch (error) {
            await this.log(`Error processing group feeds: ${error.message}`, 'ERROR');
            return 0;
        }
    }

    async processFeedPosts(maxComments) {
        let commentsPosted = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 10;

        while (commentsPosted < maxComments && scrollAttempts < maxScrollAttempts) {
            try {
                // Wait for posts to load
                await this.page.waitForTimeout(3000);

                // Find posts with multiple selectors
                const postSelectors = [
                    '[role="article"]',
                    '[data-pagelet*="FeedUnit"]',
                    'div[data-pagelet*="GroupFeedUnit"]',
                    '.userContentWrapper'
                ];

                let posts = [];
                for (const selector of postSelectors) {
                    posts = await this.page.$$(selector);
                    if (posts.length > 0) {
                        await this.log(`Found ${posts.length} posts using selector: ${selector}`);
                        break;
                    }
                }

                if (posts.length === 0) {
                    await this.log('No posts found on current page', 'WARN');
                    scrollAttempts++;
                    await this.page.evaluate(() => window.scrollBy(0, 1000));
                    continue;
                }

                // Process posts
                for (let i = 0; i < posts.length && commentsPosted < maxComments; i++) {
                    try {
                        await this.log(`Processing post ${i + 1}/${posts.length}`);
                        const success = await this.commentOnPost(posts[i]);
                        
                        if (success) {
                            commentsPosted++;
                            await this.log(`✅ Comments posted so far: ${commentsPosted}/${maxComments}`);
                            
                            if (commentsPosted < maxComments) {
                                await this.randomDelay();
                            }
                        }
                    } catch (error) {
                        await this.log(`Error processing individual post: ${error.message}`, 'ERROR');
                    }
                }

                // Scroll to load more posts if needed
                if (commentsPosted < maxComments) {
                    await this.page.evaluate(() => {
                        window.scrollTo(0, document.body.scrollHeight);
                    });
                    scrollAttempts++;
                    await this.page.waitForTimeout(3000);
                }

            } catch (error) {
                await this.log(`Error in processFeedPosts loop: ${error.message}`, 'ERROR');
                scrollAttempts++;
            }
        }

        await this.log(`Completed processing. Comments posted: ${commentsPosted}/${maxComments}`);
        return commentsPosted;
    }

    async run() {
        try {
            await this.log('🚀 Starting Facebook Auto Comment Bot with Gemini AI');
            
            // Load all configuration and data
            await this.loadConfig();
            await this.loadComments();
            await this.loadGroupLinks();
            await this.loadGeminiApiKeys();
            await this.loadCookies();
            await this.loadCommentedPosts();
            
            // Initialize browser and login
            await this.initBrowser();
            await this.loginWithCookies();
            
            let totalComments = 0;
            
            // Process friends feed
            if (this.config.features.auto_comment_friend) {
                await this.log('🎯 Processing friends feed...');
                const comments = await this.processFriendsFeed();
                totalComments += comments;
            }
            
            // Process video feed
            if (this.config.features.auto_comment_video && totalComments < 15) {
                await this.log('🎥 Processing video feed...');
                const comments = await this.processVideoFeed();
                totalComments += comments;
            }
            
            // Process groups (comments)
            if (this.config.features.auto_comment_group && totalComments < 15) {
                await this.log('👥 Processing group comments...');
                const comments = await this.processGroupFeed();
                totalComments += comments;
            }
            
            await this.log(`🎉 Bot completed successfully!`);
            await this.log(`📊 Total comments posted: ${totalComments}`);
            
        } catch (error) {
            await this.log(`❌ Bot execution failed: ${error.message}`, 'ERROR');
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                await this.log('🔒 Browser closed');
            }
        }
    }
}

// Run the bot
if (require.main === module) {
    const bot = new FacebookAutoCommentBot();
    bot.run().catch(error => {
        console.error('❌ Bot failed:', error);
        process.exit(1);
    });
}

module.exports = FacebookAutoCommentBot;