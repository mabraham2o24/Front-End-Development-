// ======================
// Imports
// ======================
import express from "express";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import OAuth2Strategy from "passport-oauth2";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";

import weatherRouter from "./weather/routes/weatherRoutes.js";
import { swaggerUi, swaggerSpec } from "./weather/swagger.js";

dotenv.config();

// ======================
// __dirname fix for ES modules
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================
// Initialize app
// ======================
const app = express();

// ✅ Cloud Run / reverse proxy support
app.set("trust proxy", 1);

// Simple in-memory "DB" (demo only) for social-login users
const users = new Map();

// ======================
// View engine & static files
// ======================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ======================
// Global middleware
// ======================
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ======================
// Sessions
// ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Cloud Run is HTTPS in production
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ======================
// Session <-> user mapping
// ======================
passport.serializeUser((user, done) => done(null, user._key));
passport.deserializeUser((key, done) => done(null, users.get(key) || null));

/* =================== GOOGLE (OAuth 2.0) =================== */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // set on Cloud Run
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const key = `google|${profile.id}`;
        const user = {
          _key: key,
          provider: "google",
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails?.map((e) => e.value) || [],
          photos: profile.photos?.map((p) => p.value) || [],
        };
        users.set(key, user);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/* =================== LINKEDIN (OAuth2 + OIDC userinfo) =================== */
/* Uses OAuth 2.0 to get an access token, then calls LinkedIn's OIDC userinfo. */
passport.use(
  "linkedin",
  new OAuth2Strategy(
    {
      authorizationURL: "https://www.linkedin.com/oauth/v2/authorization",
      tokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL, // set on Cloud Run
      state: true,
    },
    async (accessToken, _refreshToken, _profile, done) => {
      try {
        const resp = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!resp.ok) {
          const text = await resp.text();
          return done(
            new Error(`LinkedIn userinfo failed: ${resp.status} ${text}`)
          );
        }

        const data = await resp.json();

        const id = data.sub || data.id;
        if (!id) return done(new Error("LinkedIn userinfo missing 'sub'"));

        const displayName =
          data.name ||
          `${data.given_name || ""} ${data.family_name || ""}`.trim() ||
          "LinkedIn User";

        const emails = [];
        if (data.email) emails.push(data.email);

        const photos = [];
        if (data.picture) photos.push(data.picture);

        const key = `linkedin|${id}`;
        const user = {
          _key: key,
          provider: "linkedin",
          id,
          displayName,
          emails,
          photos,
        };

        users.set(key, user);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ======================
// Auth guard
// ======================
function ensureAuthed(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// ======================
// Health check (Monitoring)
// ======================
app.get("/health", (_req, res) => res.status(200).send("ok"));

// ======================
// Routes (Pages)
// ======================
app.get("/", (req, res) => res.render("index", { user: req.user }));

app.get("/profile", ensureAuthed, (req, res) =>
  res.render("profile", { user: req.user })
);

app.get("/weather", ensureAuthed, (req, res) =>
  res.render("weather", { user: req.user })
);

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => res.redirect("/"));
  });
});

// ---- Google ----
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/error" }),
  (_req, res) => res.redirect("/profile")
);

// ---- LinkedIn ----
app.get(
  "/auth/linkedin",
  passport.authenticate("linkedin", { scope: ["openid", "profile", "email"] })
);

app.get("/auth/linkedin/callback", (req, res, next) => {
  passport.authenticate("linkedin", (err, user, info) => {
    if (err) {
      console.error("LinkedIn auth error:", err);
      return res.status(500).render("error", { message: String(err) });
    }
    if (!user) {
      console.error("LinkedIn auth failed:", info);
      return res
        .status(401)
        .render("error", { message: (info && info.message) || "Login failed." });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect("/profile");
    });
  })(req, res, next);
});

app.get("/error", (_req, res) =>
  res.status(401).render("error", { message: "Login failed." })
);

// ======================
// Weather API + Swagger
// ======================
// All /api/weather endpoints require login
app.use("/api/weather", ensureAuthed, weatherRouter);

// Swagger docs (public, for demo)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ======================
// Start server + Mongo
// ======================
const PORT = Number(process.env.PORT) || 8080;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Export app so Supertest/Jest can import it
export default app;

if (process.env.NODE_ENV !== "test") {
  // Start listening immediately so Cloud Run health checks pass
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`📚 Swagger docs at /docs`);
  });

  // Connect to Mongo AFTER server starts (don’t crash container if it fails)
  (async () => {
    try {
      if (!MONGO_URI) throw new Error("Missing MONGO_URI or MONGODB_URI in env");
      await mongoose.connect(MONGO_URI);
      console.log("✅ Connected to MongoDB");
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err.message || err);
    }
  })();
}
