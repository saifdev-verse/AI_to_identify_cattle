
from pathlib import Path
from app.services.animal_validation import (
    load_detector,
    validate_animal
)

# Replace these paths with your actual image paths.
TEST_IMAGES = {
    "Cattle": "test_images/cattle.jpg",
    "Buffalo": "test_images/buffalo.jpg",
    "Unrelated": "test_images/car.jpeg",
}


def main():
    load_detector()

    for label, image_path in TEST_IMAGES.items():
        path = Path(image_path)

        print(f"\nTesting: {label}")

        if not path.exists():
            print(f"Image not found: {path}")
            continue

        result = validate_animal(path.read_bytes())

        print("Valid:", result["valid"])
        print("Message:", result["message"])


if __name__ == "__main__":
    main()
