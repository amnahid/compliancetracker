@echo off
REM Google OAuth Setup Helper Script for Windows
REM This script helps you configure Google OAuth for your ComplianceTracker application

echo.
echo 🚀 Google OAuth Setup Helper
echo =================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ .env file created from .env.example
    ) else (
        echo ❌ .env.example not found. Please create .env file manually.
        pause
        exit /b 1
    )
)

echo 📋 To complete Google OAuth setup, you need:
echo 1. Google Cloud Console project
echo 2. OAuth 2.0 credentials (Client ID and Secret)
echo 3. Authorized redirect URIs configured
echo.

echo 🔗 Quick Links:
echo • Google Cloud Console: https://console.cloud.google.com/
echo • OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent
echo • Create Credentials: https://console.cloud.google.com/apis/credentials
echo.

echo 📝 Required Redirect URI for development:
echo http://localhost:3000/api/auth/callback/google
echo.

REM Check current environment variables
echo 🔍 Current Environment Configuration:
echo =================================

REM Check if Google OAuth is configured
findstr /C:"GOOGLE_CLIENT_ID=" .env >nul
if %errorlevel%==0 (
    findstr /C:"GOOGLE_CLIENT_ID=your-google-client-id" .env >nul
    if %errorlevel%==0 (
        echo ❌ GOOGLE_CLIENT_ID: Not configured (using placeholder)
    ) else (
        findstr /C:"GOOGLE_CLIENT_ID=$" .env >nul
        if %errorlevel%==0 (
            echo ❌ GOOGLE_CLIENT_ID: Not configured (empty)
        ) else (
            echo ✅ GOOGLE_CLIENT_ID: Configured
        )
    )
) else (
    echo ❌ GOOGLE_CLIENT_ID: Not found in .env
)

findstr /C:"GOOGLE_CLIENT_SECRET=" .env >nul
if %errorlevel%==0 (
    findstr /C:"GOOGLE_CLIENT_SECRET=your-google-client-secret" .env >nul
    if %errorlevel%==0 (
        echo ❌ GOOGLE_CLIENT_SECRET: Not configured (using placeholder)
    ) else (
        findstr /C:"GOOGLE_CLIENT_SECRET=$" .env >nul
        if %errorlevel%==0 (
            echo ❌ GOOGLE_CLIENT_SECRET: Not configured (empty)
        ) else (
            echo ✅ GOOGLE_CLIENT_SECRET: Configured
        )
    )
) else (
    echo ❌ GOOGLE_CLIENT_SECRET: Not found in .env
)

findstr /C:"NEXTAUTH_SECRET=" .env >nul
if %errorlevel%==0 (
    findstr /C:"NEXTAUTH_SECRET=$" .env >nul
    if %errorlevel%==0 (
        echo ❌ NEXTAUTH_SECRET: Not configured (empty)
    ) else (
        echo ✅ NEXTAUTH_SECRET: Configured
    )
) else (
    echo ❌ NEXTAUTH_SECRET: Not found in .env
)

findstr /C:"NEXTAUTH_URL=" .env >nul
if %errorlevel%==0 (
    echo ✅ NEXTAUTH_URL: Configured
) else (
    echo ❌ NEXTAUTH_URL: Not found in .env
)

echo.
echo 🛠️  To configure Google OAuth:
echo 1. Follow the guide: docs\google-oauth-setup.md
echo 2. Update your .env file with:
echo    GOOGLE_CLIENT_ID=your-actual-client-id
echo    GOOGLE_CLIENT_SECRET=your-actual-client-secret
echo 3. Restart your development server: npm run dev
echo.

REM Check if development server is running
tasklist /FI "IMAGENAME eq node.exe" | findstr /C:"node.exe" >nul
if %errorlevel%==0 (
    echo 🟢 Node.js processes detected (may include dev server)
    echo 💡 After updating .env, restart with: npm run dev
) else (
    echo 🔴 No Node.js processes detected
    echo 💡 Start development server with: npm run dev
)

echo.
echo 📖 For detailed instructions, see: docs\google-oauth-setup.md
echo 🆘 Need help? Check: docs\22-faq.md
echo.
pause
