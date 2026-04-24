import os
import json
import urllib.parse
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)

# ─── Gemini Model ─────────────────────────────────────────────────────────────
model = genai.GenerativeModel(
    model_name="gemini-3-flash-preview",
    system_instruction=(
        "You are an expert creative marketing strategist specializing in Indonesian SMEs (UMKM). "
        "You craft compelling, culturally resonant campaigns that drive engagement and sales. "
        "You MUST always respond with valid JSON only — no markdown, no code blocks, no extra text."
    )
)

# ─── Routes 
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
  "image_prompt": "Highly detailed English prompt (60–80 words) for an AI image generator. Describe the product advertisement visual: style, lighting, composition, props, color palette, and mood that perfectly matches '{vibe}'. Make it vivid and specific.",
  "instagram_caption": "Engaging Instagram caption with emojis in {language}, 150–200 words. Include a strong call-to-action.",
  "hashtags": ["hashtag1", "hashtag2"]
}}

Rules:
- hashtags array must contain 15–20 items, without the # symbol
- Do NOT wrap the JSON in markdown code fences
- Do NOT add any text outside the JSON object
"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Safety strip — remove accidental markdown fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        campaign = json.loads(raw)

        # ── Build Pollinations.ai image URL (free, no API key needed) 
        img_prompt   = campaign.get("image_prompt", "")
        encoded      = urllib.parse.quote(img_prompt)
        image_url    = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width=1024&height=1024&nologo=true&enhance=true&seed=42"
        )
        campaign["image_url"] = image_url

        return jsonify({"success": True, "data": campaign})

    except json.JSONDecodeError as e:
        return jsonify({"success": False, "error": f"Gagal parse respons AI: {e}"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─── Run 
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
