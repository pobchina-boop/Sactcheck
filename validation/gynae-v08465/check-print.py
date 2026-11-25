"""Run from the repository root with PyMuPDF, Pillow, lxml and zxing-cpp installed."""
import json
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlsplit

import fitz
from lxml import html
from PIL import Image
import zxingcpp


def normalise(text):
    return " ".join(unicodedata.normalize("NFKC", text).lower().split())


def check_suite(code):
    base = Path("patient") / code
    record = json.loads((Path("data/patient-knowledge") / (code + ".json")).read_text())
    portal = f"https://sactcheck.com/patient/{code}/"
    destinations = {portal, portal + "knowledge.html"}
    for name, target in [("qr.png", portal), ("oncowiki-qr.png", portal + "knowledge.html")]:
        assert [r.text for r in zxingcpp.read_barcodes(Image.open(base / name))] == [target]
    pdfs = sorted(base.glob("*.pdf"))
    for file in pdfs:
        assert file.read_bytes() == (Path("docs") / file).read_bytes(), file
        with fitz.open(file) as doc:
            text = normalise(" ".join(page.get_text() for page in doc))
            for page in doc:
                assert page.get_text().strip(), (file, page.number)
                for x0, y0, x1, y1, *_ in page.get_text("words"):
                    assert x0 >= -2 and y0 >= -2 and x1 <= page.rect.width + 2 and y1 <= page.rect.height + 2, (file, page.number)
            if file.stem in {"guide", "handbook", "knowledge"}:
                for row in record["anatomy"]:
                    assert normalise(row[3]) in text, (file, row[0])
            if file.stem in {"guide", "sactcard", "handbook"}:
                pix = doc[-1].get_pixmap(dpi=200)
                image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                decoded = {r.text for r in zxingcpp.read_barcodes(image)}
                assert decoded and decoded <= destinations, file
    count = 0
    for file in base.glob("*.html"):
        page = html.fromstring(file.read_bytes())
        for ref in page.xpath("//@href | //@src"):
            url = urlsplit(ref)
            if url.scheme or url.netloc or not url.path:
                continue
            path = Path(unquote(url.path.lstrip("/"))) if url.path.startswith("/") else file.parent / unquote(url.path)
            assert path.exists(), (file, ref)
            count += 1
    return len(pdfs), count


totals = [check_suite(code) for code in ["00303","00306","00308","00624","00819","00862","00929"]]
print(f"{sum(x[0] for x in totals)} PDFs and mirrors, {sum(x[1] for x in totals)} local references, all anatomy instructions and wallet QR checks passed.")
