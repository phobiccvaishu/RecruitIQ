import os
import logging

# Configure logger
logger = logging.getLogger("document_parser")

# Try to import PDF and Word parsing packages
try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None
    logger.warning("PyMuPDF (fitz) is not installed. PDF extraction will be disabled.")

try:
    import docx
except ImportError:
    docx = None
    logger.warning("python-docx is not installed. DOCX extraction will be disabled.")

# EasyOCR for scanned document fallback
try:
    import easyocr
except ImportError:
    easyocr = None
    logger.warning("EasyOCR is not installed. OCR fallback will be disabled.")

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from PDF files using PyMuPDF. 
    Falls back to OCR if the extracted text is empty (scanned PDF).
    """
    if not fitz:
        raise ImportError("PyMuPDF is not installed. Cannot parse PDF.")
        
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        logger.error(f"Error parsing PDF with PyMuPDF: {e}")
        raise ValueError(f"Could not parse PDF file: {e}")
        
    # If the text is very short/empty, it might be a scanned PDF
    if len(text.strip()) < 50:
        logger.info("PDF contains very little text. Attempting OCR fallback...")
        ocr_text = run_ocr_on_pdf(file_path)
        if ocr_text:
            text = ocr_text
            
    return text

def extract_text_from_docx(file_path: str) -> str:
    """
    Extracts text from DOCX files using python-docx.
    """
    if not docx:
        raise ImportError("python-docx is not installed. Cannot parse DOCX.")
        
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        logger.error(f"Error parsing DOCX: {e}")
        raise ValueError(f"Could not parse DOCX file: {e}")

def run_ocr_on_pdf(file_path: str) -> str:
    """
    Runs OCR on scanned documents using EasyOCR as a fallback.
    """
    if not easyocr:
        logger.warning("OCR fallback requested, but EasyOCR is not installed.")
        return ""
        
    try:
        # Initialise reader for English
        reader = easyocr.Reader(['en'])
        
        # Open PDF and convert first page/few pages to image bytes for OCR
        doc = fitz.open(file_path)
        ocr_texts = []
        
        # Limit to first 3 pages to prevent long load times during demo
        for page_num in range(min(len(doc), 3)):
            page = doc[page_num]
            pix = page.get_pixmap()
            image_bytes = pix.tobytes("png")
            
            # Read text from image bytes
            results = reader.readtext(image_bytes)
            page_text = " ".join([res[1] for res in results])
            ocr_texts.append(page_text)
            
        doc.close()
        return "\n".join(ocr_texts)
    except Exception as e:
        logger.error(f"Error during EasyOCR processing: {e}")
        return ""

def parse_document(file_path: str) -> str:
    """
    Determines file extension and extracts text.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
