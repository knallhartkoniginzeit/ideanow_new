@echo off
set GIT_PATH="C:\Program Files\Git\cmd\git.exe"

%GIT_PATH% init
if errorlevel 1 goto :error

%GIT_PATH% add .
if errorlevel 1 goto :error

%GIT_PATH% commit -m "feat: implement persistent chat history with pinning, mobile sidebar, and UI improvements"
if errorlevel 1 (
    echo Commit failed, possibly nothing to commit. Continuing...
)

%GIT_PATH% branch -M main
if errorlevel 1 goto :error

%GIT_PATH% remote add origin https://github.com/knallhartkoniginzeit/ideanow_new.git
if errorlevel 1 (
    echo Remote already exists, trying set-url...
    %GIT_PATH% remote set-url origin https://github.com/knallhartkoniginzeit/ideanow_new.git
)

%GIT_PATH% push -u origin main
if errorlevel 1 goto :error

echo SUCCESS! Pushed to GitHub.
exit /b 0

:error
echo ERROR! Git command failed.
exit /b 1
