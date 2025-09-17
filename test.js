const FacebookAutoCommentBot = require('./index.js');
const fs = require('fs').promises;
const path = require('path');

async function testBot() {
    console.log('🧪 Testing Facebook Auto Comment Bot with Gemini AI...\n');
    
    try {
        // Check if required files exist
        const requiredFiles = [
            'config.json',
            'comments.txt', 
            'group_links.txt',
            'gemini_api_keys.txt',
            'cookies.json'
        ];
        
        console.log('📋 Checking required files:');
        for (const file of requiredFiles) {
            try {
                await fs.access(file);
                console.log(`  ✅ ${file} found`);
            } catch (error) {
                console.log(`  ❌ ${file} not found`);
                if (file === 'cookies.json') {
                    console.log('    💡 Create cookies.json with your Facebook cookies');
                    console.log('    💡 Login to Facebook, extract cookies from browser dev tools');
                } else if (file === 'gemini_api_keys.txt') {
                    console.log('    💡 Add your real Gemini API keys to gemini_api_keys.txt');
                    console.log('    💡 Get API keys from: https://aistudio.google.com/');
                }
            }
        }
        
        // Test configuration loading
        try {
            const configData = await fs.readFile('config.json', 'utf-8');
            const config = JSON.parse(configData);
            console.log('\n⚙️  Configuration loaded successfully:');
            console.log(`    - Auto Comment Friend: ${config.features.auto_comment_friend}`);
            console.log(`    - Auto Comment Video: ${config.features.auto_comment_video}`);
            console.log(`    - Auto Comment Group: ${config.features.auto_comment_group}`);
            console.log(`    - Delay Range: ${config.delays.min_delay}-${config.delays.max_delay} seconds`);
        } catch (error) {
            console.log('❌ Error loading config:', error.message);
        }
        
        // Test comments loading
        try {
            const commentsData = await fs.readFile('comments.txt', 'utf-8');
            const comments = commentsData.split('---').map(c => c.trim()).filter(c => c.length > 0);
            console.log(`\n💬 Loaded ${comments.length} fallback comments`);
            console.log(`    First comment preview: "${comments[0]?.slice(0, 50)}..."`);
        } catch (error) {
            console.log('❌ Error loading comments:', error.message);
        }
        
        // Test group links loading
        try {
            const linksData = await fs.readFile('group_links.txt', 'utf-8');
            const links = linksData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            console.log(`\n👥 Loaded ${links.length} group links`);
            console.log(`    First link: ${links[0]}`);
        } catch (error) {
            console.log('❌ Error loading group links:', error.message);
        }
        
        // Test Gemini API keys loading
        try {
            const keysData = await fs.readFile('gemini_api_keys.txt', 'utf-8');
            const keys = keysData.split('\n').map(k => k.trim()).filter(k => k.length > 0);
            console.log(`\n🤖 Found ${keys.length} Gemini API keys`);
            
            // Check if they're placeholder keys
            const hasPlaceholders = keys.some(key => key.includes('XXXXX'));
            if (hasPlaceholders) {
                console.log('    ⚠️  WARNING: Replace placeholder API keys with real ones!');
                console.log('    💡 Get real API keys from: https://aistudio.google.com/');
            } else {
                console.log('    ✅ API keys format looks good');
            }
        } catch (error) {
            console.log('❌ Error loading Gemini API keys:', error.message);
        }
        
        // Test cookies format
        try {
            const cookiesData = await fs.readFile('cookies.json', 'utf-8');
            const cookies = JSON.parse(cookiesData);
            if (Array.isArray(cookies) && cookies.length > 0) {
                console.log(`\n🍪 Cookies loaded: ${cookies.length} cookie entries`);
                
                // Check for essential Facebook cookies
                const essentialCookies = ['c_user', 'xs', 'datr'];
                const foundCookies = cookies.filter(c => essentialCookies.includes(c.name));
                
                if (foundCookies.length >= 2) {
                    console.log('    ✅ Essential Facebook cookies found');
                } else {
                    console.log('    ⚠️  WARNING: Some essential cookies might be missing');
                    console.log('    💡 Make sure to export all Facebook cookies');
                }
            } else {
                console.log('\n❌ Invalid cookies format - should be array of cookie objects');
            }
        } catch (error) {
            console.log('\n❌ Cookies not found or invalid format');
            console.log('    💡 Create cookies.json with Facebook cookies');
        }
        
        // Check logs directory
        const logsDir = path.join(__dirname, 'logs');
        try {
            await fs.mkdir(logsDir, { recursive: true });
            console.log('\n📁 Logs directory ready');
        } catch (error) {
            console.log('\n❌ Error creating logs directory:', error.message);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🚀 TEST COMPLETED!');
        console.log('='.repeat(50));
        
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Replace placeholder API keys in gemini_api_keys.txt');
        console.log('2. Add real Facebook cookies to cookies.json');
        console.log('3. Update group_links.txt with your target groups');
        console.log('4. Customize comments.txt');
        console.log('5. Run: npm start');
        
        console.log('\n⚠️  IMPORTANT REMINDERS:');
        console.log('- Make sure Facebook cookies are fresh (login manually first)');
        console.log('- Test with smaller comment limits first');
        console.log('- Monitor logs in logs/ directory');
        console.log('- Keep Gemini API keys active and with sufficient quota');
        console.log('- Respect Facebook\'s rate limits and community guidelines');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

if (require.main === module) {
    testBot();
}