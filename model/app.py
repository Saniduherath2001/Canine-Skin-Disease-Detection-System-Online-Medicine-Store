import io
import os
# pyrefly: ignore [missing-import]
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
# pyrefly: ignore [missing-import]
from tensorflow.keras.preprocessing import image
# pyrefly: ignore [missing-import]
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_CANDIDATES = [
    os.path.join(BASE_DIR, "final_model.keras"),
    
]

MODEL_PATH = next((path for path in MODEL_CANDIDATES if os.path.exists(path)), None)
if MODEL_PATH is None:
    raise FileNotFoundError("No trained model file found in model directory")

model = load_model(MODEL_PATH, compile=False)

# Must match the exact order from train_gen.class_indices during training
CLASS_LABELS = ["Dermatitis", "Healthy", "demodicosis", "others", "ringworm"]

print(f"Loaded model: {os.path.basename(MODEL_PATH)}")
print(f"Classes: {CLASS_LABELS}")

QUESTIONS_DB = {
    "Dermatitis": [
        {"en": "Is there visible redness?"},
        {"en": "Is the area itchy?"},
        {"en": "Is there swelling?"},
        {"en": "Are there bumps or rashes?"},
        {"en": "Is the skin dry or flaky?"},
    ],
    "demodicosis": [
        {"en": "Are there bald spots around the eyes?"},
        {"en": "Is the skin red and inflamed?"},
        {"en": "Are there sores or scabs?"},
        {"en": "Is the skin oozing fluid?"},
        {"en": "Is the hair thinning overall?"},
    ],
    "ringworm": [
        {"en": "Are there circular hair loss patches?"},
        {"en": "Is the center of the patch scaly?"},
        {"en": "Is the skin red around the edges?"},
        {"en": "Is it spreading to other areas?"},
        {"en": "Are there broken hairs?"},
    ],
}


def prepare_image(file_bytes):
    img = image.load_img(io.BytesIO(file_bytes), target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = tf.keras.applications.resnet50.preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array.astype(np.float32)


def pick_best_prediction(sorted_results):
    """Prefer actual disease labels over 'others' when a disease is reasonably confident."""
    if not sorted_results:
        return None

    top = sorted_results[0]
    if top["disease"] != "others":
        return top

    for result in sorted_results:
        if result["disease"] != "others" and result["confidence"] >= 0.15:
            return result

    return top


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        img_array = prepare_image(file.read())
        preds = model.predict(img_array, verbose=0)[0]

        results = [
            {"disease": CLASS_LABELS[i], "confidence": float(conf)}
            for i, conf in enumerate(preds)
        ]

        sorted_results = sorted(results, key=lambda x: x["confidence"], reverse=True)
        disease_candidates = [r for r in sorted_results if r["disease"] not in ("others", "Healthy")]

        print("Predictions:", [(r["disease"], round(r["confidence"], 3)) for r in sorted_results[:3]])

        return jsonify({
            "sorted_predictions": sorted_results,
            "disease_candidates": disease_candidates,
            "best_prediction": pick_best_prediction(sorted_results),
        })

    except Exception as e:
        print("Prediction Error:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/get_questions", methods=["POST"])
def get_questions():
    data = request.get_json(silent=True) or {}
    disease = data.get("disease")
    questions = QUESTIONS_DB.get(disease, [])
    return jsonify({"questions": questions})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": os.path.basename(MODEL_PATH),
        "classes": CLASS_LABELS,
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)