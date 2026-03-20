import fitz
import traceback

pdf_path = r"c:\Users\Haresh\OneDrive\Desktop\ml\new_Dataset\Foundations of Artificial Intelligence.pdf"
out_path = r"c:\Users\Haresh\OneDrive\Desktop\ml\output.txt"

with open(out_path, "w", encoding="utf-8") as f:
    try:
        doc = fitz.open(pdf_path)
        f.write(f"Total pages: {len(doc)}\n")
        for i in range(min(5, len(doc))):
            page = doc[i]
            f.write(f"--- PAGE {i+1} ---\n")
            f.write(page.get_text())
            f.write("\n-------------\n")
        f.write("Success\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
        f.write(traceback.format_exc())
