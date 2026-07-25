import fitz  # PyMuPDF

def extract_text(pdf_path: str) -> str:
    """Extracts plain text content from a PDF file using PyMuPDF."""
    pdf = fitz.open(pdf_path)
    text = ""
    for page in pdf:
        text += page.get_text()
    pdf.close()
    return text
