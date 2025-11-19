import mongoose from "mongoose";

// Define the structure of our weather document
const WeatherSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, index: true }, // name of the city
    country: { type: String, required: true }, // country code (e.g., US)
    coordinates: {
      lon: { type: Number, required: true }, // longitude
      lat: { type: Number, required: true },  // latitude
    },
    temp: Number,         // temperature
    feelsLike: Number,    // feels-like temperature
    humidity: Number,     // %
    pressure: Number,     // hPa
    windSpeed: Number,    // wind speed
    condition: String,    // e.g., "Clouds"
    description: String,  // e.g., "broken clouds"
    fetchedAt: { type: Date, default: Date.now }, // when data was fetched
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Create a Mongoose model called "Weather" using the schema above
export const Weather = mongoose.model("Weather", WeatherSchema);
