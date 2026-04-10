@echo off
REM Start all services in development mode using concurrently
echo Starting PodPlate Platform services...
echo.

set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

REM Check if concurrently is installed globally or locally
where concurrently >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing concurrently...
    npm install -g concurrently
)

echo Starting all services...
concurrently ^
    "cd services/api-gateway && npm run dev" ^
    "cd services/auth-service && npm run dev" ^
    "cd services/user-service && npm run dev" ^
    "cd services/product-service && npm run dev" ^
    "cd services/cart-service && npm run dev" ^
    "cd services/order-service && npm run dev" ^
    "cd services/payment-service && npm run dev" ^
    "cd services/restaurant-service && npm run dev" ^
    "cd services/notification-service && npm run dev" ^
    --names "gateway,auth,user,product,cart,order,payment,restaurant,notification" ^
    --prefix-colors "blue,red,green,yellow,magenta,cyan,white,gray,blue" ^
    --kill-others
