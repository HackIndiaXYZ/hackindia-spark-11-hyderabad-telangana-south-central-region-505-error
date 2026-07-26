from langchain_ollama import ChatOllama

def get_llm(model_name: str = "qwen2.5:7b", temperature: float = 0.0) -> ChatOllama:
    """Returns an optimized, high-performance ChatOllama model instance."""
    return ChatOllama(
        model=model_name,
        temperature=temperature,
        num_predict=384,
        num_ctx=2048,
        timeout=30.0
    )

