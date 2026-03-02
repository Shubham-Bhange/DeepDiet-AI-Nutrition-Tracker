import os
import json
from google import genai

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY (or GOOGLE_API_KEY/API_KEY) environment variable not found")
    print("Set it and re-run. Example (PowerShell): $env:GEMINI_API_KEY=\"YOUR_KEY\"")
    raise SystemExit(1)

print("[OK] Using API key (masked): {}...{}".format(api_key[:8], api_key[-8:]))


def call_list_models(genai_mod, api_key):
    # Try common patterns to call list models with the new `google.genai` package.
    # 1) Direct function
    try:
        if hasattr(genai_mod, "list_models"):
            return genai_mod.list_models()
    except Exception as e:
        print("Attempt to call genai.list_models() failed:", e)

    # 2) Try client classes with common names
    client_class_names = [
        "Client",
        "GenAIClient",
        "GenaiClient",
        "GenerativeModelsClient",
        "ModelsClient",
        "GenerationClient",
    ]

    for cls_name in client_class_names:
        cls = getattr(genai_mod, cls_name, None)
        if cls is None:
            continue
        try:
            # Try common constructor signatures
            try:
                client = cls(api_key=api_key)
            except TypeError:
                try:
                    client = cls(credential=api_key)
                except TypeError:
                    client = cls()

            # Try common list methods on the client
            for method_name in ("list_models", "models_list", "get_models", "listAvailableModels", "list"):
                method = getattr(client, method_name, None)
                if callable(method):
                    try:
                        return method()
                    except Exception as e:
                        print(f"Client.{method_name}() raised:", e)
            # Try nested `models` collection
            nested = getattr(client, "models", None)
            if nested is not None:
                for method_name in ("list", "list_models"):
                    method = getattr(nested, method_name, None)
                    if callable(method):
                        try:
                            return method()
                        except Exception as e:
                            print(f"client.models.{method_name}() raised:", e)
        except Exception as e:
            print(f"Attempt to use client class {cls_name} failed:", e)

    # 3) As a last resort, try to discover available callables
    print("Could not find a supported list_models() entrypoint on google.genai. Module attributes:")
    attrs = sorted([a for a in dir(genai_mod) if not a.startswith("__")])
    print(attrs)
    raise SystemExit(2)


try:
    raw = call_list_models(genai, api_key)
except SystemExit:
    raise
except Exception as e:
    print("Failed to call list models:", e)
    raise SystemExit(1)

# Normalise response: some clients return {'models': [...]}
if isinstance(raw, dict) and "models" in raw:
    models = raw["models"]
else:
    try:
        models = list(raw)
    except TypeError:
        models = raw

if not models:
    print("No models returned from API.")
    raise SystemExit(0)

try:
    count = len(models)
except TypeError:
    count = "(unknown)"

print(f"Found {count} model entries.\n")

def inspect_model(m):
    if isinstance(m, dict):
        name = m.get("name") or m.get("model") or m.get("id") or "<unknown>"
        display = m.get("displayName") or m.get("title") or ""
        keys = list(m.keys())
    else:
        name = str(m)
        display = ""
        keys = []

    # Find likely supported generation-related keys
    gen_keys = [k for k in keys if "generate" in k.lower() or "support" in k.lower() or "method" in k.lower() or "capab" in k.lower()]

    print(f"Model: {name}")
    if display:
        print(f"  Display: {display}")
    print(f"  Top-level keys: {', '.join(keys)}")
    if gen_keys:
        print("  Likely generation-related keys:")
        for k in gen_keys:
            try:
                print(f"    - {k}: {json.dumps(m.get(k), indent=2) if isinstance(m.get(k), (dict, list)) else m.get(k)}")
            except Exception:
                print(f"    - {k}: <unprintable>")
    else:
        # Try looking inside nested metadata
        if "metadata" in m and isinstance(m["metadata"], dict):
            meta = m["metadata"]
            meta_keys = [k for k in meta.keys() if "generate" in k.lower() or "method" in k.lower() or "capab" in k.lower()]
            if meta_keys:
                print("  Generation info in metadata:")
                for k in meta_keys:
                    print(f"    - metadata.{k}: {meta[k]}")
    print("")

# Print overview for each model
for m in models:
    inspect_model(m)

# Check for a specific model name commonly used
target = "gemini-pro"
matches = [m for m in models if (isinstance(m, dict) and (target in (str(m.get("name") or "")).lower() or target in (str(m.get("displayName") or "")).lower()))]
if matches:
    print(f"\n'{target}' was found in the model list ({len(matches)} match(es)). See first match below:")
    print(json.dumps(matches[0], indent=2))
else:
    print(f"\n'{target}' was NOT found in the model list. Use the printed model names above to pick an available model.")

print("\nTip: look for model entries that list generation methods like 'generateText', 'generateContent', or 'generate' in their keys. Those are the methods you can call with this API key.")
