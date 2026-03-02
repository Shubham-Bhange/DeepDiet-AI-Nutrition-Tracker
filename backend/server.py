from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from PIL import Image
import io
import os
import json
import re

# =====================================================
# GEMINI API CONFIGURATION (NEW SDK)
# =====================================================

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set")

client = genai.Client(api_key=API_KEY)

# =====================================================
# FASTAPI SETUP
# =====================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# HELPER FUNCTIONS
# =====================================================

def extract_json(text: str):
    if not text:
        return None

    text = re.sub(r"```json|```", "", text).strip()
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        return None

    try:
        return json.loads(text[start:end + 1])
    except:
        return None


def f(x, d=0.0):
    try:
        return float(x)
    except:
        return d


# =====================================================
# DISH SCAN ENDPOINT (GEMINI VISION)
# =====================================================

@app.post("/api/dish-scan")
async def dish_scan(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        prompt = """
You are an advanced food vision nutrition estimation engine.

Your job:
1. Detect ALL visible food items in the image.
2. Never merge different items into one.
3. Detect even small sides like:
   - papad
   - pickle
   - chutney
   - salad
   - curd
4. Estimate quantity realistically using visual cues.
5. Estimate nutrition per item.
6. Then calculate total nutrition as sum of items.

Return STRICT JSON only.

Rules:
- If 2 rotis → quantity_value = 2, unit = "roti"
- If 1 bowl dal → quantity_value = 1, unit = "bowl"
- If rice pile → estimate in grams
- If unsure → still estimate reasonably
- Do not skip small visible items
- Do not hallucinate items not visible

Format:

{
  "dish_name": "string",
  "portion_label": "small|medium|large",
  "estimated_grams": number,

  "items": [
    {
      "name": "string",
      "quantity_value": number,
      "quantity_unit": "roti|piece|bowl|cup|gram|idli|dosa|egg|unknown",
      "portion_text": "string",
      "grams_estimated": number,
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number
    }
  ],

  "nutrition": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number
  },

  "confidence": number,
  "notes": "short explanation"
}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt, image]
        )

        raw_text = response.text
        data = extract_json(raw_text)

        if not data:
            raise ValueError("Failed to parse Gemini output")

        # ---------- Normalize ----------
        data.setdefault("dish_name", "Unknown Dish")
        data.setdefault("portion_label", "medium")
        data.setdefault("estimated_grams", 300)
        data.setdefault("confidence", 0)
        data.setdefault("notes", "")

        data["estimated_grams"] = f(data["estimated_grams"], 300)
        data["confidence"] = f(data["confidence"], 0)

        cleaned = []
        for it in data.get("items", []):
            if not isinstance(it, dict):
                continue

            cleaned.append({
                "name": str(it.get("name", "Unknown")),
                "quantity_value": f(it.get("quantity_value", 0)),
                "quantity_unit": str(it.get("quantity_unit", "unknown")),
                "portion_text": str(it.get("portion_text", "")),
                "grams_estimated": f(it.get("grams_estimated", 0)),
                "calories": f(it.get("calories", 0)),
                "protein_g": f(it.get("protein_g", 0)),
                "carbs_g": f(it.get("carbs_g", 0)),
                "fat_g": f(it.get("fat_g", 0)),
            })

        data["items"] = cleaned

        nutr = data.get("nutrition", {})
        data["nutrition"] = {
            "calories": f(nutr.get("calories", 0)),
            "protein_g": f(nutr.get("protein_g", 0)),
            "carbs_g": f(nutr.get("carbs_g", 0)),
            "fat_g": f(nutr.get("fat_g", 0)),
            "fiber_g": f(nutr.get("fiber_g", 0)),
            "sugar_g": f(nutr.get("sugar_g", 0)),
            "sodium_mg": f(nutr.get("sodium_mg", 0)),
        }

        return data

    except Exception as e:
        return {
            "dish_name": "Unknown Dish",
            "portion_label": "medium",
            "estimated_grams": 300,
            "items": [],
            "nutrition": {
                "calories": 0,
                "protein_g": 0,
                "carbs_g": 0,
                "fat_g": 0,
                "fiber_g": 0,
                "sugar_g": 0,
                "sodium_mg": 0
            },
            "confidence": 0,
            "notes": f"Error: {str(e)}"
        }


# =====================================================
# CHATBOT ENDPOINT (SIMPLE + HUMAN + SLIGHTLY FUNNY)
# =====================================================

class ChatRequest(BaseModel):
    message: str
    context: dict | None = None


@app.post("/api/chat")
async def chat_with_ai(req: ChatRequest):
    try:
        user_message = req.message.strip()
        context = req.context or {}

        prompt = f"""
You are DeepDiet AI — a friendly nutrition assistant inside a final-year college project.

User question:
{user_message}

Meal context (if available):
{json.dumps(context)}

Personality Rules:
- Speak in VERY simple English.
- Short sentences.
- Friendly tone.
- Slightly funny (light humor only).
- No medical claims.
- No markdown.
- No long essays.

Behavior Rules:
- If user asks about meal → use meal data.
- If calories are high → gently warn.
- If protein is good → appreciate it.
- If user asks about DeepDiet → explain simply.
- If unclear → ask short follow-up.

Example tone:
- "Looks tasty 😄 but maybe a little heavy on oil."
- "Protein is good. Gym would smile."
- "Calories are fine… just don’t make this your midnight hobby."

Now answer in plain text only.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        reply = response.text.strip()

        return {"reply": reply}

    except Exception as e:
        return {"reply": f"Oops! Something went wrong: {str(e)}"}