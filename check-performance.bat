@echo off
echo === VS Code Performance Monitor ===
echo.

echo Checking TypeScript memory usage...
tasklist /fi "imagename eq node.exe" /fo table | findstr /i "typescript\|tsserver" 2>nul || echo No TypeScript servers found

echo.
echo Checking VS Code processes...
tasklist /fi "imagename eq code.exe" /fo table 2>nul || echo VS Code not running

echo.
echo Checking file counts...
echo Files in node_modules:
dir node_modules /s 2>nul | find /c "File(s)" || echo Cannot count node_modules files

echo.
echo Project structure (root files only):
dir /b | find /c /v "" 
echo Files in root directory

echo.
echo Recommendations:
echo 1. Restart VS Code completely
echo 2. Open using workspace file: tech-resume.code-workspace
echo 3. Disable extensions you don't need
echo 4. Consider using VS Code Insiders for better performance
echo.
pause
