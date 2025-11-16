# Admin Dashboard Setup Guide

## Creating Your First Admin Account

There is **no default admin account**. You need to create one first.

### Method 1: Using Convex Dashboard (Recommended)

1. **Start Convex backend** (if not already running):
   ```bash
   npx convex dev
   ```

2. **Open Convex Dashboard**:
   - Go to https://dashboard.convex.dev
   - Select your project

3. **Create Admin Account**:
   - Click on **"Functions"** tab in the left sidebar
   - Find the function: `admin.createAdmin`
   - Click on it to open the function details
   - Click **"Call Function"** button
   - Enter the following JSON:
     ```json
     {
       "username": "admin",
       "password": "your_secure_password_here"
     }
     ```
   - Click **"Run"**
   - You should see a success message with the admin ID

### Method 2: Using Convex CLI

1. **Start Convex backend**:
   ```bash
   npx convex dev
   ```

2. **In a new terminal, run**:
   ```bash
   npx convex run admin:createAdmin '{"username": "admin", "password": "your_secure_password_here"}'
   ```

### Method 3: Using the Helper Script

1. **Run the helper script**:
   ```bash
   node scripts/createAdmin.js
   ```
   
   This will prompt you for username and password, then show you the exact commands to run.

## Logging In to Admin Dashboard

1. **Start your Expo app**:
   ```bash
   npm start
   ```

2. **Navigate to Dashboard**:
   - Open the app
   - Go to the **"Metrics"** tab (Dashboard screen)

3. **Access Admin Login**:
   - Look for the **shield icon** (🛡️) in the top-right corner of the Dashboard screen
   - Tap on it

4. **Enter Credentials**:
   - Username: The username you created (e.g., "admin")
   - Password: The password you set
   - Tap **"Login"**

5. **Access Admin Dashboard**:
   - After successful login, you'll be taken to the Admin Dashboard
   - Here you can:
     - View active ML models
     - Train new models
     - View training job history
     - Manage models

## Default Credentials

**There are NO default credentials.** You must create an admin account first using one of the methods above.

## Security Notes

- **Change the default password** if you used "admin" as username
- Use a **strong password** (at least 8 characters, mix of letters, numbers, symbols)
- In production, consider:
  - Using environment variables for admin credentials
  - Implementing session tokens
  - Adding rate limiting for login attempts
  - Using bcrypt instead of SHA-256 for password hashing

## Troubleshooting

### "Invalid username or password"
- Make sure you created the admin account first
- Check that you're using the correct username and password
- Verify the admin account exists in Convex Dashboard → Data → admins table

### "Admin username already exists"
- The username is already taken
- Try a different username or check existing admins in the database

### Can't find admin.createAdmin function
- Make sure `convex/admin.ts` is deployed
- Run `npx convex dev` to deploy functions
- Check that the function is visible in Convex Dashboard

### Login screen not working
- Check that Convex backend is running (`npx convex dev`)
- Verify `EXPO_PUBLIC_CONVEX_URL` is set in your `.env` file
- Check browser/device console for errors

## Quick Start Example

```bash
# 1. Start Convex
npx convex dev

# 2. In Convex Dashboard, call admin.createAdmin with:
{
  "username": "admin",
  "password": "Admin123!"
}

# 3. Start Expo app
npm start

# 4. In app: Dashboard → Shield Icon → Login
# Username: admin
# Password: Admin123!
```

## Need Help?

If you encounter issues:
1. Check Convex Dashboard for errors
2. Verify all files are saved and deployed
3. Check the browser/device console for error messages
4. Ensure Convex backend is running

