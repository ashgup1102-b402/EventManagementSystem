# 🚀 Event Management System - Startup Guide

If you see "This site can’t be reached," it usually means the frontend or backend servers (or both) are not running. Follow these steps to get everything back online.

## ⚡ Method 1: The Quick Start (Recommended)
We have created a shortcut script that handles everything—killing old processes, installing missing updates, and starting both servers.

### Steps:
1. Open a terminal (CMD or PowerShell) in the project root: `d:\ASHISH\CANVA\AI\AntiGravity\Event Management`
2. Run the following command:
   ```powershell
   .\run_project.bat
   ```
3. **What this does:**
   - Automatically kills any old processes hanging on ports **5000** (Backend) and **5173** (Frontend).
   - Installs any missing dependencies (`npm install`).
   - Opens two new windows: one for the Backend and one for the Frontend.
   - Opens your browser automatically to `http://localhost:5173`.

---

## 🛠️ Method 2: Manual Startup (If Method 1 fails)
If the batch script doesn't work, you can start the servers manually in two separate terminal windows.

### Window 1: Backend
```powershell
cd backend
npm run dev
```
*   **Why?** This starts the API server and connects to your PostgreSQL database.
*   **Success looks like:** `🚀 Server running on port 5000`

### Window 2: Frontend
```powershell
cd frontend
npm run dev
```
*   **Why?** This starts the Vite development server for the user interface.
*   **Success looks like:** `VITE v5.0.12 ready in X ms`

---

## 🔍 Troubleshooting: "Still not working?"

### 1. "Port already in use"
If a server fails to start because a port is blocked, run these commands to clear them:
```powershell
# Kill anything on port 5000 (Backend)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force

# Kill anything on port 5173 (Frontend)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

### 2. "Database connection failed"
Ensure your **PostgreSQL** service is running. 
- Open **Services** app in Windows.
- Look for `postgresql-x64-XX` (where XX is the version).
- Right-click and select **Start** or **Restart**.

### 3. Missing Dependencies
If you see "module not found" errors, run:
```powershell
cd backend; npm install
cd ..\frontend; npm install
```

---

## ✅ How to Verify
Once started, you can check these URLs in your browser:
- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health) (Should show `{"success": true}`)
