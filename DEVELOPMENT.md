# Triple Fusion Engine (BullLogic v2.0) — Developer Handbook

Welcome to the **Developer & Technical Architecture Guide** for the Triple Fusion Engine (BullLogic v2.0). This document provides developers, quantitative engineers, and system architects with a complete technical reference for setup, codebase navigation, core subsystem design, MLOps workflows, testing, and deployment procedures.

---

## 🛠️ 1. Development Environment & Toolchain Setup

### System Prerequisites
* **Operating System**: Windows 10/11, macOS 12+, or Ubuntu 22.04 LTS
* **Python**: Python 3.11+ (recommended: 3.11.x)
* **Node.js**: Node.js 18.x or 20.x LTS & npm 9+
* **Redis**: Redis 6.2+ (for caching and Celery message broker)
* **Git**: Git 2.40+

### Local Environment Initialization

#### Step 1: Clone Repository & Virtual Environment
```bash
git clone https://github.com/kipkiruikelly/Triple-Fusion-Engine.git
cd Triple-Fusion-Engine

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate
```

#### Step 2: Install Dependencies
```bash
# Python Dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Frontend Dependencies
cd frontend
npm install
cd ..
```

#### Step 3: Environment Variables Configuration
Copy the `.env.example` file to `.env` in the project root:
```bash
cp .env.example .env
```
Key development variables in `.env`:
```ini
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=*
DATABASE_URL=sqlite:///instance/bulllogic_django.db
REDIS_URL=redis://127.0.0.1:6379/0
ENABLE_LIVE_TRADING=false
```

#### Step 4: Run Database Migrations
```bash
python django_backend/manage.py migrate
```

#### Step 5: Start Local Development Servers
To run the full stack locally, launch the following processes:

```bash
# Terminal 1: Django Backend (Port 8001)
python django_backend/manage.py runserver 8001

# Terminal 2: FastAPI Microservice (Port 8002)
uvicorn fastapi_service.main:app --port 8002 --reload

# Terminal 3: React Frontend (Port 5173 / 5000)
cd frontend
npm run dev
```

---

## 📁 2. Codebase Structure & Directory Map

```
Stock-Market-Predictor/
├── django_backend/              # Django 4.2 REST Framework Core Backend
│   ├── bulllogic/               # Project Settings, URLs, WSGI, Celery config
│   │   ├── settings.py          # Database, Whitenoise, CORS, JWT settings
│   │   ├── urls.py              # Central routing & Google verification
│   │   └── wsgi.py              # WSGI application entrypoint
│   ├── users/                   # Users App (Auth, JWT, OAuth, User Model)
│   │   ├── models.py            # User, UploadedDataset, DatasetProperty models
│   │   ├── views.py             # Login, Register, Profile APIs
│   │   └── hashers.py           # PBKDF2 & Werkzeug password hashing backward compatibility
│   └── trading/                 # Trading App (MLOps, Execution, Recommender)
│       ├── models.py            # SmartOrderExecution, ModelVersion, ModelEvaluation
│       ├── bot_runner.py        # 6 AI Trading Robots strategy engines & backtests
│       ├── execution_engine.py  # Smart TWAP/VWAP Router & Adaptive FSM
│       ├── execution_views.py   # Order placement & execution quality APIs
│       ├── mlops_service.py     # Out-of-sample metrics evaluation logger
│       └── recommender_views.py # Personalized trade setup & hedging API
├── fastapi_service/             # FastAPI High-Speed Microservice (Port 8002)
│   ├── main.py                  # FastAPI app entrypoint
│   ├── routers/                 # Inference & WebSocket endpoints
│   └── schemas.py               # Pydantic request/response validation
├── frontend/                    # React 18 + Vite Frontend App
│   ├── public/                  # Static assets & Google verification files
│   └── src/                     # React Components & Pages
│       ├── pages/               # Dashboard, Login, Bots, MLOps UI pages
│       ├── components/          # Sidebar, Navbars, Charting widgets
│       └── App.tsx              # React Router v6 routing setup
├── ml_framework/                # Core Quantitative & ML Framework
│   ├── trainers/                # TimeSeriesSplit, XGBoost, RF, LightGBM trainers
│   ├── features/                # Technical Analysis & ICT Order Block indicators
│   └── recommender/             # Cosine similarity & SVD collaborative filtering
├── market_data.py               # yFinance connector & Pyth Oracle failover
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Base Docker Compose setup
├── docker-compose.prod.yml      # Production Docker overlay configuration
└── requirements.txt             # Locked Python packages
```

---

## ⚙️ 3. Core Architectural Subsystems

### 3.1 Authentication & Security Architecture
* **JWT Access / Refresh Tokens**:
  - `POST /api/login`: Generates 24-hour signed Access Tokens and 7-day Refresh Tokens.
  - Active refresh tokens are registered in Redis (`REDIS_URL`) for instant revocation upon logout (`POST /api/logout`).
* **Brute-Force Lockout Guard**:
  - Automatically tracks consecutive failed password attempts. Upon reaching **5 failed attempts**, sets a 15-minute account lockout timer (`lockout_until = Now + 15m`).
* **Google OAuth 2.0 Integration**:
  - `POST /auth/google`: Handles 1-click Google OAuth verification and creates or links existing accounts seamlessly.

---

### 3.2 Machine Learning & MLOps Subsystem

```
Raw Price Data ──► Feature Engineering ──► TimeSeriesSplit (5-fold) ──► Ensembles (RF/XGB/LGBM)
                         │                                                       │
                         ▼                                                       ▼
               ICT Order Blocks + FVGs                                 Model Metrics Registry
               (Bull/Bear OBs & Gaps)                                  (MAE, MSE, RMSE, R², % Acc)
```

#### Feature Matrix
The feature extraction engine calculates a composite feature vector:
1. **ICT Market Structure**: Bullish/Bearish Order Blocks (`Bull_OB_Count`, `Bear_OB_Count`), Fair Value Gaps (`FVG_Distance`), Premium/Discount Position (`PD_Position`).
2. **Technical Analysis**: ATR, RSI, MACD, Bollinger Bands, Moving Average Envelopes.
3. **Volatility & Price Action**: Lagged log returns, ATR-derived Risk Units.

#### MLOps Evaluation Metrics
Models in the registry (`ModelVersion` & `ModelEvaluation`) are evaluated on out-of-sample test splits:
* **Mean Absolute Error (MAE)**: $\frac{1}{n} \sum |y_i - \hat{y}_i|$
* **Root Mean Squared Error (RMSE)**: $\sqrt{\frac{1}{n} \sum (y_i - \hat{y}_i)^2}$
* **$R^2$ Score**: Proportion of variance explained by the ensemble.
* **Directional Accuracy %**: Percentage of correct sign predictions ($sgn(\Delta y) == sgn(\Delta \hat{y})$).

---

### 3.3 Institutional Smart Order Execution Engine (JPMorgan DNA Architecture)

The execution router splits parent orders into child slices using Time-Weighted Average Price (**TWAP**) or Volume-Weighted Average Price (**VWAP**) algorithms:

#### Adaptive Execution Finite State Machine (FSM)
$$\text{PASSIVE\_LIMIT (Order Block Limit)} \xrightarrow{\text{80\% Window Elapsed AND Fill < 50\%}} \text{AGGRESSIVE\_TAKER (Market Sweep)}$$

```python
# Execution FSM Mode Decision Matrix
if fill_percentage < 0.50 and elapsed_ratio > 0.80:
    execution_mode = "AGGRESSIVE_TAKER"  # Sweep liquidity at market
else:
    execution_mode = "PASSIVE_LIMIT"     # Place limit order at Order Block
```

---

### 3.4 Personalized Quantitative Recommender Engine

Surfaces top trade setups using a hybrid engine:
1. **Content-Based Cosine Similarity**: Matches asset technical vectors to the trader's historical style profile:
   $$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$
2. **Collaborative Filtering SVD**: Uses Matrix Factorization over platform trader preferences.
3. **Portfolio Risk-Hedging**: Analyzes open positions and recommends inversely correlated instruments (`GOLD`, `TLT`, `EURUSD`) to balance market risk.

---

## 🗄️ 4. Database Schema & ORM Management

### Key Models (`users/models.py` & `django_backend/trading/models.py`)

* **`User`**: Custom user model inheriting from `AbstractBaseUser` + `PermissionsMixin`. Stores credentials, XP, level, failed attempt counts, lockout expiry, and role privileges.
* **`ModelVersion`**: Registry of trained machine learning model artifacts per ticker and algorithm version.
* **`ModelEvaluation`**: Metrics table storing MAE, MSE, RMSE, $R^2$ Score, and Directional Accuracy.
* **`SmartOrderExecution`**: Audit log of parent orders, child slice counts, benchmark arrival prices, average fill prices, and dollar slippage saved ($).
* **`UserBotSubscription`**: Configuration table storing auto-trade toggles (`paper` / `mt5`), risk percentages, and active strategy subscriptions.

### Working with Django Migrations
When adding or altering fields in ORM models:
```bash
# 1. Create migration file
python django_backend/manage.py makemigrations

# 2. Apply migration to SQLite/PostgreSQL
python django_backend/manage.py migrate
```

---

## 🧪 5. Testing & Quality Assurance

### Running Backend API Test Suite
```bash
# Run Django backend test suite
.venv/Scripts/python.exe django_backend/manage.py test users trading

# Run standalone test script
.venv/Scripts/python.exe run_tests.py
```

### Running Frontend Build Validation
Before submitting pull requests or deploying, verify TypeScript compilation and Vite bundling:
```bash
cd frontend
npm run build
```

---

## 🐳 6. Production Containerization & Cloud Deployment

### Building & Running with Docker
```bash
# Build and run with Docker Compose
docker compose up -d --build

# Verify container health
docker compose ps
```

### Cloud Run Deployment
The project includes a production multi-stage `Dockerfile` configured for Google Cloud Run:
* **Stage 1**: Builds React frontend static assets (`npm run build`).
* **Stage 2**: Installs Python virtual environment and system dependencies.
* **Stage 3**: Minimal Debian Bookworm runtime with non-root security user (`app`), pre-created `/app/instance` SQLite directory permissions, Whitenoise static file serving, and Gunicorn entrypoint on `0.0.0.0:${PORT}`.

To deploy manually to Google Cloud Run:
```bash
gcloud run deploy triple-fusion-engine \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

---

## 🤝 7. Contribution Guidelines & Code Standards

1. **Branching Strategy**: Use feature branches (`feature/add-strategy`, `fix/execution-fsm`).
2. **Git Commit Conventions**:
   - `feat(...)`: New feature or endpoint.
   - `fix(...)`: Bug fix or patch.
   - `docs(...)`: Documentation updates.
   - `refactor(...)`: Code restructuring without functional changes.
3. **Safety Directive**: Always preserve the hard safety control `ENABLE_LIVE_TRADING=false` unless explicitly approved for broker integration.
