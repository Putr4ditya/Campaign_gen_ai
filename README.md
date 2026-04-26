# 🎨 CampaignAI — AI Creative Campaign Generator

Aplikasi web berbasis **Flask** yang membantu UMKM membuat kampanye kreatif secara otomatis menggunakan **Multimodal Generative AI**.

---

## ✨ Fitur Utama

| Fitur                  | Teknologi                           |
| ---------------------- | ----------------------------------- |
| Copywriting & Headline | Gemini API (Teks → Teks)            |
| Visual Produk          | Pollinations.ai API (Teks → Gambar) |
| Instagram Caption      | Gemini API (Teks → Teks)            |
| Hashtag Generator      | Gemini API (Teks → Teks)            |

## 🏗️ Arsitektur Sistem

```
User Input (Nama Produk + Target Market + Vibe)
        │
        ▼
   Flask Backend (app.py)
        │
        ├──► Google Gemini API ──► Headline, Tagline, Copywriting,
        │                          Image Prompt, Caption, Hashtags (JSON)
        │
        └──► Pollinations.ai ───► Visual Produk (Generated Image URL)
                                        │
                                        ▼
                              Frontend (HTML/CSS/JS)
                              Menampilkan semua output
```

## 🚀 Cara Menjalankan

### 1. Clone & Masuk ke Folder

```bash
git clone <repo-url>
cd campaign-ai
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env dan isi OPENROUTER_API_KEY dengan API key kamu
```

### 4. Dapatkan Gemini API Key (Gratis)

1. Buka [https://aistudio.google.com/app/apikey]
2. Klik **Create API Key**
3. Copy dan paste ke file `.env`

### 5. Jalankan Aplikasi

```bash
python app.py
```

Buka browser: **http://localhost:5000**

---

## 👥 Tim

Tugas UTS — Implementasi Multimodal Generative AI
