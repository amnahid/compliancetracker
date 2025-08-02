@echo off
setlocal enabledelayedexpansion

echo.
echo 🏥 ComplianceTracker - Healthcare Compliance Management System
echo =============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ before continuing.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    Version: %NODE_VERSION%

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available. Please install Node.js with npm.
    pause
    exit /b 1
)

echo ✅ npm detected
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo    Version: %NPM_VERSION%

echo.
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

echo.
echo 🔧 Setting up environment variables...

REM Create .env file if it doesn't exist
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul 2>&1
        echo ✅ Created .env file from template
    ) else (
        (
            echo # Database Configuration
            echo MONGODB_URI=mongodb://localhost:27017/compliance-tracker
            echo.
            echo # NextAuth Configuration
            echo NEXTAUTH_SECRET=
            echo NEXTAUTH_URL=http://localhost:3000
            echo.
            echo # Optional: OAuth Providers
            echo # GOOGLE_CLIENT_ID=
            echo # GOOGLE_CLIENT_SECRET=
            echo # GITHUB_CLIENT_ID=
            echo # GITHUB_CLIENT_SECRET=
            echo.
            echo # Optional: Email Configuration
            echo # SMTP_HOST=smtp.gmail.com
            echo # SMTP_PORT=587
            echo # SMTP_USER=
            echo # SMTP_PASSWORD=
            echo.
            echo # Optional: Stripe Configuration
            echo # STRIPE_SECRET_KEY=
            echo # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
        ) > .env
        echo ✅ Created .env file
    )
) else (
    echo ✅ .env file already exists
)

echo.
echo 🔐 Generating authentication secret...
node generate-secret.js

echo.
echo ✅ Setup completed successfully!
echo.
echo 📋 Next steps:
echo    1. Edit the .env file with your database connection string
echo    2. Add the generated NEXTAUTH_SECRET to your .env file
echo    3. Start the development server: npm run dev
echo    4. Open http://localhost:3000 in your browser
echo    5. Create your first admin account
echo.
echo 📖 For detailed setup instructions, see the README.md file
echo.
echo 🏥 Welcome to ComplianceTracker!
echo.
pause
