# Deploying NanoVision on Render

NanoVision is configured for **Render Blueprint (Infrastructure as Code)** deployment via `render.yaml`. This enables automated, 1-click provisioning of both the **FastAPI backend** and **Next.js frontend**.

---

## Method 1: Render Blueprint (Recommended - 1 Click)

### Step 1: Push Code to GitHub
Ensure you have created a repository on GitHub (e.g., `https://github.com/Asmitxp/nanovision`):

```bash
# Rename branch to main
git branch -M main

# Add your GitHub remote URL
git remote add origin https://github.com/Asmitxp/<YOUR_REPOSITORY_NAME>.git

# Push code to GitHub
git push -u origin main
```

### Step 2: Deploy on Render
1. Open [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub account and select your `nanovision` repository.
4. Render will parse the root `render.yaml` file and automatically display the two planned services:
   - **`nanovision-backend`** (Python Web Service, port `$PORT`, health check `/api/health`)
   - **`nanovision-frontend`** (Node.js Web Service, Next.js 14)
5. Click **Apply**.
6. Render will build and deploy both services automatically!

---

## Method 2: Manual Service Creation on Render

If you prefer to configure the services individually in Render's UI:

### 1. Deploy the Backend Service
1. On Render, click **New +** > **Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Name:** `nanovision-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables**:
   - `PYTHON_VERSION`: `3.11.9`
   - `SECRET_KEY`: `generate-a-random-secure-string`
   - `ENV`: `production`
5. Click **Create Web Service**. Note the deployed URL (e.g. `https://nanovision-backend.onrender.com`).

### 2. Deploy the Frontend Service
1. On Render, click **New +** > **Web Service**.
2. Select the same repository.
3. Configure the settings:
   - **Name:** `nanovision-frontend`
   - **Root Directory:** `frontend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add **Environment Variables**:
   - `NODE_VERSION`: `20.18.0`
   - `NEXT_PUBLIC_API_URL`: `https://nanovision-backend.onrender.com/api` *(replace with your actual backend URL from step 1)*
5. Click **Create Web Service**.

---

## Key Render Configurations Applied in Code

1. **Headless Computer Vision:**
   The backend uses `opencv-python-headless` in `requirements.txt`, avoiding common missing Linux X11/libGL GUI libraries on Render.
2. **Dynamic Port Binding:**
   The backend dynamically binds to `0.0.0.0:$PORT` via Uvicorn. Next.js natively uses Render's assigned `$PORT`.
3. **Health Check Endpoint:**
   `GET /api/health` returns status `200 OK` for zero-downtime health checking on Render.
4. **CORS:**
   FastAPI CORS is configured to allow requests from any frontend domain.

