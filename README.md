# Facebook Auto Comment Bot dengan Gemini AI 🤖

Bot Facebook otomatis yang menggunakan Gemini AI untuk memberikan komentar yang contextual dan relevan pada postingan, sesuai dengan video demo yang ditampilkan.

## 🎯 Fitur Utama (Sesuai Video)

### ✅ Auto Comment Friend
- Memberikan komentar pada postingan teman di Facebook feed
- Menggunakan Gemini AI untuk generate komentar yang relate dengan isi postingan

### ✅ Auto Comment Video  
- Komentar otomatis pada video di Facebook Watch
- Targeting video yang sedang trending

### ✅ Auto Comment Group
- Komentar pada postingan di grup Facebook
- Membaca group links dari file `group_links.txt`

### ✅ Auto Post Group
- Posting konten otomatis ke multiple grup Facebook
- Konten diambil dari file `post_content.txt`

### ✅ Gemini AI Integration
- **Contextual Comments**: AI membaca isi postingan dan generate komentar yang relate
- **Multiple API Key Management**: Support multiple API key dengan auto-rotation
- **Smart Fallback**: Jika AI gagal, gunakan predefined comments
- **Call-to-Action**: Komentar dengan CTA yang natural

### ✅ Anti-Duplicate System
- Tracking postingan yang sudah dikomentari dalam `ceklink.txt`
- Prevent duplicate comments menggunakan unique post identification

### ✅ Human-like Behavior
- Random delay 60-120 detik (sesuai video)
- Natural scrolling dan interaction patterns
- Puppeteer Stealth untuk avoid detection

## 📋 Persyaratan

- Node.js 18+
- Facebook account dengan cookies yang valid
- Gemini AI API keys (bisa multiple)
- Chrome/Chromium browser

## 🛠️ Instalasi

### 1. Download & Install Dependencies
```bash
# Download semua file script
# Pastikan semua file ada di direktori yang sama

# Install dependencies
npm install
```

### 2. Setup Gemini API Keys
1. Kunjungi [Google AI Studio](https://aistudio.google.com/)
2. Login dengan Google account
3. Generate API key (buat beberapa untuk backup)
4. Edit file `gemini_api_keys.txt`, ganti placeholder dengan API key asli:

```
AIzaSyYour_Real_API_Key_Here_1234567890ABC
AIzaSyYour_Real_API_Key_Here_2345678901BCD
AIzaSyYour_Real_API_Key_Here_3456789012CDE
```

### 3. Setup Facebook Cookies
1. Login ke Facebook di browser
2. Buka Developer Tools (F12)
3. Go to **Application** → **Cookies** → **https://facebook.com**
4. Copy semua cookies ke file `cookies.json`:

```json
[
  {
    "name": "c_user",
    "value": "your_user_id_here",
    "domain": ".facebook.com",
    "path": "/",
    "httpOnly": false,
    "secure": true
  },
  {
    "name": "xs",
    "value": "your_xs_value_here",
    "domain": ".facebook.com",
    "path": "/",
    "httpOnly": true,
    "secure": true
  }
]
```

**💡 Tips untuk Extract Cookies:**
- Install extension "Cookie Editor" untuk mudah export cookies
- Pastikan login Facebook fresh sebelum extract cookies
- Include semua cookies, terutama `c_user`, `xs`, dan `datr`

### 4. Konfigurasi Target Groups
Edit file `group_links.txt` dengan grup Facebook target Anda:

```
https://www.facebook.com/groups/your-target-group-1
https://www.facebook.com/groups/your-target-group-2
https://www.facebook.com/groups/your-target-group-3
```

### 5. Kustomisasi Komentar & Konten
- **comments.txt**: Edit fallback comments (jika AI gagal)
- **post_content.txt**: Edit konten untuk auto post ke grup
- **config.json**: Sesuaikan limits dan delays

## 🚀 Cara Menjalankan

### Testing Setup
```bash
npm test
```

### Jalankan Bot
```bash
npm start
```

### Development Mode (Auto-restart)
```bash
npm run dev
```

## ⚙️ Konfigurasi Lanjutan

### config.json
```json
{
  "features": {
    "auto_comment_friend": true,
    "auto_comment_video": true,
    "auto_comment_group": true,
    "auto_post_group": true
  },
  "comment_limits": {
    "friends_feed": 5,
    "video_feed": 3,
    "group_feed": 4
  },
  "delays": {
    "min_delay": 60,
    "max_delay": 120
  }
}
```

### Multiple API Key Rotation
Bot otomatis rotasi API key jika:
- API key invalid atau expired
- Rate limit exceeded  
- API error terjadi

### Gemini AI Prompt
Bot menggunakan prompt yang dioptimasi:
```
Buatkan komentar yang relate dan natural untuk postingan Facebook berikut:
"[POST_CONTENT]"

Requirements:
- Komentar harus relate dengan konten postingan
- Gunakan bahasa Indonesia yang natural dan friendly
- Maksimal 2-3 kalimat
- Boleh gunakan emoji yang sesuai
- Tambahkan call-to-action ringan jika sesuai
```

## 📊 Monitoring & Logs

### Log Files
- `logs/bot-YYYY-MM-DD.log`: Daily execution logs
- `ceklink.txt`: Anti-duplicate tracking

### Log Monitoring
```bash
# Watch logs real-time
tail -f logs/bot-$(date +%Y-%m-%d).log
```

## 🔧 Troubleshooting

### Bot Tidak Bisa Login
```bash
# Cek cookies
npm test

# Update cookies dari browser fresh
# Login manual ke Facebook, extract cookies baru
```

### Gemini AI Error
```bash
# Cek API keys di gemini_api_keys.txt
# Pastikan format benar: AIzaSy...
# Cek quota di Google AI Studio
```

### Komentar Tidak Muncul
```bash
# Cek logs untuk error details
cat logs/bot-$(date +%Y-%m-%d).log | grep ERROR

# Facebook mungkin update selector
# Update selectors di config.json jika perlu
```

### Rate Limiting Facebook
- Kurangi comment limits di config.json
- Increase delay range (min_delay, max_delay)
- Gunakan cookies yang fresh

## 📁 File Structure Lengkap

```
facebook-bot/
├── index.js                 # Main bot script (800+ lines)
├── package.json             # Dependencies
├── config.json              # Bot configuration  
├── test.js                  # Testing utilities
├── comments.txt             # Fallback comments
├── group_links.txt          # Target Facebook groups
├── gemini_api_keys.txt      # Multiple AI API keys
├── post_content.txt         # Content for auto posting
├── cookies.json             # Facebook authentication (create this)
├── ceklink.txt              # Anti-duplicate log (auto-created)
└── logs/                    # Execution logs (auto-created)
    └── bot-YYYY-MM-DD.log
```

## 🎯 Best Practices

### 1. Account Safety
- Jangan terlalu agresif dengan frequency
- Monitor logs secara berkala  
- Gunakan delay yang realistic (60-120 detik)
- Refresh cookies secara berkala

### 2. Content Quality
- Buat fallback comments yang natural
- Hindari komentar yang terlalu promotional
- Gunakan emoji secukupnya
- Pastikan konten auto post valuable

### 3. API Management
- Gunakan multiple Gemini API key
- Monitor quota usage di Google AI Studio
- Backup API keys jika ada yang expired

### 4. Group Targeting
- Pilih grup yang relevan dengan konten
- Respect group rules dan guidelines
- Avoid spam dengan delay yang cukup

## 🤖 Cara Kerja AI

### Contextual Comment Flow
1. Bot extract konten postingan (text, caption)
2. Send ke Gemini AI dengan custom prompt
3. AI generate komentar yang relate dan natural  
4. Jika AI gagal → fallback ke predefined comments
5. Post comment dengan human-like timing

### API Key Rotation Logic
```javascript
// Auto-switch jika current API key error
if (apiKeyError) {
    this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.geminiApiKeys.length;
    // Try next API key
}
```

## 📊 Expected Results

Sesuai dengan video demo:
- ✅ Komentar contextual yang relate dengan postingan
- ✅ Multiple API key rotation otomatis  
- ✅ Anti-duplicate system mencegah spam
- ✅ Natural delays (60-120 detik)
- ✅ Call-to-action dalam komentar
- ✅ Auto posting ke multiple grup
- ✅ Comprehensive logging system

## ⚠️ Important Notes

### Legal & Ethical
- Bot ini untuk educational dan personal use
- Respect Facebook Terms of Service
- Jangan gunakan untuk spam atau aktivitas berbahaya
- Always follow community guidelines

### Security
- Jangan share cookies atau API keys
- Use private repository jika di Git
- Regular update cookies untuk security

### Performance  
- Start dengan limits kecil untuk testing
- Monitor success rate di logs
- Adjust delays berdasarkan response Facebook

## 🆘 Support & FAQ

### Q: Bot tidak jalan setelah setup?
A: Jalankan `npm test` untuk check semua file dan konfigurasi

### Q: Gemini AI tidak generate comment?
A: Cek API keys di gemini_api_keys.txt, pastikan valid dan ada quota

### Q: Cookies expired?
A: Login fresh ke Facebook, extract cookies baru ke cookies.json

### Q: Bot detected oleh Facebook?
A: Increase delays, refresh cookies, kurangi frequency

## 📞 Contact & Updates

Jika ada bug atau request fitur tambahan, silakan report dengan detail:
- Versi Node.js yang digunakan
- Error message dari logs
- Steps yang sudah dicoba

---

**🚀 Happy Automating! Gunakan dengan bijak dan respect platform guidelines.**