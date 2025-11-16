# TrafficRoutine

An AI-powered public transit route optimization system for Zambia's bus network. This application provides real-time traffic predictions, route planning, congestion monitoring, and system-wide performance analytics to improve public transportation efficiency.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Train Models via Convex Dashboard](#train-models-via-convex-dashboard)
- [System Metrics & Calculations](#system-metrics--calculations)
- [System Assumptions](#system-assumptions)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## Project Overview

TrafficRoutine is a React Native application built with Expo that helps optimize public transit routes in Zambia. The system uses AI-powered predictions to:

- **Predict traffic congestion** based on natural patterns and time-of-day
- **Optimize route planning** to reduce travel time and distance
- **Monitor system-wide performance** through comprehensive dashboards
- **Provide real-time metrics** including demand forecasting, ETA calculations, and efficiency scoring

The application consists of three main screens:

1. **Home Screen** - Lists all available transit routes with quick metrics
2. **Route Planner** - Interactive map for planning and saving custom routes
3. **Dashboard** - System-wide performance metrics and ML training/retraining controls

---

## Features

- **🗺️ Interactive Route Planning** - Plan routes using Google Maps integration
- **📊 Real-time Traffic Predictions** - AI-powered congestion and demand forecasting
- **🎯 Route Optimization** - Automatic route optimization with time savings calculations
- **📈 Performance Dashboard** - System-wide metrics and efficiency tracking
- **⚙️ ML Admin Dashboard** - Train/retrain models and inspect jobs from the app or Convex Dashboard
- **💾 Saved Routes** - Save and manage frequently used routes
- **📱 Cross-platform** - Works on iOS, Android, and Web

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Convex account (free tier available)
- Google Maps API Key (optional, for enhanced routing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TrafficRoutine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Convex dev server (backend)**
   ```bash
   npx convex dev
   ```
   - This will start the local Convex API (usually at `http://127.0.0.1:3210`) and the **Convex Dashboard** (at `http://127.0.0.1:6790`). Keep this terminal running.
   - A `.env.local` file with `CONVEX_DEPLOYMENT=...` will be created automatically.

4. **Configure environment variables for the frontend**
   - Create a `.env` file in the project root and set the public Convex URL to the local API port (not the dashboard port):
     ```env
     # Frontend (Expo) talks to the Convex API
     # Use 127.0.0.1:3210 when running in a local browser
     EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

     # For Android emulator (Genymotion/AVD), use host alias 10.0.2.2
     # EXPO_PUBLIC_CONVEX_URL=http://10.0.2.2:3210

     # Optional: Google Maps API Key
     # EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```

5. **Start the Expo dev server (frontend)**
   ```bash
   npx expo start --web   # For web development
   # or
   npx expo start         # Then press 'a' for Android emulator or 'i' for iOS simulator
   ```

---

## Train Models via Convex Dashboard

You can train and retrain machine learning models either from the in‑app **Admin Dashboard** (UI) or directly from the **Convex Dashboard** (useful for development and ops).

### A) One‑click training inside the app

1. Ensure your Convex dev server is running (`npx convex dev`).
2. Ensure your frontend is pointed to the correct API port via `EXPO_PUBLIC_CONVEX_URL` (see above) and the Expo app is running.
3. Open the app → go to the `Dashboard` tab → tap `Admin` → log in.
   - If you don’t have an admin user yet, create one via Convex Dashboard (see B.2).
4. (Optional) Tap `Load Sample Data` to seed demo routes and traffic metrics.
5. Choose a **Model Name** (e.g., `Expected Demand`) and a **Model Type** (e.g., `Linear Regression`).
6. Tap **Start Training**. You should see a success message with metrics (R², MSE, MAE). The new model will appear under **Active Models** and power the predictions on the Home and Route Detail screens.
7. When you add new routes in `Route Planner` and tap **Save Route**, they appear on the **Home** screen immediately (via Convex live queries). To generate predictions for newly added routes, run **Start Training** again, or call the training function from the Convex Dashboard (below).

### B) Training and data ops via Convex Dashboard (local dev)

1. **Open the dashboard**: Visit `http://127.0.0.1:6790` (shown in the `npx convex dev` output). This is the backend admin UI.
2. **Seed sample data (optional)**:
   - Go to the `Functions` tab → find and run `routes:initializeSampleData`.
   - Verify data under `Data` → you should see entries in `routes` and `trafficMetrics`.
3. **Create an admin user** (if you haven’t already):
   - In `Functions`, run `admin:createAdmin` with JSON args, e.g.:
     ```json
     { "modelName": "(ignored here)", "modelType": "ignored", "trainedBy": "Admin" }
     ```
     Note: If you prefer, you can also run this from your shell:
     ```bash
     npx convex run admin:createAdmin "{\"userName\":\"admin\",\"password\":\"YourSecurePassword\"}"
     ```
     After creation, confirm the new user in `Data` → `admins`.
4. **Trigger ML training from the dashboard**:
   - Go to `Functions` → `mlTraining:trainModel`.
   - Provide JSON arguments such as:
     ```json
     {
       "modelName": "passenger_prediction",
       "modelType": "linear_regression",
       "trainedBy": "Admin"
     }
     ```
   - Click `Run`. You’ll see the job start; watch `Jobs` and `Logs` tabs for progress.
   - When complete, check `Data` → `optimizedRoutes` and `predictions` to see newly generated results.
5. **Refresh the app**:
   - Your running Expo web/app should automatically reflect the new predictions thanks to Convex’s real‑time sync. If not, refresh the browser or reopen the screen.
6. **When adding new routes**:
   - Use the app’s `Route Planner` → `Save Route` to create new entries in `routes`/`savedRoutes`.
   - For predictions on new routes, rerun `mlTraining:trainModel` (as above) or use the in‑app **Start Training** button.

---

## System Metrics & Calculations

This section provides detailed explanations of all metrics and calculations used throughout the system.

### 1. Expected Demand (e.g., 78/120)

**Definition**: The predicted number of passengers currently on a route at a snapshot moment, displayed as a fraction where the numerator is the predicted demand and the denominator is the route's maximum capacity.

**Time Interval**: This metric represents a **snapshot** of passenger count at a specific moment in time, not a rate (e.g., not per hour or per 10 minutes). It answers: "How many passengers are currently on this route right now?"

**Numerator (78)**: Predicted number of passengers currently on all vehicles operating on this route at the current moment
**Denominator (120)**: Maximum total capacity of all vehicles operating on the route (`averageCapacity`) - represents the combined capacity of all buses/vehicles on this route simultaneously

**Calculation**:
```typescript
predictedDemand = Math.min(
  route.averageCapacity,
  avgHistoricalDemand * peakHourFactor
)
```

**Formula Breakdown**:
1. Calculate average historical demand from the last 5 traffic metric records:
   ```typescript
   avgDemand = sum(recentMetrics.expectedPassengers) / recentMetrics.length
   ```
2. Apply peak hour multiplier:
   ```typescript
   peakHourFactor = (hour >= 6 && hour <= 9) ? 1.4 : 1.0
   ```
   - During peak hours (6 AM - 9 AM): Multiply by 1.4
   - During off-peak hours: No multiplier (1.0)
3. Cap at maximum capacity:
   ```typescript
   predictedDemand = Math.min(route.averageCapacity, avgDemand * peakHourFactor)
   ```

**Display Format**: `{predictedDemand} / {averageCapacity}` (e.g., "78 / 120")

**Example Interpretation**: 
- "78 / 120" means there are currently **78 passengers** across all buses on this route, out of a maximum capacity of **120 passengers** total
- This is a **snapshot** at the current moment, not a rate per hour
- If you're asking "how many passengers per hour?", that would require multiplying by trips per hour, which the system doesn't currently calculate

---

### 2. ETA (Estimated Time of Arrival) (e.g., 34 minutes)

**Definition**: The estimated time in minutes for a vehicle to complete a route from start to destination.

**Formula**:
```typescript
ETA = (distance / averageSpeed) * 60
```

**Parameters**:
- `distance`: Route distance in kilometers (km)
- `averageSpeed`: Average vehicle speed in km/h (default: 40 km/h)
- Multiply by 60 to convert hours to minutes

**Example Calculation**:
If a route is 22.5 km long:
```
ETA = (22.5 / 40) * 60 = 33.75 minutes ≈ 34 minutes
```

**Note**: In production, this would be enhanced with:
- Real-time traffic conditions
- Historical travel time data
- Multiple route segments with varying speeds

---

### 3. Predicted Congestion (e.g., 56%)

**Definition**: The predicted traffic congestion level on a route, expressed as a percentage where 0% represents free-flowing traffic and 100% represents maximum congestion.

**Formula**:
```typescript
predictedCongestion = Math.min(100, avgCongestion * peakHourFactor)
```

**Calculation Steps**:

1. **Calculate Average Historical Congestion**:
   ```typescript
   avgCongestion = sum(recentMetrics.congestionLevel) / recentMetrics.length
   ```
   - Uses the last 5 traffic metric records for the route
   - If no historical data exists, defaults to 0

2. **Apply Peak Hour Factor**:
   ```typescript
   timeOfDay = new Date().getHours()
   peakHourFactor = (timeOfDay >= 6 && timeOfDay <= 9) ? 1.4 : 1.0
   ```
   - Morning rush hour (6 AM - 9 AM): Multiply by 1.4
   - Other times: No adjustment (1.0)

3. **Cap at Maximum**:
   ```typescript
   predictedCongestion = Math.min(100, avgCongestion * peakHourFactor)
   ```
   - Ensures congestion never reaches above 100%

**Range**: 0% - 100%
- 0-30%: Low congestion (Green)
- 31-60%: Moderate congestion (Yellow)
- 61-100%: High congestion (Red)

---

### 4. Expected Passengers (e.g., 85 of 120)

**Definition**: Same as Expected Demand, displayed in a different format. Represents the predicted number of passengers currently on a route (at a snapshot moment) compared to the route's maximum capacity.

**Time Interval**: **Snapshot metric** - represents passengers on route at a specific moment, not a rate per hour or time period.

**Numerator (85)**: Predicted number of passengers currently on all vehicles operating on this route (`predictedDemand`)
**Denominator (120)**: Maximum total capacity of all vehicles on the route (`averageCapacity`)

**Calculation**: Identical to Expected Demand (see section above)

**Display Format**: `{predictedDemand} of {averageCapacity}` (e.g., "85 of 120")

**Example Interpretation**:
- "85 of 120" means there are currently **85 passengers** on this route at this moment, out of a maximum of **120 passengers** total capacity
- This is a **current snapshot**, not passengers per hour
- To convert to passengers per hour, you would need to know the route frequency (e.g., if buses run every 10 minutes = 6 trips/hour, and each trip carries ~85 passengers on average, then approximately 510 passengers/hour)

---

### 5. Confidence Score (e.g., 95%)

**Definition**: A measure of reliability for predictions, based on the amount of historical data available. Higher scores indicate more reliable predictions.

**Formula**:
```typescript
confidenceScore = Math.min(0.95, 0.7 + (recentMetrics.length * 0.05))
```

**Calculation Breakdown**:
- **Base confidence**: 0.7 (70%)
- **Data points bonus**: +5% for each historical record (up to 5 records)
- **Maximum confidence**: 0.95 (95%)

**Confidence Levels**:
- **≥ 90%**: Very reliable
- **75-89%**: Moderately reliable
- **< 75%**: Lower reliability (limited historical data)

---

### 6. Optimization Score (e.g., 27/100)

**Definition:** A composite score that evaluates how well a route is optimized, combining congestion, demand utilization, and prediction confidence. Higher is better.

**Formula:**
```typescript
optimizationScore = (congestionFactor * demandFactor * confidenceFactor) * 100
```

**Component calculations:**
- **Congestion factor** (0 to 1): `1 - (predictedCongestion / 100)`
- **Demand factor** (0 to 1): `predictedDemand / route.averageCapacity`
- **Confidence factor** (0.7 to 0.95): `confidenceScore`

This matches the backend implementation:

```12:20:convex/trafficService.ts
  const prediction = await predictTrafficHelper(ctx, args.routeId);
  const route = await ctx.db.get(args.routeId);
  const congestionFactor = 1 - prediction.predictedCongestion / 100;
  const demand factor = prediction.predictedDemand / route.averageCapacity;
  const confidenceFactor = prediction.confidenceScore;
  return (congestionFactor * demandFactor * confidenceFactor) * 100;
```

**Example calculation:**
```
Given:
- Predicted Congestion: 56%
- Predicted Demand: 78 passengers
- Route Capacity: 120 passengers
- Confidence Score: 0.95

congestionFactor = 1 - (56 / 100) = 0.44

demandFactor = 78 / 120 = 0.65

confidenceFactor = 0.95

optimizationScore = (0.44 * 0.65 * 0.95) * 100 ≈ 27/100
```

**Interpretation:**
- **80–100:** Excellent
- **60–79:** Good
- **40–59:** Moderate
- **0–39:** Needs improvement

---

## System Assumptions

The system makes several assumptions for calculations and predictions:

1. **Average Vehicle Speed**:
   - Baseline: 40 km/h (normal traffic conditions)
   - Optimized: 50 km/h (with route optimization)
2. **Peak Hours**:
   - Defined as 6:00 AM - 9:00 AM
   - Peak hour multiplier: 1.4× for congestion and demand
3. **Route Optimization**:
   - Optimized routes are 8% shorter than baseline (`distance * 0.92`)
   - Optimized routes reduce travel time by ~15% (`time * 0.85`)
   - Optimized routes reduce congestion by ~30% (`congestion * 0.7`)
4. **Historical Data**:
   - Uses last 5 traffic metric records for predictions
   - If no historical data exists, default metrics fallback to 0 (guards against `NaN`)
5. **Capacity Assumptions**:
   - Each route has a fixed `averageCapacity` (sum across operating buses)
   - System capacity = sum of all routes' `averageCapacity`
6. **Metrics Safety**:
   - Training pipeline sanitizes metrics to avoid `NaN`/`Infinity`
   - `getTrainingJobs` includes `_creationTime` and returns numeric metrics

---

## Troubleshooting

- **Web app shows “WebSocket … /api/1.29.0/sync … 404”**
  - Your frontend is pointing at the Convex dashboard port (6790) instead of the API port. Set `EXPO_PUBLIC_CONVEX_URL` to the **API port** printed by `npx convex dev` (usually `http://127.0.0.1:3210`), then restart Expo (`npx expo start --clear`). Keep `npx convex dev` running in a separate terminal.
- **Android emulator can’t reach the backend**
  - Use `EXPO_PUBLIC_CONVEX_URL=http://10.0.2.2:3210` (Android emulator’s host alias).
- **`ReturnsValidationError` mentioning `_creationTime` or `NaN`**
  - Pull the latest code (we’ve updated the backend schema and metric sanitization).
  - Restart `npx convex dev` to reload functions.
  - If you have old `trainingJobs` rows with invalid metrics, delete them in `http://127.0.0.1:6790` → `Data` → `trainingJobs`.
- **No predictions after adding a new route**
  - New routes appear immediately on **Home** via live queries.
  - To compute predictions for new routes, re‑run training (in‑app `Start Training` or `mlTraining:trainModel` in the dashboard).

---

## Project Structure

```
TrafficRoutine/
├── components/           # Reusable UI components
│   ├── AddressInput.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── CongestionBadge.tsx
│   ├── ConvexSetupScreen.tsx
│   ├── MapWithFilters.tsx
│   ├── MetricRow.tsx
│   ├── RouteMap.tsx
│   └── RouteMap.web.tsx
├── convex/              # Backend (Convex functions)
│   ├── _generated/      # Auto-generated types
│   ├── geocoding.ts     # Address geocoding functions
│   ├── routes.ts        # Route queries and mutations
│   ├── savedRoutes.ts   # Saved routes management
│   ├── schema.ts        # Database schema
│   ├── admin.ts         # Admin & ML job APIs
│   ├── mlTraining.ts    # ML training & metrics sanitization
│   └── trafficService.ts # Traffic prediction & optimization logic
├── hooks/
│   ├── useTrafficAPI.ts # Data fetching and actions used by screens
│   └── useAdminAPI.ts   # Admin & training hooks
├── lib/
│   ├── geocoding.ts     # Geocoding utilities
│   ├── routeCalculator.ts # Route calculation helpers
│   └── theme.ts         # UI theming
├── ml_training/         # Optional Python training script (scikit-learn)
│   ├── train_model.py
│   └── requirements.txt
├── screens/
│   ├── DashboardScreen.tsx
│   ├── HomeScreen.tsx
│   ├── RouteDetailScreen.tsx
│   ├── RoutePlannerScreen.tsx
│   ├── AdminLogin.tsx
│   └── AdminDashboard.tsx
├── App.tsx              # Main application shell
├── app.json             # Expo configuration
├── .env                 # Frontend env (EXPO_PUBLIC_CONVEX_URL, etc.)
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript config
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Convex backend URL (used by the Expo app & web)
# For local web (browser) with `npx convex dev` printing `http://127.0.0.1:3210`:
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# For Android emulator (host alias to localhost):
# EXPO_PUBLIC_CONVEX_URL=http://10.0.2.2:3210

# Optional: Google Maps API Key (for enhanced routing)
# EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> Note: The Conviction Dashboard runs on a different port (`http://127.0.0.1:6790`) and is only for inspecting data & running functions. Your frontend must point to the **API** port printed by `npx convex dev` (e.g., `http://127.0.0.1:3210`).

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is private and proprietary.

---

## Support

For issues or questions, please open an issue in the repository or contact the development team.

