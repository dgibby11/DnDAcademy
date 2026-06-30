import sys
from pypdf import PdfReader, PdfWriter


def split_pdf(path):
    reader = PdfReader(path)
    total = len(reader.pages)
    mid = total // 2

    for part, (start, end) in enumerate([(0, mid), (mid, total)], 1):
        writer = PdfWriter()
        for i in range(start, end):
            writer.add_page(reader.pages[i])
        out = path.replace(".pdf", f"_part{part}.pdf")
        with open(out, "wb") as f:
            writer.write(f)
        print(f"Part {part}: pages {start + 1}–{end} → {out}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python split_pdf.py <path/to/file.pdf>")
        sys.exit(1)
    split_pdf(sys.argv[1])
