// src/validation.js
import { z } from "zod";

export const weatherSchema = z.object({
  city: z.string(),
  country: z.string().min(2), // e.g., "US"
  coordinates: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  temp: z.number(),
  feelsLike: z.number(),
  humidity: z.number().int(),
  pressure: z.number().int(),
  windSpeed: z.number(),
  condition: z.string(),   // e.g., "Clouds"
  description: z.string(), // e.g., "broken clouds"
  fetchedAt: z.date(),
});
