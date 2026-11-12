
import io

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image, UnidentifiedImageError

from app.core.config import MODEL_PATH, IMAGE_SIZE


# --------------------------------------------------
# MODEL CONFIGURATION
# --------------------------------------------------

NUM_CLASSES = 44

model = None
device = torch.device("cpu")


# --------------------------------------------------
# CLASS TO BREED ID MAPPING
# --------------------------------------------------

CLASS_TO_BREED_ID = {
    0: 11, 1: 12, 2: 13, 3: 1, 4: 14, 5: 2,
    6: 15, 7: 16, 8: 17, 9: 18, 10: 19, 11: 20,
    12: 21, 13: 3, 14: 22, 15: 23, 16: 24,
    17: 25, 18: 26, 19: 27, 20: 28, 21: 29,
    22: 30, 23: 31, 24: 4, 25: 5, 26: 32,
    27: 6, 28: 7, 29: 33, 30: 34, 31: 8,
    32: 35, 33: 36, 34: 37, 35: 38, 36: 39,
    37: 40, 38: 41, 39: 9, 40: 42, 41: 10,
    42: 43, 43: 44
}


# --------------------------------------------------
# IMAGE TRANSFORM
# --------------------------------------------------

transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])


# --------------------------------------------------
# LOAD TRAINED MODEL
# --------------------------------------------------

def load_model():
    """Load the trained ResNet50 model."""

    global model

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    loaded_model = models.resnet50(weights=None)

    loaded_model.fc = nn.Linear(
        loaded_model.fc.in_features,
        NUM_CLASSES
    )

    state_dict = torch.load(
        MODEL_PATH,
        map_location=device
    )

    loaded_model.load_state_dict(state_dict)

    loaded_model.to(device)
    loaded_model.eval()

    model = loaded_model

    print("ResNet50 model loaded successfully.")

    return model


# --------------------------------------------------
# IMAGE PREDICTION
# --------------------------------------------------

def predict_image(image_bytes: bytes) -> dict:
    """Predict cattle or buffalo breed from image bytes."""

    if model is None:
        raise RuntimeError("Prediction model is not loaded.")

    try:
        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        image_tensor = transform(image).unsqueeze(0)

        with torch.inference_mode():

            outputs = model(image_tensor)

            probabilities = torch.softmax(
                outputs,
                dim=1
            )

            top5_prob, top5_indices = torch.topk(
                probabilities,
                k=5,
                dim=1
            )

            predicted_index = int(
                torch.argmax(outputs, dim=1).item()
            )

            confidence = float(
                probabilities[0][predicted_index].item()
            )

        top5_predictions = []

        for probability, index in zip(
            top5_prob[0],
            top5_indices[0]
        ):
            class_index = int(index.item())

            top5_predictions.append({
                "index": class_index,
                "breed_id": CLASS_TO_BREED_ID.get(class_index),
                "confidence": float(probability.item())
            })

        return {
            "predicted_index": predicted_index,
            "breed_id": CLASS_TO_BREED_ID.get(
                predicted_index
            ),
            "confidence": confidence,
            "top5_predictions": top5_predictions
        }

    except (UnidentifiedImageError, OSError) as error:
        raise ValueError(
            "Invalid or corrupted image file."
        ) from error
