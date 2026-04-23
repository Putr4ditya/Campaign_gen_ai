import os
import json
import urllib.parse
import requests
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ─── OpenRouter API ───────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY is not set in environment variables.")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()

    product_name  = data.get("product_name", "").strip()
    target_market = data.get("target_market", "").strip()
    vibe          = data.get("vibe", "").strip()
    language      = data.get("language", "Bahasa Indonesia").strip()

    if not all([product_name, target_market, vibe]):
        return jsonify({"success": False, "error": "Semua field harus diisi."}), 400

    prompt = f"""
Create a complete creative marketing campaign for this brand:

- Product / Brand Name : {product_name}
- Target Market        : {target_market}
- Campaign Vibe / Style: {vibe}
- Copy Language        : {language}

Return ONLY a single valid JSON object with exactly these keys:

{{
  "headline": "Catchy main headline — max 10 words, in {language}",
  "tagline": "Memorable tagline — max 8 words, in {language}",
  "copywriting": "Compelling 2–3 paragraph product description & value proposition in {language}",
  "image_prompt": "Highly detailed English prompt (60–80 words) for an AI image generator.",
  "instagram_caption": "Engaging Instagram caption with emojis in {language}, 150–200 words.",
  "hashtags": ["hashtag1", "hashtag2"]
}}

Rules:
- hashtags array must contain 15–20 items, without the # symbol
- Do NOT wrap the JSON in markdown
- Do NOT add text outside JSON
"""

    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "google/gemma-4-26b-a4b-it:free",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert creative marketing strategist. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        response = requests.post(OPENROUTER_URL, headers=headers, json=payload)
        result = response.json()

        # 🔍 Ambil output teks dari OpenRouter
        raw = result["choices"][0]["message"]["content"].strip()

        # Safety strip markdown
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        campaign = json.loads(raw)

        # ── Generate image URL ────────────────────────────────────────────────
        img_prompt = campaign.get("image_prompt", "")
        encoded = urllib.parse.quote(img_prompt)
        image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&seed=42"

        campaign["image_url"] = image_url

        return jsonify({"success": True, "data": campaign})

    except json.JSONDecodeError as e:
        return jsonify({"success": False, "error": f"Gagal parse JSON: {e}"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)