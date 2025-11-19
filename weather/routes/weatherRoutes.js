// src/routes/weatherRoutes.js
import { Router } from "express";
import createError from "http-errors";
import { Weather } from "../models/weather.js";
import { weatherSchema } from "../validation.js";
import { fetchWeather } from "../weatherService.js";

const router = Router();

/**
 * @openapi
 * /api/weather:
 *   get:
 *     summary: Retrieve all weather records.
 *     description: Returns a list of weather entries from MongoDB, optionally filtered by city.
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter results by city name.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit number of results.
 *     responses:
 *       200:
 *         description: List of weather records retrieved successfully.
 *   post:
 *     summary: Add new weather data.
 *     description: Create a weather record either manually or by fetching from OpenWeather using a city name.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *                 description: City name to fetch from OpenWeather.
 *               manual:
 *                 type: boolean
 *                 description: If true, expects full weather payload instead of fetching.
 *     responses:
 *       201:
 *         description: Weather record created successfully.
 */
router.get("/", async (req, res, next) => {
  try {
    const { city, limit = 50 } = req.query;
    const query = city ? { city } : {};
    const docs = await Weather.find(query)
      .sort({ fetchedAt: -1 })
      .limit(Number(limit));
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { manual, ...rest } = req.body;

    let candidate;
    if (manual) {
      // Client is sending full weather payload to validate and insert
      candidate = rest;
    } else {
      // Client only sent a city name - fetch from OpenWeather
      const city = rest.city || process.env.DEFAULT_CITY || "Philadelphia";
      const { OPENWEATHER_API_KEY } = process.env;

      if (!OPENWEATHER_API_KEY) {
        throw createError(500, "Missing OPENWEATHER_API_KEY");
      }

      candidate = await fetchWeather({ city, apiKey: OPENWEATHER_API_KEY });
    }

    const parsed = weatherSchema.parse(candidate);
    const created = await Weather.create(parsed);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/weather/{id}:
 *   get:
 *     summary: Get a single weather record by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB document ID.
 *     responses:
 *       200:
 *         description: Weather record retrieved successfully.
 *       404:
 *         description: Weather record not found.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const doc = await Weather.findById(req.params.id);
    if (!doc) {
      throw createError(404, "Weather record not found");
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/weather/{id}:
 *   put:
 *     summary: Update a weather record by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Weather"
 *     responses:
 *       200:
 *         description: Weather record updated successfully.
 *       404:
 *         description: Weather record not found.
 */
router.put("/:id", async (req, res, next) => {
  try {
    const parsed = weatherSchema.parse(req.body);
    const updated = await Weather.findByIdAndUpdate(req.params.id, parsed, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw createError(404, "Weather record not found");
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/weather/{id}:
 *   delete:
 *     summary: Delete a weather record by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weather record deleted successfully.
 *       404:
 *         description: Weather record not found.
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await Weather.findByIdAndDelete(req.params.id);
    if (!removed) {
      throw createError(404, "Weather record not found");
    }
    res.json({ deleted: true, id: removed._id });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/weather/fetch?city=Philadelphia
 * Convenience endpoint: fetch from OpenWeather by query param and save.
 */
router.post("/fetch", async (req, res, next) => {
  try {
    const city = req.query.city || process.env.DEFAULT_CITY || "Philadelphia";
    const { OPENWEATHER_API_KEY } = process.env;
    if (!OPENWEATHER_API_KEY) throw createError(500, "Missing OPENWEATHER_API_KEY");

    const normalized = await fetchWeather({ city, apiKey: OPENWEATHER_API_KEY });
    const parsed = weatherSchema.parse(normalized);
    const saved = await Weather.create(parsed);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

export default router;
