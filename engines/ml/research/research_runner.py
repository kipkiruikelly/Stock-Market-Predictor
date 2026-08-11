from engines.ml.research.research_config import ResearchConfig
from engines.ml.research.experiment import ResearchExperiment
from engines.ml.research.statistics import StatisticalValidator

class ResearchRunner:
    def __init__(self):
        self.experiments = {}

    def evaluate_challenger_vs_champion(self, champion_report: dict, challenger_report: dict, champ_returns, chall_returns) -> dict:
        t_res = StatisticalValidator.t_test_comparison(champ_returns, chall_returns)
        
        champ_prec = champion_report["predictive_metrics"]["precision"]
        chall_prec = challenger_report["predictive_metrics"]["precision"]
        
        champ_sharpe = champion_report["trading_metrics"]["sharpe"]
        chall_sharpe = challenger_report["trading_metrics"]["sharpe"]
        
        promote = (
            chall_prec > champ_prec and
            chall_sharpe >= champ_sharpe and
            t_res["significant"]
        )
        
        return {
            "champion_id": champion_report["config"]["experiment_id"],
            "challenger_id": challenger_report["config"]["experiment_id"],
            "champion_sharpe": champ_sharpe,
            "challenger_sharpe": chall_sharpe,
            "statistically_significant": t_res["significant"],
            "p_value": t_res["p_value"],
            "decision": "PROMOTE_CHALLENGER" if promote else "KEEP_CHAMPION"
        }
