from django.contrib import admin
from django.urls import path
from django.utils.text import capfirst

class EnterpriseAdminSite(admin.AdminSite):
    site_header = "BullLogic Enterprise Administration Console"
    site_title = "BullLogic Enterprise Admin"
    index_title = "Triple-Fusion-Engine v3.0 Master Console"
    index_template = "admin/index.html"

    def get_app_list(self, request, app_label=None):
        """
        Group models into logical enterprise business categories instead of standard Django apps.
        """
        # Build standard app list
        app_dict = self._build_app_dict(request, app_label)
        if not app_dict:
            return []

        # List of our custom business categories and their mapping
        CATEGORIES_MAP = {
            # Identity & Access
            "user": "Identity & Access",
            "group": "Identity & Access",
            "passwordresettoken": "Identity & Access",
            "twofactorauth": "Identity & Access",
            
            # Trading
            "tradingbot": "Trading",
            "userpaperaccount": "Trading",
            "userpaperorder": "Trading",
            "userpaperposition": "Trading",
            "papertrade": "Trading",
            "papertradeevent": "Trading",
            "paperequitysnapshot": "Trading",
            "userbotsubscription": "Trading",
            
            # Portfolio Management
            "portfolio": "Portfolio Management",
            "holding": "Portfolio Management",
            "transaction": "Portfolio Management",
            "userportfolio": "Portfolio Management",
            "portfolioposition": "Portfolio Management",
            "userinvestmentportfolios": "Portfolio Management",
            
            # Market Intelligence
            "pythfeed": "Market Intelligence",
            "tickerconfig": "Market Intelligence",
            "resourcelink": "Market Intelligence",
            "watchlists": "Market Intelligence",
            "watchlist": "Market Intelligence",
            "watchlistitem": "Market Intelligence",
            "userwatchlists": "Market Intelligence",
            "pricealert": "Market Intelligence",
            
            # Machine Learning
            "modelversion": "Machine Learning",
            "predictionhistory": "Machine Learning",
            "predictionaccuracy": "Machine Learning",
            "competitionmodel": "Machine Learning",
            "competitionentry": "Machine Learning",
            "predictionaccuracyrecords": "Machine Learning",
            "predictionhistories": "Machine Learning",
            
            # Research Workspace
            "experiments": "Research Workspace",
            "datasets": "Research Workspace",
            
            # Execution Engine
            "smartorderexecution": "Execution Engine",
            
            # Notifications
            "notification": "Notifications",
            "broadcast": "Notifications",
            "telegramconfig": "Notifications",
            "whatsappconfig": "Notifications",
            "discordconfig": "Notifications",
            "userwebhook": "Notifications",
            
            # Billing & Subscriptions
            "payment": "Billing & Subscriptions",
            "giftcode": "Billing & Subscriptions",
            
            # System Configuration
            "appsetting": "System Configuration",
            
            # Developer Tools
            "apikey": "Developer Tools",
            
            # Audit & Compliance
            "activitylog": "Audit & Compliance",
            "adminauditlog": "Audit & Compliance",
            "errorlog": "Audit & Compliance",
            "logs": "Audit & Compliance",
        }

        # Gather all models from all standard apps
        all_models = []
        for app in app_dict.values():
            all_models.extend(app.get("models", []))

        # Sort/group models into our custom categories
        categories = {}
        for model in all_models:
            model_name = model.get("object_name", "").lower()
            category_name = CATEGORIES_MAP.get(model_name, "Other / Auxiliary")
            
            if category_name not in categories:
                categories[category_name] = {
                    "name": category_name,
                    "app_label": category_name.lower().replace(" & ", "_").replace(" ", "_"),
                    "app_url": f"/admin/category/{category_name.lower().replace(' & ', '_').replace(' ', '_')}/",
                    "models": [],
                    "has_module_perms": True,
                }
            categories[category_name]["models"].append(model)

        # Ensure model sorting within each category
        for cat in categories.values():
            cat["models"].sort(key=lambda x: x["name"])

        # Convert to a sorted list of categories
        category_order = [
            "Identity & Access",
            "Trading",
            "Portfolio Management",
            "Market Intelligence",
            "Machine Learning",
            "Research Workspace",
            "Execution Engine",
            "Notifications",
            "Billing & Subscriptions",
            "System Configuration",
            "Developer Tools",
            "Audit & Compliance",
            "Other / Auxiliary"
        ]
        
        sorted_app_list = []
        for name in category_order:
            if name in categories:
                sorted_app_list.append(categories[name])
                
        # Append any remaining categories not explicitly ordered
        for name, cat in categories.items():
            if name not in category_order:
                sorted_app_list.append(cat)
                
        return sorted_app_list

# Global instance of our custom enterprise admin site
enterprise_admin_site = EnterpriseAdminSite()
