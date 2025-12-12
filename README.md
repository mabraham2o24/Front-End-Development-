# Cloud Deployement 

---


## Technologies Used
- Node.js
- Express
- MongoDB Atlas
- Passport.js (Google & LinkedIn OAuth)
- Jest & Supertest
- GitHub Actions
- Google Cloud Run
- Google Secret Manager
- Google Cloud IAM

---

## Local Development Setup

### Environment Variables (Local Only)
- Stored in a `.env` file
- **Never committed to GitHub**
- Used only for local development

Example `.env`:
- PORT=3000
- SESSION_SECRET=your_secret
- MONGODB_URI=your_mongo_uri
- OPENWEATHER_API_KEY=your_api_key
- DEFAULT_CITY=Philadelphia
- GOOGLE_CLIENT_ID=your_google_client_id
- GOOGLE_CLIENT_SECRET=your_google_client_secret
- GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
- LINKEDIN_CLIENT_ID=your_linkedin_client_id
- LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
- LINKEDIN_CALLBACK_URL=http://localhost:3000/auth/linkedin/callback

---

## Git Ignore Configuration
- `.env`
- `github-deployer-key.json`
- `node_modules/`

---

## CI/CD Pipeline Overview
- Triggered on every push to `main`
- Runs tests automatically
- Deploys automatically if tests pass
- Uses GitHub Actions
- Deploys to Google Cloud Run

---

## GitHub Actions Workflow Location
- `.github/workflows/deploy.yaml`

---

## GitHub Actions Workflow Responsibilities
- Checkout repository
- Install dependencies
- Run Jest tests
- Authenticate with Google Cloud
- Deploy to Cloud Run

---

## GitHub Actions Workflow File (`deploy.yaml`)

- Uses Node.js 20
- Uses `npm ci` for clean installs
- Runs tests with MongoDB access
- Deploys without overriding production secrets
- Sets `NODE_ENV=production`
<img width="699" height="883" alt="image" src="https://github.com/user-attachments/assets/05902355-3b1b-4de8-9e75-355bba4a8764" />
<img width="498" height="323" alt="image" src="https://github.com/user-attachments/assets/44da02b3-ffe8-453c-93af-30574641123d" />

---
## Google Cloud Setup

### Service Account
- Created a dedicated service account:
  - `github-deployer`
- Used only by GitHub Actions

---

### IAM Roles Granted
- roles/run.admin
- roles/iam.serviceAccountUser
- roles/artifactregistry.writer
- roles/storage.admin
- roles/serviceusage.serviceUsageConsumer

---

### Service Account Key
- Generated as JSON
- Stored locally only
- Added to `.gitignore`
- Copied into GitHub Secrets as `GCP_SA_KEY`

---

## GitHub Repository Secrets

### Required GitHub Secrets
- GCP_PROJECT_ID
- GCP_REGION
- GCP_SA_KEY
- MONGO_URI
- SESSION_SECRET
- OPENWEATHER_API_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET
- LINKEDIN_CALLBACK_URL

---

## Google Secret Manager

### Why Secret Manager Is Used
- `.env` files are not used in production
- Secrets are injected securely into Cloud Run
- Prevents exposing sensitive credentials

---

### Secrets Stored in Google Secret Manager
- MONGO_URI
- SESSION_SECRET
- OPENWEATHER_API_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET
- LINKEDIN_CALLBACK_URL

---

## Cloud Run Environment Configuration

### Environment Variables
- NODE_ENV=production

### Secrets Exposed as Environment Variables
- SESSION_SECRET
- MONGO_URI
- OPENWEATHER_API_KEY
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- LINKEDIN_CLIENT_ID
- LINKEDIN_CLIENT_SECRET
- LINKEDIN_CALLBACK_URL

---

## OAuth Configuration

### Google OAuth
- OAuth client created in Google Cloud Console
- Callback URL must match Cloud Run URL
- Example:
  - https://loginsystem-<project>.run.app/auth/google/callback

---

### LinkedIn OAuth
- App created in LinkedIn Developer Portal
- Callback URL must match Cloud Run URL
- Example:
  - https://loginsystem-<project>.run.app/auth/linkedin/callback

---


## Automated Deployement Screenshots
<img width="1441" height="267" alt="image" src="https://github.com/user-attachments/assets/256cf74d-839b-47df-9b97-1dd0612abcd7" />
<img width="1420" height="734" alt="image" src="https://github.com/user-attachments/assets/c84dde3d-e93d-4730-8b19-3f4ae4997f15" />
<img width="890" height="487" alt="image" src="https://github.com/user-attachments/assets/2425836c-607d-47fb-8eeb-dcc398e5c471" />

### Website: https://loginsystem-980856208139.us-central1.run.app/
### Quick Demo: https://psu.mediaspace.kaltura.com/media/Mahima+Susan+Abrahams+Zoom+Meeting/1_r4ohp2ah
