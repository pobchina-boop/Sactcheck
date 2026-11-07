#!/usr/bin/env python3
"""Independently verify the v0.84.43 patient-document presentation migration.

Read-only for patient assets. Use --stage to inspect staged candidate PDFs before
publishing; omit it to verify patient/docs mirrors after publication. This gate
does not certify clinical source currency, live URLs or physical-device scanning.
"""
from pathlib import Path
import argparse
import collections
import concurrent.futures
import hashlib
import importlib.metadata
import io
import json
import re
import struct
import subprocess
import sys
import unicodedata
from urllib.parse import urljoin, urlparse

try:
    import pymupdf as fitz
except ImportError:
    import fitz
from lxml import html as LH
from PIL import Image
import zxingcpp

ROOT = Path(__file__).resolve().parents[1]
BASE_COMMIT = "67aaa3579794278074478b3f6cce4e57c803e4db"
BASE_TREE = "ba65db9ba843ef3d191f7acd5af2b195f453e229"
SCOPE_FILE = ROOT / "validation/patient-design-v08443/scope.json"
SCOPE = json.loads(SCOPE_FILE.read_text())
PHASES = json.loads((ROOT / "validation/patient-design-v08443/applicable-support-sheets.json").read_text())
SECTIONS = ["guide.pdf", "knowledge.pdf", "treatment-journey.pdf", "supportive-care.pdf", "logistics.pdf", "passport.pdf", "sactcard.pdf"]
GENERATED = ["guide.pdf", "knowledge.pdf", "handbook.pdf"]
ALLOWED_PATIENT = {"index.html", "guide.html", "guide.pdf", "knowledge.html", "knowledge-print.html", "knowledge.pdf", "handbook.pdf", "supportive-care.html"}
INFINITE = fitz.Rect(-1000000, -1000000, 1000000, 1000000)
HASH = lambda value: hashlib.sha256(value).hexdigest()


class VerificationError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise VerificationError(message)


def norm(text):
    return re.sub(r"[^\w]", "", unicodedata.normalize("NFKC", text).replace("\u00ad", "")).casefold()


def words_counter(text):
    return collections.Counter(re.findall(r"\w+", unicodedata.normalize("NFKC", text).replace("\u00ad", "").casefold()))


def rounded(values):
    return tuple(round(float(value), 4) for value in values)


def git_bytes(relative):
    command = subprocess.run(["git", "show", BASE_COMMIT + ":" + relative], cwd=ROOT, capture_output=True)
    require(command.returncode == 0, "Missing pinned baseline file: " + relative)
    return command.stdout


def baseline_bytes(info):
    require(info and info.get("present"), "Requested a nonexistent baseline file")
    path = ROOT / info["path"]
    content = path.read_bytes() if path.is_file() else b""
    if HASH(content) != info["sha256"]:
        content = git_bytes(info["path"])
    require(HASH(content) == info["sha256"], "Baseline SHA-256 mismatch: " + info["path"])
    blob = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
    require(blob == info["git_blob_sha1"], "Baseline Git blob mismatch: " + info["path"])
    return content


def stream_hashes(page, omit_folio=None):
    hashes = []
    removed = 0
    for xref in page.get_contents():
        value = page.parent.xref_stream(xref)
        if omit_folio:
            tokens = []
            for candidate in re.findall(rb"<([0-9a-fA-F]+)>", value):
                try:
                    tokens.append(bytes.fromhex(candidate.decode()).decode("ascii"))
                except (ValueError, UnicodeDecodeError):
                    pass
            tokens += [v.decode("ascii", errors="replace") for v in re.findall(rb"\(([^()]*)\)", value)]
            if tokens == [omit_folio] and re.search(rb"\b10\s+Tm\b", value):
                removed += 1
                continue
        hashes.append(HASH(value))
    if omit_folio:
        require(removed == 1, "Cannot independently isolate exactly one old global folio: " + omit_folio)
    return hashes


def contiguous(needle, haystack):
    return bool(needle) and any(haystack[i:i + len(needle)] == needle for i in range(len(haystack) - len(needle) + 1))


def page_words(page, omit_folio=None):
    words = page.get_text("words", clip=INFINITE)
    ignored = set()
    if omit_folio:
        matches = []
        for i, word in enumerate(words):
            if word[1] < page.rect.height - 35:
                continue
            for size in range(1, 7):
                group = words[i:i + size]
                if len(group) == size and all(value[1] >= page.rect.height - 35 for value in group) and norm(" ".join(value[4] for value in group)) == norm(omit_folio):
                    matches.append(set(range(i, i + size)))
        require(len(matches) == 1, "Cannot independently isolate old folio words: " + omit_folio)
        ignored = matches[0]
    result = []
    for i, word in enumerate(words):
        if i in ignored:
            continue
        result.append((word[4], *rounded(word[:4])))
    return result


def image_geometry(page):
    # Visible-image digest and transformation prove image resources were not
    # silently substituted while the page's text/content streams were retained.
    return [(bytes(image["digest"]).hex(), tuple(image.get("bbox", ())), tuple(image.get("transform", ())), image["width"], image["height"])
            for image in page.get_image_info(hashes=True)]


def font_program_hash(data):
    if data[:4] in [b"\x00\x01\x00\x00", b"OTTO", b"true"]:
        # PDF font deduplication can select a byte-equivalent glyph subset whose
        # head creation/modification timestamp differs. Compare every SFNT table
        # including glyph outlines, metrics, cmap and naming; ignore ONLY the
        # head checksum adjustment and timestamp bytes, never font geometry.
        count = struct.unpack(">H", data[4:6])[0]
        tables = []
        for i in range(count):
            tag, checksum, offset, length = struct.unpack(">4sIII", data[12 + i * 16:28 + i * 16])
            table = bytearray(data[offset:offset + length])
            require(len(table) == length, "Truncated embedded font table")
            if tag == b"head":
                table[8:12] = b"\0" * 4
                table[20:36] = b"\0" * 16
            tables.append((tag.decode("ascii"), HASH(table)))
        return HASH(json.dumps(sorted(tables)).encode())
    return HASH(data)


def font_resources(page):
    result = {}
    for font in page.get_fonts(full=True):
        xref, resource = font[0], font[4]
        extracted = page.parent.extract_font(xref)
        result[resource] = (font[1], font[2], font[3], font_program_hash(extracted[3]) if extracted[3] else None)
    return result


def geometry(page):
    return {"rect": rounded(page.rect), "media_box": rounded(page.mediabox), "crop_box": rounded(page.cropbox), "rotation": page.rotation}


def compare_page(original, candidate, label, omit_folio=None, exact_streams=False):
    original_streams = stream_hashes(original, omit_folio)
    current_streams = stream_hashes(candidate)
    require(original_streams == current_streams if exact_streams else contiguous(original_streams, current_streams), label + ": original PDF streams changed or reordered")
    require(geometry(original) == geometry(candidate), label + ": page geometry changed")
    old_words = collections.Counter(page_words(original, omit_folio))
    new_words = collections.Counter(page_words(candidate))
    missing_words = old_words - new_words
    require(not missing_words, label + ": original word text/coordinates changed: " + str(list(missing_words)[:3]))
    require(image_geometry(original) == image_geometry(candidate), label + ": visible image bytes or transformations changed")
    current_fonts = font_resources(candidate)
    for name, value in font_resources(original).items():
        require(current_fonts.get(name) == value, label + ": original font resource changed: " + name)
    return {"body_streams": len(original_streams), "original_words": sum(old_words.values()), "page_geometry_unchanged": True, "image_geometry_unchanged": True, "font_resources_unchanged": True}


def bound_words(page, omit_folio=None):
    return [word for word in page_words(page, omit_folio)
            if word[1] < -0.75 or word[2] < -0.75 or word[3] > page.rect.width + 0.75 or word[4] > page.rect.height + 0.75]


def classify_bounds(page, document, number, original=None, omit_folio=None):
    old = collections.Counter(bound_words(original, omit_folio)) if original is not None else collections.Counter()
    inherited, introduced = [], []
    for word in bound_words(page):
        item = {"document": document, "page": number, "text": word[0], "bbox": list(word[1:])}
        if old[word]:
            inherited.append(item)
            old[word] -= 1
        else:
            introduced.append(item)
    return inherited, introduced


def source_sequence(source, target, start, stop):
    source_streams = [stream_hashes(page) for page in source]
    matches = []
    for index in range(start, stop - len(source) + 1):
        if all(contiguous(hashes, stream_hashes(target[index + offset])) and geometry(source[offset]) == geometry(target[index + offset])
               for offset, hashes in enumerate(source_streams)):
            matches.append(index)
    return matches


def decode_image(image):
    return sorted({result.text for result in zxingcpp.read_barcodes(image, formats=zxingcpp.BarcodeFormat.QRCode)})


def decode_pdf(page):
    for scale in [2.5, 3.5]:
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csRGB, alpha=False)
        values = decode_image(Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples))
        if values:
            return values, scale
    return [], 3.5


def source_qr_files(content):
    tree = LH.fromstring(content)
    return sorted({Path(urlparse(img.get("src", "")).path).name for img in tree.xpath("//img[@src]")
                   if Path(urlparse(img.get("src", "")).path).name in {"qr.png", "oncowiki-qr.png"}})


def card_dimensions(page):
    found = set()
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        width, height = rect.width * 25.4 / 72, rect.height * 25.4 / 72
        if any(abs(width - w) < 0.6 and abs(height - h) < 0.6 for w, h in [(85.6, 54), (110, 65), (171.2, 54)]):
            found.add((round(width, 2), round(height, 2)))
    return sorted(found)


def retained_html_content(original_html, document):
    tree = LH.fromstring(original_html)
    # A source paragraph may continue across a page boundary. Only the exact
    # generated folio is removed before joining those pieces; clinical text,
    # citations and existing document content remain part of the comparison.
    text = norm("".join(page.get_text().replace(f"Reference {i + 1} / {len(document)}", "") for i, page in enumerate(document)))
    excluded = {"journey-scroll-hint", "access-links", "pk-controls", "pt-toolbar", "suite-toolbar", "pk-top", "pk-help-link", "no-print"}
    checked, missing = 0, []
    for element in tree.xpath("//main//p | //main//td | //main//th | //main//li | //main//h2 | //main//h3"):
        if any(set(ancestor.get("class", "").split()) & excluded for ancestor in [element] + list(element.iterancestors())):
            continue
        value = norm(element.text_content())
        if len(value) >= 30:
            checked += 1
            if value not in text:
                missing.append(element.text_content()[:220])
    require(checked > 0, "No authored HTML paragraphs found for reference retention check")
    require(not missing, "Authored reference text missing: " + str(missing[:8]))
    return checked


def registry_state():
    program = "const r=require('./js/patient-asset-registry-v0810.js');process.stdout.write(JSON.stringify({publicOrigin:r.publicOrigin,codes:r.codes,definitions:r.definitions,bundleRoutes:[...new Set(r.codes.flatMap(c=>r.bundleRoutes(c)))]}));"
    return json.loads(subprocess.check_output(["node", "-e", program], cwd=ROOT))


def verify_route(arguments):
    route, stage_text, build, registry = arguments
    row = SCOPE["route_inventory"][route]
    stage = Path(stage_text) if stage_text else None
    result = {"route": route, "status": "failed", "errors": [], "inherited_bounds": [], "new_bounds": [], "qr_checks": [], "preservation_checks": 0}
    documents = []
    try:
        require(build is not None, "Build report has no result for " + route)
        require(row["code"] in registry["codes"], "Route's code is not registered")
        require(route in PHASES["routes"], "No resolved applicable phase-sheet mapping")
        source = ROOT / row["source_json"]
        require(HASH(source.read_bytes()) == row["source"]["sha256"], "Authored source JSON changed")
        require(HASH((ROOT / row["protocol"]["path"]).read_bytes()) == row["protocol"]["sha256"], "Clinical protocol changed")
        profile = json.loads(source.read_text())
        require(profile["code"] == row["code"], "Source JSON code does not match route")
        require(build["source_json"] == row["source_json"] and build["source_json_sha256"] == row["source"]["sha256"], "Build report does not name the pinned authored source")
        protected = 2
        for name, pair in row["files"].items():
            if name in ALLOWED_PATIENT:
                continue
            for kind in ["patient", "docs"]:
                info = pair[kind]
                if info["present"]:
                    require(HASH((ROOT / info["path"]).read_bytes()) == info["sha256"], "Protected patient asset changed: " + info["path"])
                    protected += 1
        result["protected_files_unchanged"] = protected

        def old(name):
            info = row["files"].get(name, {}).get("patient")
            if not info or not info["present"]:
                return None
            document = fitz.open(stream=baseline_bytes(info), filetype="pdf")
            documents.append(document)
            return document

        current = {}
        reported = {item["document"]: item for item in build["documents"]}
        for name in GENERATED:
            path = stage / route / name if stage else ROOT / "patient" / route / name
            require(path.is_file(), "Missing candidate document: " + str(path))
            content = path.read_bytes()
            require(HASH(content) == reported[name]["sha256"], "Candidate differs from build report: " + name)
            if not stage:
                require(content == (ROOT / "docs/patient" / route / name).read_bytes(), "Published/compatibility PDF mismatch: " + name)
            document = fitz.open(stream=content, filetype="pdf")
            documents.append(document)
            current[name] = document
            require(len(document) == reported[name]["pages"], "Reported page count mismatch: " + name)
        result["documents"] = {name: {"pages": len(doc), "sha256": reported[name]["sha256"], "mirror_verified": not bool(stage)} for name, doc in current.items()}

        originals = {name: old(name) for name in GENERATED}
        guide, reference, book = [current[name] for name in GENERATED]
        modern = row["generator_family"] == "patient-pack/pt-page"
        expected_pages = 3 if modern else 2
        require(len(guide) == expected_pages == len(originals["guide.pdf"]), "Modern/legacy guide pagination changed")
        baseline_for = {name: {} for name in GENERATED}
        guide_proofs = []
        for i, page in enumerate(guide):
            original = originals["guide.pdf"][i]
            if modern and i == 0:
                missing = words_counter(original.get_text()) - words_counter(page.get_text())
                require(not missing, "Reformatted guide page 1 lost original words: " + str(dict(missing)))
            else:
                guide_proofs.append(compare_page(original, page, "guide page " + str(i + 1), exact_streams=modern))
                baseline_for["guide.pdf"][i] = (original, None)
                result["preservation_checks"] += 1
        result["guide"] = {"family": row["generator_family"], "pages": len(guide), "original_first_page_words_retained": modern, "retained_page_proofs": guide_proofs}

        if originals["knowledge.pdf"] is not None:
            original_reference = originals["knowledge.pdf"]
            require(len(reference) == len(original_reference) + 1, "Standalone reference must add exactly one introduction to the complete original reference")
            for i, original in enumerate(original_reference):
                compare_page(original, reference[i + 1], "reference page " + str(i + 2))
                baseline_for["knowledge.pdf"][i + 1] = (original, None)
                result["preservation_checks"] += 1
            result["reference"] = {"mode": "all original PDF body pages retained", "body_pages": len(original_reference)}
        else:
            checked = retained_html_content(baseline_bytes(row["files"]["knowledge.html"]["patient"]), reference)
            result["reference"] = {"mode": "full authored HTML rendered offline", "authored_elements_checked": checked, "body_pages": len(reference) - 1}
        require(len(reference) >= 2, "Reference is missing its clinical body")

        section_definitions = json.loads((ROOT / "data/patient-document-sections-v08443.json").read_text())
        require([item["document"] for item in section_definitions] == SECTIONS, "The full handbook must contain the seven established sections in order")
        titles = [item.get("modern_title", item["title"]) if i == 0 and modern else item["title"] for i, item in enumerate(section_definitions)]
        toc = book.get_toc()
        require(len(toc) == 7 and all(item[0] == 1 for item in toc), "Handbook must have seven top-level bookmarks")
        require([item[1] for item in toc] == titles, "Handbook section titles or order differ from the shared document map")
        require(toc[0][2] == 2 and all(toc[i][2] < toc[i + 1][2] for i in range(6)), "Handbook chapter pages are not in reading order")
        require(norm(profile["title"]) in norm(book[0].get_text()), "Cover lost the exact treatment title")
        cover_text = re.sub(r"\s+", " ", book[0].get_text()).strip()
        links = book[0].get_links()
        entries = []
        for i, (level, title, page_number) in enumerate(toc):
            end = toc[i + 1][2] - 1 if i + 1 < len(toc) else len(book)
            body_start = page_number
            count = end - body_start
            require(count > 0, "Empty handbook chapter: " + title)
            require(re.search(re.escape(title) + r"\s+" + str(page_number) + r"(?:\s|$)", cover_text), "Printed cover contents page disagrees with actual chapter: " + title)
            require(norm(title) in norm(book[page_number - 1].get_text()), "Chapter-opening title mismatch: " + title)
            require(norm(str(count) + " pages of information follow") in norm(book[page_number - 1].get_text()), "Chapter-opening content-page count mismatch: " + title)
            require(any(link.get("kind") == fitz.LINK_GOTO and link.get("page") == page_number - 1 for link in links), "Cover has no working contents link to " + title)
            entries.append({"title": title, "page": page_number, "content_page": body_start + 1, "content_pages": count})
        require(entries == build["contents"], "Build report contents differ from actual PDF bookmarks/pagination")
        require(len(book) == build["handbook_pages"], "Build report handbook length differs")
        result["contents"] = entries
        for document, label in [(book, "Handbook"), (reference, "Reference")]:
            for i, page in enumerate(document):
                matching = re.findall(label + r"\s+(\d+)\s*/\s*(\d+)", page.get_text())
                require(matching == [(str(i + 1), str(len(document)))], f"{label} page {i + 1}: missing, duplicate or stale global folio")

        old_book = originals["handbook.pdf"]
        old_toc = old_book.get_toc() if old_book is not None else None
        if old_book is not None:
            require(len(old_toc) == 7, "Pinned original handbook lacks the seven source sections")
        for i, section in enumerate(SECTIONS):
            start = entries[i]["content_page"] - 1
            stop = start + entries[i]["content_pages"]
            if i == 0:
                require(stop - start == len(guide), "Handbook does not contain the entire current guide")
                for j, page in enumerate(guide):
                    compare_page(page, book[start + j], "handbook guide page " + str(j + 1))
                    # New guide page one is newly laid out; all other guide pages
                    # have independently proved unchanged baseline coordinates.
                    if j in baseline_for["guide.pdf"]:
                        baseline_for["handbook.pdf"][start + j] = baseline_for["guide.pdf"][j]
                    result["preservation_checks"] += 1
            elif old_book is not None:
                old_start = old_toc[i][2] - 1
                old_stop = old_toc[i + 1][2] - 1 if i < 6 else len(old_book)
                require(stop - start >= old_stop - old_start, "A retained handbook chapter lost pages: " + section)
                for j, old_index in enumerate(range(old_start, old_stop)):
                    folio = f"Handbook {old_index + 1} / {len(old_book)}"
                    compare_page(old_book[old_index], book[start + j], "retained handbook " + section + " page " + str(j + 1), omit_folio=folio)
                    baseline_for["handbook.pdf"][start + j] = (old_book[old_index], folio)
                    result["preservation_checks"] += 1
            elif i == 1:
                require(stop - start == len(reference) - 1, "New handbook omitted reference body pages")
                for j in range(1, len(reference)):
                    # The new reference and book use the same rendered body;
                    # each has its own appended global folio stream.
                    compare_page(reference[j], book[start + j - 1], "new handbook reference page " + str(j), omit_folio=f"Reference {j + 1} / {len(reference)}")
                    result["preservation_checks"] += 1
            else:
                original = old(section)
                require(original is not None, "Missing authored handbook source: " + section)
                require(stop - start >= len(original), "Handbook source section truncated: " + section)
                for j, page in enumerate(original):
                    compare_page(page, book[start + j], "new handbook " + section + " page " + str(j + 1))
                    baseline_for["handbook.pdf"][start + j] = (page, None)
                    result["preservation_checks"] += 1

        appendices = []
        for chapter, names in [(3, PHASES["routes"][route]["phase_pdfs"]), (4, ["port-pump.pdf"] if row["files"].get("port-pump.pdf", {}).get("patient", {}).get("present") else [])]:
            start = entries[chapter]["content_page"] - 1
            stop = start + entries[chapter]["content_pages"]
            for name in names:
                original = old(name)
                require(original is not None, "Missing applicable authored support sheet: " + name)
                matches = source_sequence(original, book, start, stop)
                require(len(matches) == 1, name + ": expected one complete unscaled PDF sequence in its handbook chapter; found " + str(len(matches)))
                for j, page in enumerate(original):
                    compare_page(page, book[matches[0] + j], name + " handbook page " + str(j + 1))
                    baseline_for["handbook.pdf"].setdefault(matches[0] + j, (page, None))
                    result["preservation_checks"] += 1
                appendices.append({"file": name, "content_page": matches[0] + 1, "pages": len(original)})
        result["applicable_support_and_access_sheets"] = appendices

        # Prove the unchanged standalone card is inserted at the same physical
        # size into the book, and (for modern guides) into the retained page 3.
        wallet = old("sactcard.pdf")
        wallet_start = entries[6]["content_page"] - 1
        require(entries[6]["content_pages"] == len(wallet), "Wallet chapter page count changed")
        for j, page in enumerate(wallet):
            compare_page(page, book[wallet_start + j], "wallet PDF inside handbook page " + str(j + 1))
        result["wallet"] = {"standalone_bytes_unchanged": True, "handbook_body_unscaled": True, "panel_dimensions_mm": card_dimensions(wallet[0]), "page_size_pt": list(rounded(wallet[0].rect)[2:]), "baseline_note": "Legacy panels retain their established dimensions; the modern 85.6 by 54 mm profile is not imposed on older 110 by 65 mm cards."}

        origin = registry["publicOrigin"]
        decoded = {}
        for name in ["qr.png", "oncowiki-qr.png"]:
            info = row["files"].get(name, {}).get("patient")
            if not info or not info["present"]:
                continue
            content = (ROOT / info["path"]).read_bytes()
            require(HASH(content) == info["sha256"], "QR PNG changed: " + name)
            values = decode_image(Image.open(io.BytesIO(content)))
            direct = urljoin(origin, "patient/" + route + ("/knowledge.html" if name == "oncowiki-qr.png" else "/"))
            valid = {direct}
            guard = urljoin(origin, "patient/" + route + "/scope.html")
            if name == "qr.png" and "/" not in route and registry["definitions"][row["code"]].get("scopeGuard") and row["files"].get("scope.html", {}).get("patient", {}).get("present"):
                valid.add(guard)
            require(len(values) == 1 and values[0] in valid, name + ": decoded destination is not this authored canonical route/explicit guard: " + str(values))
            decoded[name] = values[0]
            result["qr_checks"].append({"asset": name, "destination": values[0], "kind": "scope_guard" if values[0] == guard else "reference" if name == "oncowiki-qr.png" else "portal", "baseline_bytes_unchanged": True})
        expected_for = {}
        for html_name in ["guide.html", "sactcard.html"]:
            images = source_qr_files(baseline_bytes(row["files"][html_name]["patient"]))
            require(len(images) == 1 and images[0] in decoded, html_name + ": cannot derive one exact QR destination from the authored source image")
            expected_for[html_name] = decoded[images[0]]
        for label, page, expected in [("guide.pdf", guide[-1], expected_for["guide.html"]), ("sactcard.pdf", wallet[-1], expected_for["sactcard.html"]), ("handbook.pdf/wallet", book[wallet_start + len(wallet) - 1], expected_for["sactcard.html"])]:
            values, scale = decode_pdf(page)
            require(values == [expected], label + ": rasterized PDF QR differs from the authored image destination: " + str(values))
            result["qr_checks"].append({"asset": label, "page": page.number + 1, "destination": expected, "raster_scale": scale})

        for name, document in current.items():
            for i, page in enumerate(document):
                require(page.get_text().strip(), name + ": blank page " + str(i + 1))
                original, folio = baseline_for[name].get(i, (None, None))
                inherited, introduced = classify_bounds(page, name, i + 1, original, folio)
                result["inherited_bounds"].extend(inherited)
                result["new_bounds"].extend(introduced)
        if result["new_bounds"]:
            result["errors"].append("New or worsened text outside page bounds: " + str(len(result["new_bounds"])))
        result["status"] = "failed" if result["errors"] else "pass_with_inherited_bounds" if result["inherited_bounds"] else "pass"
    except Exception as error:
        result["errors"].append(type(error).__name__ + ": " + str(error))
    finally:
        for document in documents:
            document.close()
    return result


def check_global_preservation():
    allowed = {"assets/patient/phase-support-v0838.js", "assets/patient/patient-visual-standard-v08443.css", "data/patient-document-sections-v08443.json", "data/patient-visual-layout-v08443.json", "data/app-release.json"}
    domains = ["protocols", "data", "assets/patient", "js/patient-anatomy-v08431.js"]
    changed = subprocess.check_output(["git", "diff", "--name-only", "-z", BASE_COMMIT, "--", *domains], cwd=ROOT).decode().split("\0")
    added = subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard", "-z", "--", *domains], cwd=ROOT).decode().split("\0")
    forbidden = sorted(set(changed + added) - allowed - {""})
    require(not forbidden, "Clinical/protocol/anatomy or unapproved shared asset changes: " + str(forbidden[:20]))
    old_release = json.loads(git_bytes("data/app-release.json"))
    new_release = json.loads((ROOT / "data/app-release.json").read_text())
    public_fields = {"release", "version", "display_version", "summary", "ui_revision"}
    require({k: v for k, v in old_release.items() if k not in public_fields} == {k: v for k, v in new_release.items() if k not in public_fields}, "Non-presentation release metadata changed")
    require(new_release["release"] == new_release["version"] == "0.84.43" and new_release["display_version"] == "v0.84.43" and new_release["ui_revision"] == old_release["ui_revision"] + 1, "Unexpected public release metadata")
    selectors = 0
    for pair in SCOPE["preserved_root_selectors"].values():
        for info in pair.values():
            if info["present"]:
                require(HASH((ROOT / info["path"]).read_bytes()) == info["sha256"], "Root selection page changed: " + info["path"])
                selectors += 1
    return {"clinical_data_protocols_anatomy_unchanged": True, "root_selector_files_unchanged": selectors}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--routes", default="all", help="all or comma-separated authored routes")
    parser.add_argument("--stage", type=Path, help="Staging directory with route/guide.pdf, knowledge.pdf and handbook.pdf")
    parser.add_argument("--build-report", type=Path, default=ROOT / "validation/patient-design-v08443/document-build.json")
    parser.add_argument("--report", type=Path, default=ROOT / "validation/patient-design-v08443/document-verification.json")
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args()
    selected = SCOPE["routes"] if args.routes == "all" else args.routes.split(",")
    require(selected and len(selected) == len(set(selected)) and not set(selected) - set(SCOPE["routes"]), "Choose distinct authored routes from the pinned 228-route scope")
    require(SCOPE["baseline_commit"] == BASE_COMMIT and SCOPE["baseline_tree_sha"] == BASE_TREE, "Unexpected inventory baseline")
    actual_tree = subprocess.check_output(["git", "rev-parse", BASE_COMMIT + "^{tree}"], cwd=ROOT).decode().strip()
    require(actual_tree == BASE_TREE, "Exact baseline Git history is required")
    build = json.loads(args.build_report.read_text())
    require(build["baseline"] == BASE_COMMIT and build["release"] == "0.84.43", "Unexpected build baseline/release")
    by_route = {row["route"]: row for row in build["results"]}
    global_errors = []
    if args.routes == "all" and (set(build["requested_routes"]) != set(SCOPE["routes"]) or build["completed"] != 228 or build["errors"]):
        global_errors.append("The complete 228-route build is missing results or contains errors")
    font_checks = []
    for filename, expected in build["runtime"]["fonts"].items():
        try:
            actual = HASH(Path(filename).read_bytes())
            require(actual == expected, "Renderer font changed: " + filename)
            font_checks.append({"path": filename, "sha256": actual})
        except Exception as error:
            global_errors.append(str(error))
    try:
        preservation = check_global_preservation()
    except Exception as error:
        global_errors.append(str(error))
        preservation = {"clinical_data_protocols_anatomy_unchanged": False}
    registry = registry_state()
    tasks = [(route, str(args.stage) if args.stage else None, by_route.get(route), registry) for route in selected]
    results = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(verify_route, task): task[0] for task in tasks}
        for future in concurrent.futures.as_completed(futures):
            try:
                row = future.result()
            except Exception as error:
                row = {"route": futures[future], "status": "failed", "errors": [str(error)], "inherited_bounds": [], "new_bounds": [], "qr_checks": [], "preservation_checks": 0}
            results.append(row)
            print(row["route"], row["status"], "; ".join(row["errors"][:1]), flush=True)
    results.sort(key=lambda row: row["route"])
    failed = [row for row in results if row["errors"]]
    inherited_count = sum(len(row["inherited_bounds"]) for row in results)
    no_failures = not failed and not global_errors
    complete = len(selected) == 228 and set(selected) == set(SCOPE["routes"])
    report = {
        "schema_version": 1, "release": "0.84.43", "baseline_commit": BASE_COMMIT, "baseline_tree_sha": BASE_TREE,
        "mode": "staged_candidate" if args.stage else "published_local_copies",
        "scope": "all_228_authored_routes" if complete else "explicit_subset",
        "requested_routes": selected, "routes_checked": len(results), "failed_routes": len(failed),
        "migration_checks_passed": no_failures,
        "all_document_checks_passed": no_failures and inherited_count == 0 and complete and not args.stage,
        "status": "failed" if not no_failures else "pass_with_inherited_layout_findings" if inherited_count else "staged_pass" if args.stage else "pass",
        "global_errors": global_errors, "new_bounds_findings": sum(len(row["new_bounds"]) for row in results), "inherited_bounds_findings": inherited_count,
        "published_mirrors_verified": not bool(args.stage) and no_failures,
        "qr_checks": sum(len(row["qr_checks"]) for row in results),
        "preserved_page_checks": sum(row["preservation_checks"] for row in results),
        "global_preservation": preservation,
        "runtime": {"python": sys.version, "pymupdf": fitz.VersionBind, "zxing_cpp": importlib.metadata.version("zxing-cpp"), "pillow": importlib.metadata.version("Pillow"), "renderer_record": build["runtime"], "verified_renderer_fonts": font_checks},
        "limits": ["Text bounds are measured with an infinite extraction clip; inherited defects are reported separately and do not become a clean-layout pass.", "Staging verification cannot establish published mirror equality; rerun without --stage after publication.", "QR pixels are decoded from original PNGs and rendered PDF pages. Live HTTPS availability, phone camera scanning and physical printing remain separate checks.", "Retained original PDF streams, resources, word/image geometry and source hashes establish preservation; clinical approval and current-source review are outside this presentation audit."],
        "results": results
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({key: report[key] for key in ["status", "routes_checked", "failed_routes", "migration_checks_passed", "all_document_checks_passed", "new_bounds_findings", "inherited_bounds_findings", "qr_checks", "preserved_page_checks"]}))
    if not no_failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
