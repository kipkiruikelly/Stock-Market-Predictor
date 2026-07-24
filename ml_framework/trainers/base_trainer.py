from ml_framework.base import BaseModelTrainer
from ml_framework.trainers.sklearn_trainer import SklearnModelTrainer
from ml_framework.trainers.boosting_trainer import BoostingModelTrainer
from ml_framework.trainers.advanced_trainer import AdvancedModelTrainer

# Registry mapping
MODEL_TRAINERS = {
    "sklearn": SklearnModelTrainer,
    "boosting": BoostingModelTrainer,
    "advanced": AdvancedModelTrainer,
}
