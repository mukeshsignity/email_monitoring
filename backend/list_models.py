import requests

OLLAMA_URL = "http://10.5.0.15:11434"

def get_models():
    response = requests.get(f"{OLLAMA_URL}/api/tags")
    if response.status_code == 200:
        data = response.json()
        models = [model["name"] for model in data["models"]]
        return models
    else:
        print("Error fetching models:", response.status_code)
        return []

# Print all models
models = get_models()
print("Available models:")
for model in models:
    print(f" - {model}")
