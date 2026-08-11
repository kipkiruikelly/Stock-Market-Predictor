import logging

logger = logging.getLogger(__name__)

class ShadowModeWorker:
    def __init__(self, champion_model, candidate_model):
        self.champion_model = champion_model
        self.candidate_model = candidate_model
        
    def process(self, features):
        champion_pred = self.champion_model.predict(features)
        candidate_pred = self.candidate_model.predict(features)
        
        # Log candidate predictions without executing trades
        self._log_predictions(features, champion_pred, candidate_pred)
        
        # Return champion prediction for execution
        return champion_pred
        
    def _log_predictions(self, features, champion_pred, candidate_pred):
        # Log to monitoring system
        logger.info(
            f"Shadow Mode - Champion Pred: {champion_pred}, "
            f"Candidate Pred: {candidate_pred}, "
            f"Features hash: {hash(str(features))}"
        )
