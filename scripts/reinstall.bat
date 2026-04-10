@echo off
REM Clean and reinstall all dependencies for PodPlate Platform
echo ==========================================
echo PodPlate Platform - Clean Reinstall Script
echo ==========================================
echo.

REM Get the project root directory
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo Step 1: Cleaning node_modules...
echo.

REM Remove all node_modules in services
for /d %%d in (services\*) do (
    if exist "%%d\node_modules" (
        echo Removing %%d\node_modules
        rmdir /s /q "%%d\node_modules" 2>nul
    )
)

REM Remove root node_modules
if exist "node_modules" (
    echo Removing root node_modules
    rmdir /s /q "node_modules" 2>nul
)

echo.
echo Step 2: Cleaning package-lock.json files...
echo.

REM Remove all package-lock.json in services
for /d %%d in (services\*) do (
    if exist "%%d\package-lock.json" (
        echo Removing %%d\package-lock.json
        del /f "%%d\package-lock.json" 2>nul
    )
)

REM Remove root package-lock.json
if exist "package-lock.json" (
    echo Removing root package-lock.json
    del /f "package-lock.json" 2>nul
)

echo.
echo Step 3: Installing root dependencies...
echo.
call npm install
if errorlevel 1 (
    echo ERROR: Root npm install failed!
    exit /b 1
)

echo.
echo Step 4: Installing service dependencies...
echo.

REM Install dependencies for each service
for /d %%d in (services\*) do (
    if exist "%%d\package.json" (
        echo.
        echo Installing dependencies for %%d
        cd /d "%%d"
        call npm install
        if errorlevel 1 (
            echo ERROR: npm install failed for %%d
            cd /d "%PROJECT_ROOT%"
            exit /b 1
        )
        cd /d "%PROJECT_ROOT%"
    )
)

echo.
echo ==========================================
echo Reinstall completed successfully!
echo ==========================================
echo.
pause
