
from ultralytics import YOLO
from PIL import Image, UnidentifiedImageError
import io

# COCO-pretrained YOLO model
detector = None

# COCO class ID for cow
COW_CLASS_ID = 19

# Minimum object detection confidence
DETECTION_THRESHOLD = 0.35


def load_detector():
    """Load the pretrained YOLO detector."""
    global detector

    detector = YOLO("yolo11n.pt")

    print("YOLO animal detector loaded successfully.")

    return detector


def validate_animal(image_bytes: bytes) -> dict:
    """
    Validate whether an image contains a detectable cow.

    Note:
    Standard COCO weights do not have a dedicated buffalo class.
    """

    if detector is None:
        raise RuntimeError("Animal detector is not loaded.")

    try:
        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("Invalid or corrupted image file.") from error

    results = detector.predict(
        source=image,
        conf=DETECTION_THRESHOLD,
        verbose=False
    )

    detected_cow = False

    for result in results:
        if result.boxes is None:
            continue

        for box in result.boxes:
            class_id = int(box.cls.item())

            if class_id == COW_CLASS_ID:
                detected_cow = True
                break

    return {
        "valid": detected_cow,
        "message": (
            "Cattle detected."
            if detected_cow
            else "No cattle detected. Please upload a clear cattle image."
        )
    }
