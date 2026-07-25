"""
users/migrations/0007_update_bots_universal.py
Update all 6 AI robots to support every timeframe and asset class.
"""
from django.db import migrations


def make_universal(apps, schema_editor):
    TradingBot = apps.get_model("users", "TradingBot")
    TradingBot.objects.update(interval="multi", asset_class="All Markets")


def revert_universal(apps, schema_editor):
    TradingBot = apps.get_model("users", "TradingBot")
    defaults = {
        "ict_core_m5":   {"interval": "5m",  "asset_class": "Forex"},
        "stacking_meta": {"interval": "1d",  "asset_class": "Stocks"},
        "xgboost_dir":   {"interval": "1d",  "asset_class": "Stocks"},
        "rf_value":      {"interval": "1d",  "asset_class": "Stocks"},
        "lr_trend":      {"interval": "1d",  "asset_class": "Stocks"},
        "lightgbm_mom":  {"interval": "5m",  "asset_class": "Stocks"},
    }
    for slug, vals in defaults.items():
        TradingBot.objects.filter(slug=slug).update(**vals)


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_seed_trading_bots"),
    ]

    operations = [
        migrations.RunPython(make_universal, reverse_code=revert_universal),
    ]
