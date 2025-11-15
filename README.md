# TrafficRoutine

An AI-powered public transit route optimization system for Zambia's bus network. This application provides real-time traffic predictions, route planning, congestion monitoring, and system-wide performance analytics to improve public transportation efficiency.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [System Metrics & Calculations](#system-metrics--calculations)
- [System Assumptions](#system-assumptions)
- [Project Structure](#project-structure)

---

## Project Overview

TrafficRoutine is a React Native application built with Expo that helps optimize public transit routes in Zambia. The system uses AI-powered predictions to:

- **Predict traffic congestion** based on historical data and time-of-day patterns
- **Optimize route planning** to reduce travel time and distance
- **Monitor system-wide performance** through comprehensive dashboards
- **Provide real-time metrics** including demand forecasting, ETA calculations, and efficiency scoring

The application consists of three main screens:
1. **Home Screen** - Lists all available transit routes with quick metrics
2. **Route Planner** - Interactive map for planning and saving custom routes
3. **Dashboard** - System-wide performance metrics and optimization analytics

---

## Features

- 🗺️ **Interactive Route Planning** - Plan routes using Google Maps integration
- 📊 **Real-time Traffic Predictions** - AI-powered congestion and demand forecasting
- 🎯 **Route Optimization** - Automatic route optimization with time savings calculations
- 📈 **Performance Dashboard** - System-wide metrics and efficiency tracking
- 💾 **Saved Routes** - Save and manage frequently used routes
- 📱 **Cross-platform** - Works on iOS, Android, and Web

---

## Technology Stack

- **Frontend**: React Native with Expo (~53.0.0)
- **Backend**: Convex (Real-time database and backend functions)
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Maps**: React Native Maps with Google Maps API integration
- **Language**: TypeScript
- **State Management**: Convex React hooks

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

3. **Set up Convex backend**
   ```bash
   npx convex dev
   ```
   This will:
   - Prompt you to log in to Convex (or create an account)
   - Create a new Convex project or connect to an existing one
   - Generate a `.env` file with your `EXPO_PUBLIC_CONVEX_URL`

4. **Configure Google Maps (Optional)**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
   Note: The app will work without Google Maps, but with limited routing functionality.

5. **Start the development server**
   ```bash
   npm start
   ```
   Or for specific platforms:
   - Web: `npm run web`
   - Android: `npm run android`
   - iOS: `npm run ios`

---

## System Metrics & Calculations

This section provides detailed explanations of all metrics and calculations used throughout the system.

### 1. Expected Demand (e.g., 78/120)

**Definition**: The predicted number of passengers expected on a route, displayed as a fraction where the numerator is the predicted demand and the denominator is the route's maximum capacity.

**Numerator (78)**: Predicted passenger demand for the route
**Denominator (120)**: Maximum capacity of vehicles operating on the route (`averageCapacity`)

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
   - Ensures congestion never exceeds 100%

**Range**: 0% - 100%
- 0-30%: Low congestion (Green)
- 31-60%: Moderate congestion (Yellow)
- 61-100%: High congestion (Red)

---

### 4. Expected Passengers (e.g., 85 of 120)

**Definition**: Same as Expected Demand, displayed in a different format. Represents the predicted number of passengers expected on a route compared to the route's maximum capacity.

**Numerator (85)**: Predicted passenger count (`predictedDemand`)
**Denominator (120)**: Maximum route capacity (`averageCapacity`)

**Calculation**: Identical to Expected Demand calculation (see section 1 above).

**Prediction Method**:
1. Analyze historical passenger data from last 5 records
2. Calculate average passenger count
3. Apply time-of-day adjustments (40% increase during peak hours)
4. Ensure prediction doesn't exceed route capacity

**Display Format**: `{predictedDemand} of {averageCapacity}` (e.g., "85 of 120")

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
- **1 data point**: 70% + (1 × 5%) = 75%
- **2 data points**: 70% + (2 × 5%) = 80%
- **3 data points**: 70% + (3 × 5%) = 85%
- **4 data points**: 70% + (4 × 5%) = 90%
- **5+ data points**: 70% + (5 × 5%) = 95% (capped)

**Display**: Converted to percentage: `confidenceScore * 100` (e.g., 0.95 → "95%")

**Interpretation**:
- **≥ 90%**: Very reliable prediction
- **75-89%**: Moderately reliable
- **< 75%**: Lower reliability (limited historical data)

---

### 6. Optimization Score (e.g., 27/100)

**Definition**: A composite score that evaluates how well a route is optimized, considering congestion levels, passenger demand, and prediction confidence. The score ranges from 0 to 100, where higher scores indicate better optimization potential.

**Formula**:
```typescript
optimizationScore = (congestionFactor * demandFactor * confidenceFactor) * 100
```

**Component Calculations**:

1. **Congestion Factor** (0 to 1):
   ```typescript
   congestionFactor = 1 - (predictedCongestion / 100)
   ```
   - Lower congestion = Higher factor
   - Example: 56% congestion → factor = 1 - 0.56 = 0.44

2. **Demand Factor** (0 to 1):
   ```typescript
   demandFactor = predictedDemand / route.averageCapacity
   ```
   - Represents utilization rate
   - Example: 78 passengers / 120 capacity = 0.65

3. **Confidence Factor** (0.7 to 0.95):
   ```typescript
   confidenceFactor = confidenceScore (as calculated in section 5)
   ```

**Complete Example Calculation**:
```
Given:
- Predicted Congestion: 56%
- Predicted Demand: 78 passengers
- Route Capacity: 120 passengers
- Confidence Score: 0.95

Step 1: congestionFactor = 1 - (56/100) = 0.44
Step 2: demandFactor = 78/120 = 0.65
Step 3: confidenceFactor = 0.95

optimizationScore = (0.44 * 0.65 * 0.95) * 100
                  = 0.2717 * 100
                  = 27.17 ≈ 27/100
```

**Score Interpretation**:
- **80-100**: Excellent optimization
- **60-79**: Good optimization
- **40-59**: Moderate optimization
- **20-39**: Poor optimization (high congestion, low demand, or low confidence)
- **0-19**: Very poor optimization

**Numerator (27)**: Calculated optimization score
**Denominator (100)**: Maximum possible score

---

### 7. Active Routes (e.g., 3)

**Definition**: The total number of transit routes currently active in the system.

**Determination Method**:
```typescript
activeRoutes = routes.length
```

The system counts all routes returned by the `listAllRoutes` query from the database. A route is considered "active" if it exists in the `routes` table, regardless of whether vehicles are currently operating on it.

**Calculation**:
- Queries all records from the `routes` table
- Returns the count of routes
- Updates in real-time as routes are added or removed

**Note**: This is a simple count and doesn't filter based on:
- Current vehicle presence
- Time of operation
- Service status

---

### 8. System Capacity (e.g., 370 passengers)

**Definition**: The total maximum passenger capacity across all routes in the transit network. This represents the theoretical maximum number of passengers that can be accommodated simultaneously if all vehicles operate at full capacity.

**Formula**:
```typescript
systemCapacity = sum(routes.averageCapacity)
```

**Calculation Steps**:
1. Retrieve all routes from the database
2. Sum the `averageCapacity` value from each route
3. Return the total

**Example**:
```
Route 1: 120 passengers capacity
Route 2: 100 passengers capacity
Route 3: 150 passengers capacity

System Capacity = 120 + 100 + 150 = 370 passengers
```

**Interpretation**:
- This represents the **total theoretical capacity** of the fleet
- Does not account for:
  - Vehicles not in service
  - Vehicles operating below capacity
  - Route overlapping (shared vehicles)
- Useful for:
  - Fleet planning
  - Capacity utilization analysis
  - Network expansion decisions

**Display**: `{totalCapacity} passengers` (e.g., "370 passengers")

---

### 9. System Efficiency Gain (e.g., 12.5%)

**Definition**: The overall improvement in system efficiency achieved through route optimization, expressed as a percentage. This metric represents the aggregate benefit of applying optimized routes across the entire transit network.

**Current Implementation**:
```typescript
efficiencyGain = 12.5  // Fixed value (percentage)
```

**Note**: In the current implementation, this is a static value. In a production system, it would be calculated as:

**Intended Formula** (per route):
```typescript
routeEfficiencyGain = (timeSaved / baselineETA) * 100
```

**System-wide Calculation** (would be):
```typescript
// Average efficiency gain across all optimized routes
systemEfficiencyGain = average(
  routes.map(route => routeEfficiencyGain)
)
```

**Per-Route Efficiency Gain Formula**:
```typescript
// From optimized route calculations:
baselineETA = (distance / 40) * 60  // Baseline speed: 40 km/h
optimizedETA = (optimizedDistance / 50) * 60  // Optimized speed: 50 km/h
timeSaved = baselineETA - optimizedETA
efficiencyGain = (timeSaved / baselineETA) * 100
```

**Example Calculation**:
```
Given:
- Baseline Distance: 22.5 km
- Optimized Distance: 20.7 km (8% reduction: 22.5 * 0.92)
- Baseline ETA: (22.5 / 40) * 60 = 33.75 minutes
- Optimized ETA: (20.7 / 50) * 60 = 24.84 minutes
- Time Saved: 33.75 - 24.84 = 8.91 minutes

Efficiency Gain = (8.91 / 33.75) * 100 = 26.4%
```

**Display**: `{efficiencyGain}% improvement` (e.g., "12.5% improvement")

**What It Measures**:
- Time savings percentage
- Reduction in travel time through optimization
- Overall network performance improvement

---

## System Assumptions

The system makes several assumptions for calculations and predictions:

### Route Assumptions

1. **Average Vehicle Speed**:
   - Baseline: 40 km/h (normal traffic conditions)
   - Optimized: 50 km/h (with route optimization)

2. **Peak Hours**:
   - Defined as 6:00 AM - 9:00 AM
   - Peak hour multiplier: 1.4x for congestion and demand

3. **Route Optimization**:
   - Optimized routes are 8% shorter than baseline (`distance * 0.92`)
   - Optimized routes reduce travel time by ~15% (`time * 0.85`)
   - Optimized routes reduce congestion by 30% (`congestion * 0.7`)

4. **Historical Data**:
   - Uses last 5 traffic metric records for predictions
   - If no historical data exists, defaults to 0 for averages

5. **Confidence Scoring**:
   - Minimum confidence: 70% (with 0 data points)
   - Maximum confidence: 95% (with 5+ data points)
   - Each additional data point adds 5% confidence

6. **Congestion Calculation**:
   - Based solely on historical data and time-of-day
   - Does not account for:
     - Real-time traffic events
     - Weather conditions
     - Special events
     - Road construction

7. **Capacity Assumptions**:
   - Each route has a fixed `averageCapacity`
   - Capacity represents maximum passengers per vehicle/bus
   - System capacity is sum of all route capacities

8. **Distance Calculation**:
   - Uses Haversine formula for straight-line distance
   - Google Maps API (if available) provides actual road distance
   - Falls back to simplified route generation if API unavailable

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
│   └── trafficService.ts # Traffic prediction logic
├── hooks/               # Custom React hooks
│   └── useTrafficAPI.ts # API integration hooks
├── lib/                 # Utility libraries
│   ├── geocoding.ts     # Geocoding utilities
│   ├── routeCalculator.ts # Route calculation functions
│   └── theme.ts         # Theme and styling constants
├── screens/             # Application screens
│   ├── DashboardScreen.tsx
│   ├── HomeScreen.tsx
│   ├── RouteDetailScreen.tsx
│   └── RoutePlannerScreen.tsx
├── App.tsx              # Main application component
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Convex backend URL (auto-generated by `npx convex dev`)
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Optional: Google Maps API Key (for enhanced routing)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

This project is private and proprietary.

---

## Support

For issues or questions, please open an issue in the repository or contact the development team.

