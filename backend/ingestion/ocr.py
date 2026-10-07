import os
import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Lazy global OCR engine cache
_PADDLE_ENGINE = None
_EASYOCR_READER = None

def get_paddle_ocr():
    global _PADDLE_ENGINE
    if _PADDLE_ENGINE is None:
        try:
            from paddleocr import PaddleOCR
            _PADDLE_ENGINE = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            logger.info("PaddleOCR engine initialized successfully.")
        except Exception as e:
            logger.warning(f"PaddleOCR is not available: {e}")
            _PADDLE_ENGINE = False
    return _PADDLE_ENGINE if _PADDLE_ENGINE is not False else None

def get_easy_ocr():
    global _EASYOCR_READER
    if _EASYOCR_READER is None:
        try:
            import easyocr
            _EASYOCR_READER = easyocr.Reader(['en'], gpu=False)
            logger.info("EasyOCR engine initialized successfully.")
        except Exception as e:
            logger.warning(f"EasyOCR is not available: {e}")
            _EASYOCR_READER = False
    return _EASYOCR_READER if _EASYOCR_READER is not False else None

def perform_ocr_on_image(image_path: str) -> str:
    """
    Performs OCR on a page image.
    Uses PaddleOCR if available -> EasyOCR fallback -> PyTesseract fallback -> graceful fallback.
    Never crashes document ingestion.
    """
    if not os.path.exists(image_path):
        logger.error(f"Image path does not exist for OCR: {image_path}")
        return ""

    # 1. Try PaddleOCR
    paddle = get_paddle_ocr()
    if paddle:
        try:
            results = paddle.ocr(image_path, cls=True)
            text_lines = []
            if results and results[0]:
                for line in results[0]:
                    if line and len(line) >= 2 and line[1]:
                        text_lines.append(line[1][0])
            ocr_text = "\n".join(text_lines).strip()
            if ocr_text:
                logger.info(f"PaddleOCR successfully extracted {len(ocr_text)} characters.")
                return ocr_text
        except Exception as e:
            logger.warning(f"PaddleOCR execution failed: {e}. Falling back to secondary engine.")

    # 2. Try EasyOCR
    easy = get_easy_ocr()
    if easy:
        try:
            results = easy.readtext(image_path, detail=0)
            ocr_text = "\n".join(results).strip()
            if ocr_text:
                logger.info(f"EasyOCR successfully extracted {len(ocr_text)} characters.")
                return ocr_text
        except Exception as e:
            logger.warning(f"EasyOCR execution failed: {e}. Falling back to PyTesseract.")

    # 3. Try PyTesseract
    try:
        import pytesseract
        img = Image.open(image_path)
        ocr_text = pytesseract.image_to_string(img).strip()
        if ocr_text:
            logger.info(f"PyTesseract successfully extracted {len(ocr_text)} characters.")
            return ocr_text
    except Exception as e:
        logger.debug(f"PyTesseract not available or failed: {e}")

    # 4. Graceful fallback if no engine is installed/working
    logger.warning(f"No active OCR engine available to read {image_path}. Returning fallback OCR status.")
    return "[OCR Engine pending: Page image preserved for downstream VLM visual processing]"
