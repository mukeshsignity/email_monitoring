import requests
import ollama

class AIService:
    def __init__(self, ollama_url="http://10.5.0.15:11434"):
        self.ollama_url = ollama_url
        self.models = [
            "llama3.1:8b",
            "qwen2.5vl:7b",
            "deepseek-r1:14b",
            "qwen2.5-coder:14b",
            "llama3.2-vision:11b",
            "bge-m3:latest",
            "imcurie/bge-large-en-v1.5:latest",
            "qwen2.5vl:latest",
            "gemma3:4b",
            "gpt-oss:20b",
            "llava:latest",
            "llama2:13b",
            "MHKetbi/DeepSeek-R1-Distill-Llama-8B-NexaQuant:latest",
            "qwen2.5:14b",
            "llama3.2-vision:latest",
            "ishumilin/deepseek-r1-coder-tools:14b",
            "qwen2.5-coder:latest"
        ]

    def get_models(self):
        """Fetch and list models available on your remote Ollama server."""
        response = requests.get(f"{self.ollama_url}/api/tags")
        if response.status_code == 200:
            data = response.json()
            return [model["name"] for model in data["models"]]
        else:
            print(f"Error fetching models: {response.status_code}")
            return []

    def run_inference(self, model_name, prompt):
        """Run inference on a specific model."""
        # Configure the Ollama client to use your remote server
        ollama._client._DEFAULT_BASE_URL = self.ollama_url
        try:
            response = ollama.chat(
                model=model_name,
                messages=[{"role": "user", "content": prompt}]
            )
            return response["message"]["content"]
        except ollama._types.ResponseError as e:
            print(f"ResponseError for model '{model_name}': {e}")
            return None
        except Exception as e:
            print(f"Unexpected error for model '{model_name}': {e}")
            return None

    def get_intent(self, text):
        """Determine the intent behind the email with multiple models."""
        results = {}
        for model in self.models:
            print(f"Getting intent using {model}...")
            results[model] = self.run_inference(model, f"Ascertain the intent behind this email: {text}")
        return results

    def get_tone(self, text):
        """Determine the tone of the email with multiple models."""
        results = {}
        for model in self.models:
            print(f"Getting tone using {model}...")
            results[model] = self.run_inference(model, f"Determine the tone of this email: {text}")
        return results

    def generate_reply(self, intent, tone):
        """Generate a professional reply based on intent and tone."""
        results = {}
        for model in self.models:
            prompt = (
                f"Compose a professional response to an email "
                f"with intent '{intent}' and tone '{tone}'."
            )
            print(f"Generating reply using {model}...")
            reply = self.run_inference(model, prompt)
            results[model] = reply
        return results
