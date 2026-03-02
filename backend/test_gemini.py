import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")

# Check if API key is set
if not api_key:
    print("ERROR: GEMINI_API_KEY environment variable not found")
    exit()

# Display API key info (masked for security)
print("[OK] API Key is set")
print(f"[OK] API Key length: {len(api_key)} characters")
print(f"[OK] API Key preview: {api_key[:10]}...{api_key[-10:]}")

# Test the API connection
genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-pro")

try:
    response = model.generate_content("Say hello")
    print("[OK] API Connection Successful!")
    print(f"Response: {response.text}")
except Exception as e:
    print("[FAILED] API Connection Failed!")
    print(f"Error: {e}")
