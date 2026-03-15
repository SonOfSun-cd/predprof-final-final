import io
import os
import traceback

import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Dense as KerasDense

import auth
import models

router = APIRouter(prefix="/api/predict", tags=["Prediction"])
MODEL_PATH = os.getenv("MODEL_PATH", "data/my_model.h5")


class DenseWithQuantizationConfig(KerasDense):
    def __init__(self, *args, quantization_config=None, **kwargs):
        self.quantization_config = quantization_config
        super().__init__(*args, **kwargs)

    def get_config(self):
        config = super().get_config()
        config["quantization_config"] = self.quantization_config
        return config


def decode_hashed_labels(values):
    values = np.asarray(values)

    if values.size == 0:
        return np.array([], dtype=int)

    # если данные уже numeric
    if np.issubdtype(values.dtype, np.integer) or np.issubdtype(values.dtype, np.floating):
        return values.astype(int)

    # Приводим bytes->str, если нужно
    if values.dtype.kind == "S" or values.dtype.kind == "U":
        values = values.astype(str)
    else:
        values = np.asarray([str(v) for v in values], dtype=str)

    # из обучающего скрипта: метки по suffix
    suffixes = np.array([v[32:] if len(v) >= 32 else v for v in values], dtype=str)
    unique_suffixes = np.sort(np.unique(suffixes))
    suffix_to_index = {s: i for i, s in enumerate(unique_suffixes)}

    return np.array([suffix_to_index[s] for s in suffixes], dtype=int)


def extract_labels(values):
    values = np.asarray(values)

    if values.ndim == 0:
        return np.array([int(values)])

    if values.ndim == 1:
        if np.issubdtype(values.dtype, np.integer) or np.issubdtype(values.dtype, np.floating):
            return values.astype(int)
        return decode_hashed_labels(values)

    # one-hot или распределения
    return np.argmax(values, axis=1).astype(int)


def resolve_class_name(index, class_names):
    if class_names and 0 <= index < len(class_names):
        return class_names[index]
    return str(index)


def count_classes(labels, class_names=None):
    unique_values, counts = np.unique(labels, return_counts=True)
    result = []

    for class_index, count in zip(unique_values.tolist(), counts.tolist()):
        result.append(
            {
                "class_index": class_index,
                "class_name": resolve_class_name(class_index, class_names),
                "count": count,
            }
        )

    return result


@router.post("/predict")
async def predict(
    dataset: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not dataset.filename or not dataset.filename.endswith(".npz"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ожидается файл в формате .npz",
        )

    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Файл модели не найден: {MODEL_PATH}",
        )

    try:
        file_bytes = await dataset.read()
        npz_data = np.load(io.BytesIO(file_bytes), allow_pickle=False)
    except Exception as error:
        print("Ошибка чтения .npz:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось прочитать .npz файл: {str(error)}",
        )

    # заменяем строгую проверку на test_x/test_y таким образом:
    if "test_x" in npz_data and "test_y" in npz_data:
        test_x = npz_data["test_x"]
        test_y = npz_data["test_y"]
    elif "valid_x" in npz_data and "valid_y" in npz_data:
        test_x = npz_data["valid_x"]
        test_y = npz_data["valid_y"]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="В .npz файле должны быть ключи test_x/test_y или valid_x/valid_y",
        )

    train_y = npz_data["train_y"] if "train_y" in npz_data else None
    class_names = [str(item) for item in npz_data["class_names"].tolist()] if "class_names" in npz_data else None

    try:
        model = load_model(
            MODEL_PATH,
            compile=False,
            custom_objects={"Dense": DenseWithQuantizationConfig},
        )
    except Exception as error:
        print("Ошибка загрузки модели:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось загрузить модель: {str(error)}",
        )

    try:
        predictions = model.predict(test_x)
    except Exception as error:
        print("Ошибка предсказания model.predict(test_x):")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка во время предсказания: {str(error)}",
        )

    try:
        predicted_labels = np.argmax(predictions, axis=1).astype(int)
        true_labels = extract_labels(test_y)
        if len(predicted_labels) != len(true_labels):
            raise ValueError(f"Несовпадение длины: predictions={len(predicted_labels)}, true={len(true_labels)}")
        confidences = np.max(predictions, axis=1)

        per_record_accuracy = []

        for index, true_label in enumerate(true_labels.tolist()):
            predicted_label = int(predicted_labels[index])
            confidence = float(confidences[index])

            per_record_accuracy.append(
                {
                    "record_index": index,
                    "true_class_index": int(true_label),
                    "true_class_name": resolve_class_name(int(true_label), class_names),
                    "predicted_class_index": predicted_label,
                    "predicted_class_name": resolve_class_name(predicted_label, class_names),
                    "confidence": confidence,
                    "is_correct": predicted_label == int(true_label),
                }
            )

        validation_class_counts = count_classes(true_labels, class_names)
        validation_top_5_classes = sorted(
            validation_class_counts,
            key=lambda item: item["count"],
            reverse=True,
        )[:5]

        train_class_counts = None
        if train_y is not None:
            train_labels = extract_labels(train_y)
            train_class_counts = count_classes(train_labels, class_names)

    except Exception as error:
        print("Ошибка обработки результатов модели:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обработки предсказаний: {str(error)}",
        )

    try:
        return {
            "message": "Файл обработан успешно",
            "filename": dataset.filename,
            "test_x_shape": list(test_x.shape),
            "test_y_shape": list(test_y.shape),
            "predictions_shape": list(predictions.shape),
            "predictions": predictions.tolist(),
            "test_y": test_y.tolist(),
            "class_names": class_names,
            "graph_data": {
                "train_class_counts": train_class_counts,
                "validation_class_counts": validation_class_counts,
                "validation_top_5_classes": validation_top_5_classes,
                "per_record_accuracy": per_record_accuracy,
            },
            "current_user": current_user.login,
        }
    except Exception as error:
        print("Ошибка формирования ответа:")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка формирования JSON-ответа: {str(error)}",
        )
