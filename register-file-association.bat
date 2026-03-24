@echo off
:: MDViewer - Register File Association for .md files
:: Run this script as Administrator to register MDViewer in Windows context menu

echo ============================================
echo   MDViewer - File Association Setup
echo ============================================
echo.

set "APP_PATH=%~dp0dist\win-unpacked\MDViewer.exe"

:: Check if MDViewer.exe exists
if not exist "%APP_PATH%" (
    echo ERROR: MDViewer.exe not found at:
    echo   %APP_PATH%
    echo.
    echo Please make sure you run this script from the MDViewer project root.
    pause
    exit /b 1
)

echo Registering MDViewer for .md files...
echo App path: %APP_PATH%
echo.

:: Register the application
reg add "HKCU\Software\Classes\MDViewer.md" /ve /d "Markdown Document" /f
reg add "HKCU\Software\Classes\MDViewer.md\DefaultIcon" /ve /d "\"%APP_PATH%\",0" /f
reg add "HKCU\Software\Classes\MDViewer.md\shell\open\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f

:: Associate .md extension
reg add "HKCU\Software\Classes\.md" /ve /d "MDViewer.md" /f
reg add "HKCU\Software\Classes\.md\OpenWithProgids" /v "MDViewer.md" /t REG_SZ /d "" /f

:: Associate .markdown extension  
reg add "HKCU\Software\Classes\.markdown" /ve /d "MDViewer.md" /f
reg add "HKCU\Software\Classes\.markdown\OpenWithProgids" /v "MDViewer.md" /t REG_SZ /d "" /f

:: Add to "Open With" list
reg add "HKCU\Software\Classes\Applications\MDViewer.exe\shell\open\command" /ve /d "\"%APP_PATH%\" \"%%1\"" /f
reg add "HKCU\Software\Classes\Applications\MDViewer.exe\SupportedTypes" /v ".md" /t REG_SZ /d "" /f
reg add "HKCU\Software\Classes\Applications\MDViewer.exe\SupportedTypes" /v ".markdown" /t REG_SZ /d "" /f

:: Refresh shell icon cache
ie4uinit.exe -ClearIconCache >nul 2>&1
ie4uinit.exe -show >nul 2>&1

echo.
echo ============================================
echo   Done! MDViewer is now registered.
echo ============================================
echo.
echo You can now:
echo   1. Right-click any .md file - Open With - MDViewer
echo   2. Set as default: Right-click .md - Open With - 
echo      Choose another app - MDViewer - Always use
echo   3. Double-click .md files to open with MDViewer
echo.
pause
