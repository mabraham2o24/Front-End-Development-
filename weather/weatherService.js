// src/weatherService.js
import axios from "axios";

/**
 * Fetch current weather for a city from OpenWeatherMap and normalize fields
 * so the rest of our app uses a consistent shape.
 */
export async function fetchWeather({ city, apiKey }) {
  const url = "https://api.openweathermap.org/data/2.5/weather";
  const params = { q: city, appid: apiKey, units: "metric" };

  const { data } = await axios.get(url, { params });

  return {
    city: data.name,
    country: data.sys?.country ?? "NA",
    coordinates: {
      lon: data.coord?.lon ?? 0,
      lat: data.coord?.lat ?? 0,
    },
    temp: data.main?.temp ?? 0,
    feelsLike: data.main?.feels_like ?? 0,
    humidity: data.main?.humidity ?? 0,
    pressure: data.main?.pressure ?? 0,
    windSpeed: data.wind?.speed ?? 0,
    condition: data.weather?.[0]?.main ?? "Unknown",
    description: data.weather?.[0]?.description ?? "Unknown",
    fetchedAt: new Date(),
  };
}
