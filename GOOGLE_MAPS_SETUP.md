# Google Maps API Key Setup Guide

This guide will help you get and configure your Google Maps API key for the TrafficRoutine app.

## Step 1: Get Your Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project (or select existing)**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name: "TrafficRoutine" (or any name you prefer)
   - Click "Create"

3. **Enable Required APIs**
   You need to enable these APIs for the app to work:
   
   - **Maps JavaScript API** - For displaying maps on web
   - **Places API** - For address autocomplete/search
   - **Directions API** - For route calculation
   - **Geocoding API** - For converting addresses to coordinates
   
   To enable each API:
   - Go to "APIs & Services" > "Library"
   - Search for each API name above
   - Click on it and press "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (you'll see it in a popup)

5. **Restrict Your API Key (Recommended for Production)**
   - Click on your newly created API key
   - Under "API restrictions", select "Restrict key"
   - Choose the APIs you enabled above
   - Under "Application restrictions", you can restrict by:
     - **HTTP referrers** (for web)
     - **Android apps** (for Android)
     - **iOS apps** (for iOS)
   - Click "Save"

## Step 2: Add API Key to Your Project

### Option 1: Using .env file (Recommended for Development)

1. **Create a `.env` file** in the root of your project:
   ```
   C:\xampp\htdocs\Macroit\TrafficRoutine\.env
   ```

2. **Add your API key** to the `.env` file:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. **Restart your Expo dev server**:
   ```bash
   npx expo start --clear
   ```

### Option 2: Using app.json (For Production Builds)

For iOS and Android native builds, you also need to add the API key to `app.json`:

1. **Open `app.json`**

2. **Update the iOS configuration**:
   ```json
   "ios": {
     "config": {
       "googleMapsApiKey": "your_ios_api_key_here"
     }
   }
   ```

3. **Update the Android configuration**:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "your_android_api_key_here"
       }
     }
   }
   ```

   **Note:** You can use the same API key for both iOS and Android, or create separate keys for better security.

## Step 3: Verify Setup

1. **Check your `.env` file** contains:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your_key_here
   ```

2. **Restart Expo dev server** with cleared cache:
   ```bash
   npx expo start --clear
   ```

3. **Test the app**:
   - Open the Route Planner screen
   - Try entering an address in the search filters
   - You should see address suggestions and a map

## Troubleshooting

### API Key Not Working?

1. **Check API restrictions**: Make sure your API key has the required APIs enabled
2. **Check billing**: Google Maps requires a billing account (but has free tier)
3. **Check domain restrictions**: If you restricted by HTTP referrer, make sure `localhost` is allowed for development
4. **Check console errors**: Open browser console to see specific error messages

### "API key not configured" Message?

- Make sure your `.env` file is in the project root
- Make sure the variable name is exactly: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Restart Expo dev server after creating/updating `.env`
- Check that `.env` is not in `.gitignore` (it should be, but make sure the file exists)

### Free Tier Limits

Google Maps offers a free tier with these monthly limits:
- Maps JavaScript API: 28,000 map loads
- Places API: 1,000 requests
- Directions API: 2,500 requests
- Geocoding API: 40,000 requests

For development and small apps, this is usually sufficient.

## Security Notes

⚠️ **Important**: Never commit your `.env` file to version control!

- The `.env` file should already be in `.gitignore`
- Use different API keys for development and production
- Restrict your API keys to specific domains/apps in production
- Monitor your API usage in Google Cloud Console

## Need Help?

- Google Maps API Documentation: https://developers.google.com/maps/documentation
- Expo Environment Variables: https://docs.expo.dev/guides/environment-variables/
- Google Cloud Console: https://console.cloud.google.com/

