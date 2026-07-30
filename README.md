# DKSH Stock & Status Validator - Vercel App

A premium serverless web application migrated from Streamlit. Ready for deployment on Vercel or running locally.

## Features
- **Consolidated Product ID stock validations**: Group by Product ID, sum variant stocks, and calculate mismatch actions.
- **Dynamic Remarks Tallies**: Dynamic metrics cards showing exact counts for `Change to Active`, `Change to Inactive`, `Make Impact`, etc.
- **Client-Side Downloads**: Instantly download formatted multi-sheet Excel reports containing validation results.
- **Vibrant Dark Theme**: Sleek typography, drop-zone file uploaders, loading indicators, and glassmorphism.

---

## Local Development

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Flask backend**:
   ```bash
   python api/validate.py
   ```
   This starts the api server at `http://127.0.0.1:5000`.

3. **Serve the frontend**:
   Simply open `index.html` in your browser (e.g. using VS Code Live Server) or configure your local server to proxy api requests.

---

## Vercel Deployment

Deploying is extremely easy:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   Run the deploy command from this folder:
   ```bash
   vercel
   ```
   Vercel will automatically read `vercel.json`, deploy your Flask backend serverless function under `/api/validate`, and serve the static `index.html` frontend.
