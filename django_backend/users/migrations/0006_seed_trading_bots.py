"""
users/migrations/0006_seed_trading_bots.py
Data migration to seed the 6 default AI trading robots.
"""
from django.db import migrations


BOTS = [
    {
        "slug": "ict_core_m5",
        "name": "ICT Core M5",
        "description": (
            "Precision Forex & Indices scalper using ICT methodology — "
            "detects liquidity sweeps, bullish/bearish order blocks, and "
            "fair-value gaps on the 5-minute chart."
        ),
        "asset_class": "Forex",
        "interval": "5m",
        "is_active": True,
    },
    {
        "slug": "stacking_meta",
        "name": "Stacking Meta-Learner",
        "description": (
            "Ensemble meta-model that combines Random Forest, XGBoost, and "
            "LightGBM predictions via a Ridge meta-learner for high-confidence "
            "daily equity signals."
        ),
        "asset_class": "Stocks",
        "interval": "1d",
        "is_active": True,
    },
    {
        "slug": "xgboost_dir",
        "name": "XGBoost Directional",
        "description": (
            "XGBoost classifier trained on 80+ engineered features to forecast "
            "next-day price direction with calibrated probability scores."
        ),
        "asset_class": "Stocks",
        "interval": "1d",
        "is_active": True,
    },
    {
        "slug": "rf_value",
        "name": "Random Forest Value",
        "description": (
            "Random Forest mean-reversion model that identifies oversold alpha "
            "factors using z-score analysis across multi-factor equity signals."
        ),
        "asset_class": "Stocks",
        "interval": "1d",
        "is_active": True,
    },
    {
        "slug": "lr_trend",
        "name": "Linear Regression Trend",
        "description": (
            "Statistical trend-channel model using linear regression bands. "
            "Generates high-probability bounce signals when price deviates "
            "beyond ±1.8 standard deviations."
        ),
        "asset_class": "Stocks",
        "interval": "1d",
        "is_active": True,
    },
    {
        "slug": "lightgbm_mom",
        "name": "LightGBM Momentum",
        "description": (
            "LightGBM intraday momentum breakout bot that detects volume surges "
            "relative to the 20-period SMA and enters on confirmed breakouts."
        ),
        "asset_class": "Stocks",
        "interval": "5m",
        "is_active": True,
    },
]


def seed_bots(apps, schema_editor):
    TradingBot = apps.get_model("users", "TradingBot")
    for bot_data in BOTS:
        TradingBot.objects.get_or_create(
            slug=bot_data["slug"],
            defaults={k: v for k, v in bot_data.items() if k != "slug"},
        )


def unseed_bots(apps, schema_editor):
    TradingBot = apps.get_model("users", "TradingBot")
    TradingBot.objects.filter(slug__in=[b["slug"] for b in BOTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_alter_userpaperposition_table_smartorderexecution"),
    ]

    operations = [
        migrations.RunPython(seed_bots, reverse_code=unseed_bots),
    ]
