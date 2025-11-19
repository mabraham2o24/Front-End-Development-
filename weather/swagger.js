// src/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.2",
    info: {
      title: "Weather API",
      version: "1.0.0",
      description: "CRUD API over MongoDB weather documents with OpenWeather integration.",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
    apis: ["weather/routes/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };
