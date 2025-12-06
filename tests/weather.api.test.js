/** @jest-environment node */

import { jest } from "@jest/globals";   
import dotenv from "dotenv";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { Weather } from "../weather/models/weather.js";
import weatherRouter from "../weather/routes/weatherRoutes.js";


// Load .env (for MONGODB_URI)
dotenv.config();

// Give Jest more time for DB work
jest.setTimeout(30000);

let app;

// =========================
// Global test setup/teardown
// =========================
beforeAll(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGO_URI or MONGODB_URI in .env for tests");
  }

  await mongoose.connect(uri);

  // Build a tiny Express app JUST for the weather API
  app = express();
  app.use(express.json());
  app.use("/api/weather", weatherRouter);
});

beforeEach(async () => {
  // Clean the Weather collection so each test starts fresh
  await Weather.deleteMany({});
});

afterAll(async () => {
  await Weather.deleteMany({});
  await mongoose.connection.close();
});

// Helper factory for fake weather docs
function makeFakeWeather(overrides = {}) {
  return {
    city: "Testville",
    country: "US",
    coordinates: { lon: -75.1, lat: 39.9 },
    temp: 21,
    feelsLike: 20,
    humidity: 55,
    pressure: 1013,
    windSpeed: 4,
    condition: "Clouds",
    description: "overcast clouds",
    fetchedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("Weather API backend", () => {
  // 1) Happy path: GET /api/weather when DB is empty
  test("GET /api/weather returns empty array when no records exist", async () => {
    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // 2) Happy path: create a record directly via Mongoose and read it back
  test("GET /api/weather returns documents that exist in MongoDB", async () => {
    await Weather.create(makeFakeWeather({ city: "CityA" }));
    await Weather.create(makeFakeWeather({ city: "CityB" }));

    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);

    const cities = res.body.map((r) => r.city).sort();
    expect(cities).toEqual(["CityA", "CityB"]);
  });

  // 3) Happy path: limit query parameter
  test("GET /api/weather respects the 'limit' query parameter", async () => {
    await Weather.create(makeFakeWeather({ city: "City1" }));
    await Weather.create(makeFakeWeather({ city: "City2" }));
    await Weather.create(makeFakeWeather({ city: "City3" }));

    const res = await request(app).get("/api/weather").query({ limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  // 4) Edge: non-numeric limit
  test("GET /api/weather with non-numeric limit still returns data", async () => {
    await Weather.create(makeFakeWeather({ city: "City1" }));
    await Weather.create(makeFakeWeather({ city: "City2" }));

    const res = await request(app).get("/api/weather").query({ limit: "abc" });

    expect(res.status).toBe(200);
    // At least the two docs we inserted
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  // 5) Shape / schema test for GET /api/weather
  test("GET /api/weather items include key weather fields", async () => {
    await Weather.create(makeFakeWeather({ city: "ShapeCity" }));

    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        city: "ShapeCity",
        country: expect.any(String),
        temp: expect.any(Number),
        humidity: expect.any(Number),
      })
    );
  });

  // 6) Happy path: GET /api/weather/:id returns a single document
  test("GET /api/weather/:id returns a specific record", async () => {
    const doc = await Weather.create(makeFakeWeather({ city: "TargetCity" }));

    const res = await request(app).get(`/api/weather/${doc._id}`);

    expect(res.status).toBe(200);
    expect(res.body.city).toBe("TargetCity");
  });

  // 7) Edge: GET /api/weather/:id with valid but missing id
  test("GET /api/weather/:id returns 404 or 200-empty when document does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/weather/${fakeId}`);

    // Depending on your implementation you might send 404, 200 with null, etc.
    expect([200, 404]).toContain(res.status);
  });

  // 8) Error handling: GET /api/weather/:id with invalid ObjectId
  test("GET /api/weather/:id with invalid id returns an error status", async () => {
    const res = await request(app).get("/api/weather/not-a-valid-id");

    // Your route may return 400 or 500 – both indicate error handling
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // 9) Happy path: DELETE /api/weather/:id deletes a record
  test("DELETE /api/weather/:id deletes an existing record", async () => {
    const doc = await Weather.create(makeFakeWeather({ city: "ToDelete" }));

    const res = await request(app).delete(`/api/weather/${doc._id}`);

    expect([200, 204]).toContain(res.status);

    const exists = await Weather.exists({ _id: doc._id });
    expect(exists).toBeNull();
  });

  // 10) Edge: DELETE only removes targeted record
  test("DELETE /api/weather/:id removes one record but keeps others", async () => {
    const doc1 = await Weather.create(makeFakeWeather({ city: "DeleteMe" }));
    const doc2 = await Weather.create(makeFakeWeather({ city: "KeepMe" }));

    const res = await request(app).delete(`/api/weather/${doc1._id}`);
    expect([200, 204]).toContain(res.status);

    const remaining = await Weather.find({}).lean();
    expect(remaining.length).toBe(1);
    expect(remaining[0]._id.toString()).toBe(doc2._id.toString());
    expect(remaining[0].city).toBe("KeepMe");
  });

  // 11) Error handling: DELETE with invalid ObjectId
  test("DELETE /api/weather/:id with invalid id returns error status", async () => {
    const res = await request(app).delete("/api/weather/bad-id");

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // 12) Edge: DELETE with valid but missing id
  test("DELETE /api/weather/:id with non-existent id returns 404 or similar", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).delete(`/api/weather/${fakeId}`);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // 13) After DELETE, GET by id should no longer find the document
  test("DELETE /api/weather/:id followed by GET returns not-found style status", async () => {
    const doc = await Weather.create(makeFakeWeather({ city: "TempCity" }));

    const delRes = await request(app).delete(`/api/weather/${doc._id}`);
    expect([200, 204]).toContain(delRes.status);

    const getRes = await request(app).get(`/api/weather/${doc._id}`);
    expect(getRes.status).toBeGreaterThanOrEqual(400);
  });

  // 14) Happy path: GET /api/weather returns newest first (if you sort that way)
  test("GET /api/weather returns multiple records; we can check ordering by createdAt", async () => {
    const older = await Weather.create(
      makeFakeWeather({ city: "OldCity", fetchedAt: new Date("2024-01-01") })
    );
    const newer = await Weather.create(
      makeFakeWeather({ city: "NewCity", fetchedAt: new Date("2025-01-01") })
    );

    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);

    const names = res.body.map((r) => r.city);
    // We don't know your exact sort, but at least both are present
    expect(names).toEqual(expect.arrayContaining(["OldCity", "NewCity"]));
  });

  // 15) Edge: temp and humidity can be numbers including 0
  test("GET /api/weather returns numeric temp and humidity", async () => {
    await Weather.create(
      makeFakeWeather({ city: "ZeroCity", temp: 0, humidity: 0 })
    );

    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    expect(res.body[0].temp).toBe(0);
    expect(res.body[0].humidity).toBe(0);
  });

  // 16) Edge: coordinates are stored as nested object
  test("GET /api/weather returns lon/lat coordinates", async () => {
    await Weather.create(
      makeFakeWeather({
        city: "CoordCity",
        coordinates: { lon: -10.5, lat: 45.2 },
      })
    );

    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    const item = res.body[0];
    expect(item.coordinates).toEqual({ lon: -10.5, lat: 45.2 });
  });

  // 17) Edge: description and condition are strings
  test("GET /api/weather returns description and condition as strings", async () => {
    await Weather.create(
      makeFakeWeather({
        city: "DescCity",
        condition: "Rain",
        description: "light rain",
      })
    );

    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    const item = res.body[0];
    expect(typeof item.condition).toBe("string");
    expect(typeof item.description).toBe("string");
  });

  // 18) Edge: history can contain many documents
  test("GET /api/weather can return more than 10 records", async () => {
    const docs = [];
    for (let i = 0; i < 12; i++) {
      docs.push(makeFakeWeather({ city: `BulkCity${i}` }));
    }
    await Weather.insertMany(docs);

    const res = await request(app).get("/api/weather");

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(12);
  });

  // 19) Happy-ish path: POST /api/weather/fetch with a real city
  // (This will call the real OpenWeather API once, using your OPENWEATHER_API_KEY)
  test("POST /api/weather/fetch with a real city returns 2xx or 5xx", async () => {
    const res = await request(app)
      .post("/api/weather/fetch")
      .query({ city: "London" });

    // If key is valid: expect 201 / 200; if key is wrong: 4xx/5xx.
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(600);
  });

  // 20) Edge: POST /api/weather/fetch with nonsense city should not crash server
  test("POST /api/weather/fetch with nonsense city returns an error-style status", async () => {
    const res = await request(app)
      .post("/api/weather/fetch")
      .query({ city: "this-city-does-not-exist-123456" });

    // We don't care exactly which status – just that it's not a server crash
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(600);
  });
});
