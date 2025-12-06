// public/js/weather.js

// ---- Shared helper used by both app + tests ----
export async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

// ---- Grab DOM elements ----
const statusEl = document.getElementById("status");
const latestCard = document.getElementById("latest-card");
const latestCityEl = document.getElementById("latest-city");
const latestTempEl = document.getElementById("latest-temp");
const latestCondEl = document.getElementById("latest-conditions");
const latestMetaEl = document.getElementById("latest-meta");
const historyBody = document.getElementById("history-body");
const cityInput = document.getElementById("city-input");
const searchForm = document.getElementById("search-form");

// Helper to show messages
function setStatus(message, type = "ok") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = "status " + type;
}

// Render the latest result card
function renderLatest(record) {
  if (!record || !latestCard) return;

  const city = record.city || record.name || "Unknown city";

  const temp =
    record.temperature ??
    record.tempC ??
    record.temp ??
    (record.main && record.main.temp) ??
    null;

  const condition =
    record.conditions ||
    record.description ||
    (record.weather && record.weather[0] && record.weather[0].description) ||
    "";

  const fetched =
    record.fetchedAt ||
    record.createdAt ||
    record.timestamp ||
    record.date ||
    null;

  latestCityEl.textContent = city;
  latestTempEl.textContent =
    temp !== null && temp !== undefined ? `${Math.round(temp)}°` : "N/A";
  latestCondEl.textContent = condition || "";
  latestMetaEl.textContent = fetched
    ? `Fetched at: ${new Date(fetched).toLocaleString()}`
    : "";

  latestCard.style.display = "block";
}

// Render the table rows
function renderHistory(records) {
  if (!historyBody) return;

  historyBody.innerHTML = "";
  if (!records || records.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "No weather data saved yet.";
    tr.appendChild(td);
    historyBody.appendChild(tr);
    return;
  }

  records.forEach((record) => {
    const tr = document.createElement("tr");

    const city =
      record.city || record.name || record.location || "Unknown";

    const temp =
      record.temperature ??
      record.tempC ??
      record.temp ??
      (record.main && record.main.temp) ??
      null;

    const condition =
      record.conditions ||
      record.description ||
      (record.weather && record.weather[0] && record.weather[0].description) ||
      "";

    const fetched =
      record.fetchedAt ||
      record.createdAt ||
      record.timestamp ||
      record.date ||
      null;

    const cityTd = document.createElement("td");
    cityTd.textContent = city;

    const tempTd = document.createElement("td");
    tempTd.textContent =
      temp !== null && temp !== undefined ? `${Math.round(temp)}°` : "N/A";

    const condTd = document.createElement("td");
    condTd.textContent = condition;

    const fetchedTd = document.createElement("td");
    fetchedTd.textContent = fetched
      ? new Date(fetched).toLocaleString()
      : "";

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions-cell";

    const refreshBtn = document.createElement("button");
    refreshBtn.className = "btn btn-secondary";
    refreshBtn.textContent = "Refresh";
    refreshBtn.onclick = () => refreshWeather(record._id, city);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteWeather(record._id);

    actionsTd.appendChild(refreshBtn);
    actionsTd.appendChild(deleteBtn);

    tr.appendChild(cityTd);
    tr.appendChild(tempTd);
    tr.appendChild(condTd);
    tr.appendChild(fetchedTd);
    tr.appendChild(actionsTd);

    historyBody.appendChild(tr);
  });
}

// Load existing weather history from your API
async function loadHistory() {
  try {
    setStatus("Loading history...");
    const records = await fetchJSON("/api/weather?limit=50");
    renderHistory(records);
    setStatus("History loaded.", "ok");
  } catch (err) {
    console.error(err);
    setStatus("Failed to load history: " + err.message, "error");
  }
}

// Handle submitting the city search form
async function handleSearch(event) {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    setStatus("Fetching weather for " + city + "...");
    const record = await fetchJSON(
      `/api/weather/fetch?city=${encodeURIComponent(city)}`,
      { method: "POST" }
    );

    renderLatest(record);
    await loadHistory(); // refresh table
    setStatus("Weather fetched and saved for " + city, "ok");
    cityInput.value = "";
  } catch (err) {
    console.error(err);
    setStatus("Failed to fetch weather: " + err.message, "error");
  }
}

// Delete a record by ID
async function deleteWeather(id) {
  if (!confirm("Delete this weather record?")) return;

  try {
    await fetchJSON(`/api/weather/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadHistory();
    setStatus("Record deleted.", "ok");
  } catch (err) {
    console.error(err);
    setStatus("Failed to delete: " + err.message, "error");
  }
}

// Refresh an existing record (re-fetch by city and overwrite)
async function refreshWeather(id, city) {
  try {
    setStatus("Refreshing weather for " + city + "...");
    await fetchJSON(`/api/weather/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const record = await fetchJSON(
      `/api/weather/fetch?city=${encodeURIComponent(city)}`,
      { method: "POST" }
    );
    renderLatest(record);
    await loadHistory();
    setStatus("Weather refreshed for " + city, "ok");
  } catch (err) {
    console.error(err);
    setStatus("Failed to refresh: " + err.message, "error");
  }
}

// Wire up events on page load (real app behaviour)
if (searchForm) {
  searchForm.addEventListener("submit", handleSearch);
}
document.addEventListener("DOMContentLoaded", loadHistory);

// ---- Exports for Jest tests ----
export {
  setStatus,
  renderLatest,
  renderHistory,
  handleSearch,
  deleteWeather,
};
