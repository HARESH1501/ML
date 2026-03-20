import pdfplumber
import sys

pdf_path = r"c:\Users\Haresh\OneDrive\Desktop\ml\new_Dataset\Foundations of Artificial Intelligence.pdf"
try:
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages[:2]):
            print(f"--- PAGE {i+1} ---")
            text = page.extract_text()
            print(text)
except Exception as e:
    print(f"Error: {e}")
