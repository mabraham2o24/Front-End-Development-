## Overview

This assignment combines the login system I created with my weather api. 

- Users sign in with **Google or LinkedIn** using OAuth 2.0.
- After login, they see a **Profile** page with their account details.
- From the Profile page, they can open a **Weather Dashboard**.
- The Weather Dashboard lets users:
  - Search for a city and fetch current weather from the **OpenWeatherMap API**.
  - Save the result into **MongoDB**.
  - View all saved weather records.
  - Refresh a record to update it with the latest weather.
  - Delete a record from the database.

The backend is built with **Node.js, Express, Passport, MongoDB**, and the frontend uses **EJS templates + client-side JavaScript**.

## Environment Variables

Create a `.env` file in the project root with the following keys:

env
PORT=3000

SESSION_SECRET=your_session_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:3000/auth/linkedin/callback

# MongoDB
MONGO_URI=your_mongodb_connection_string

# OpenWeatherMap
OPENWEATHER_API_KEY=your_openweather_api_key
DEFAULT_CITY=Philadelphia

## Code Explanations 

### 1. Google OAuth2 
#### - Handles OAuth login for Google 
#### - After logging in Google sends back the User's profile- email, photo, name, etc. 
#### - User object is created and stored in memory 
#### - After successful login the user is redirected to their profile
<img width="580" height="523" alt="image" src="https://github.com/user-attachments/assets/2e3229e6-7546-4f24-8761-30b8cced5701" />

---
### 2. Linkedin OAuth2
#### - Handles OAuth login for Linkedin
#### - Uses accessToken to call Linkedin's userinfo endpoint
#### - Fetches name, email, and picture
#### - Stores user in memory 
#### - Redirects user to profil after successful login
<img width="745" height="848" alt="image" src="https://github.com/user-attachments/assets/0373f9ae-755b-4058-a849-032f1f04127b" />
<img width="258" height="271" alt="image" src="https://github.com/user-attachments/assets/3461f692-3a1b-4f86-8a9c-5019f5ff9865" />

---
### 3. Session + Authentication Middleware 
#### - Sessions keeps users signed into their account
#### - serializeUser saves user ID in the session 
#### - deserializeUser retrieves the user for each request 
#### - ensureAuthed protects private pages like the user's profile and weather. 
<img width="475" height="220" alt="image" src="https://github.com/user-attachments/assets/fe062a76-306d-4778-a505-473ad92a686c" />
<img width="621" height="123" alt="image" src="https://github.com/user-attachments/assets/a54f4ccd-837c-43ca-9b96-bd707d849ba2" />
<img width="361" height="160" alt="image" src="https://github.com/user-attachments/assets/3aed814f-541a-4369-be68-1cb48793a2c1" />

---
### 4. The Login Page 
#### - UI where users choose the social media platform they want to use to login. 
#### - Buttons redirect to /auth/google or /auth/linkedin 
<img width="548" height="147" alt="image" src="https://github.com/user-attachments/assets/6b453d19-1f12-4973-b4f4-769a5afb0c2c" />

---
### 5. Profile Page 
#### - Displays the user's Google/Linkedin info
#### - Shows the user's info such as email, name, provider, etc. 
#### - Has the links to go to the weather dashboard or button to log out. 
<img width="695" height="707" alt="image" src="https://github.com/user-attachments/assets/d1857802-ce02-46fe-8e46-f44dd292448f" />

---
### 6. Weather Feature(CRUD API)
#### - Defines MongoDB collection structure
#### - Each weather record stores city, temperature, conditions, and timestamp
#### - Database layer of the CRUD system
<img width="659" height="490" alt="image" src="https://github.com/user-attachments/assets/b6183978-a7c5-4616-aa24-7181d83984a5" />

---
### 7. Weather Routes(CRUD Operations)
#### - Post - Create weather record using OpenWeather API
#### - Get - Read all stored weather records
#### - Put - Update an existing record(refresh weather)
#### - Delete - Remove city weather entry
<img width="613" height="525" alt="image" src="https://github.com/user-attachments/assets/c8d321b7-3140-4d39-8878-902804295508" />
<img width="463" height="210" alt="image" src="https://github.com/user-attachments/assets/0987d102-c37d-44d1-8b98-87d09c11eaec" />
<img width="599" height="328" alt="image" src="https://github.com/user-attachments/assets/a781b4c3-9ed4-4a18-8feb-e29b863b8f46" />
<img width="523" height="224" alt="image" src="https://github.com/user-attachments/assets/7e025525-4c7c-40c5-a7d7-9329748a3780" />

---
### 8. Weather Service 
#### - API call to OpenWeatherMap
#### - Used by POST + PUT routes
<img width="520" height="113" alt="image" src="https://github.com/user-attachments/assets/3bae028f-8865-46fe-8b69-9c14887e95f7" />

---
### 9. Data Validation 
#### - Ensures invalid data/input is not sent to the API
#### - Ensures that city names are required and string format. 
<img width="452" height="373" alt="image" src="https://github.com/user-attachments/assets/c9b49448-2d5e-4911-a7e5-bb4238b8d8f8" />

---
### 10. Swagger Documentation 
#### - Creates API documentation at /docs
#### - Shows endpoints for POST/GET/PUT/DELETE
<img width="719" height="394" alt="image" src="https://github.com/user-attachments/assets/543f6840-7c91-4998-b4f4-188892176ef1" />

---
### 11. Weather Dashboard UI
#### - Displays weather data from MongoDB
#### - Form to search for a city and save results 
#### - Shows history and buttons to Refresh(Update CRUD) and Delete(Delete CRUD)
<img width="602" height="599" alt="image" src="https://github.com/user-attachments/assets/3baeed53-bc46-46b5-9638-37bc91ba1a40" />

---
### 12. Testing CRUD Operations 
#### READ - You can see that the history table now contains the data that is stored in the MongoDB which means the READ operation carried out successfully. 
<img width="478" height="256" alt="Screenshot 2025-11-18 204535" src="https://github.com/user-attachments/assets/d1805ad7-89ef-4e06-b377-00047b0773fb" />

---
#### CREATE - Pull data for the city of Tallahassee and you can see it now appear in the table.
<img width="1265" height="475" alt="Screenshot 2025-11-18 205222" src="https://github.com/user-attachments/assets/f516f1ae-a1d7-456e-a892-244cdbe6d6e1" />

---
#### UPDATE - Compare this screenshot to the screenshot for CREATE and you can see the time updated. 
<img width="1279" height="510" alt="Screenshot 2025-11-18 205744" src="https://github.com/user-attachments/assets/e5cf4e6d-f33a-4538-a6ab-b88e62bfcb38" />

---
#### DELETE - Delete Tallahassee from the database and you can see it disappears from the table on the right. 
<img width="1271" height="617" alt="Screenshot 2025-11-18 210853" src="https://github.com/user-attachments/assets/cbdc88fc-22e2-4379-9fde-54cb4869361b" />

---
### Video DEMO
https://psu.mediaspace.kaltura.com/media/Mahima+Susan+Abrahams+Zoom+Meeting/1_h3luewpv




















