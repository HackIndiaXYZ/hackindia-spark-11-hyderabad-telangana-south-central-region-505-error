from langchain_ollama import ChatOllama

def get_llm(model_name: str = "qwen2.5:7b", temperature: float = 0.0) -> ChatOllama:
    """Returns a reusable ChatOllama model instance."""
    return ChatOllama(
        model=model_name,
        temperature=temperature
    )
