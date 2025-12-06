// tests/weather.ui.test.js
import { jest } from "@jest/globals";

function setupDOM() {
  document.body.innerHTML = `
    <div id="status"></div>

    <div id="latest-card" style="display:none">
      <div id="latest-city"></div>
      <div id="latest-temp"></div>
      <div id="latest-conditions"></div>
      <div id="latest-meta"></div>
    </div>

    <table>
      <tbody id="history-body"></tbody>
    </table>

    <form id="search-form">
      <input id="city-input" />
      <button type="submit">Fetch & Save</button>
    </form>
  `;
}

describe("Weather dashboard UI", () => {
  let setStatus;
  let renderLatest;
  let renderHistory;
  let handleSearch;
  let deleteWeather;

  // Helper to (re)load the module after we build the DOM
  async function loadModule() {
    const mod = await import("../public/js/weather.js");
    setStatus = mod.setStatus;
    renderLatest = mod.renderLatest;
    renderHistory = mod.renderHistory;
    handleSearch = mod.handleSearch;
    deleteWeather = mod.deleteWeather;
  }

  beforeEach(async () => {
    jest.resetModules();
    setupDOM();
    await loadModule();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. setStatus – OK state
  test("setStatus shows a normal message with class 'status ok'", () => {
    const statusEl = document.getElementById("status");

    setStatus("History loaded.", "ok");

    expect(statusEl.textContent).toBe("History loaded.");
    expect(statusEl.className).toBe("status ok");
  });

  // 2. setStatus – error state
  test("setStatus shows an error message with class 'status error'", () => {
    const statusEl = document.getElementById("status");

    setStatus("Failed to load history", "error");

    expect(statusEl.textContent).toBe("Failed to load history");
    expect(statusEl.className).toBe("status error");
  });

  // 3. renderLatest – normal record
  test("renderLatest shows the latest weather card", () => {
    const record = {
      city: "Philadelphia",
      temp: 9.3,
      description: "broken clouds",
      fetchedAt: "2025-11-18T22:10:00.000Z",
    };

    renderLatest(record);

    const latestCard = document.getElementById("latest-card");
    const cityEl = document.getElementById("latest-city");
    const tempEl = document.getElementById("latest-temp");
    const condEl = document.getElementById("latest-conditions");

    expect(latestCard.style.display).toBe("block");
    expect(cityEl.textContent).toBe("Philadelphia");
    expect(tempEl.textContent).toBe("9°"); // rounded
    expect(condEl.textContent).toBe("broken clouds");
  });

  // 4. renderLatest – missing temperature
  test("renderLatest falls back to 'N/A' when temperature is missing", () => {
    const record = {
      city: "Unknown City",
      description: "no data",
      fetchedAt: "2025-11-18T22:10:00.000Z",
    };

    renderLatest(record);

    const tempEl = document.getElementById("latest-temp");
    expect(tempEl.textContent).toBe("N/A");
  });

  // 5. renderHistory – empty list
  test("renderHistory shows a 'no data' row when there are no records", () => {
    const tbody = document.getElementById("history-body");

    renderHistory([]);

    expect(tbody.children.length).toBe(1);
    const row = tbody.children[0];
    expect(row.textContent).toContain("No weather data saved yet.");
  });

  // 6. renderHistory – multiple records
  test("renderHistory renders one table row per record", () => {
    const records = [
      {
        _id: "1",
        city: "New York",
        temp: 7,
        description: "overcast clouds",
        fetchedAt: "2025-11-18T21:00:00.000Z",
      },
      {
        _id: "2",
        city: "Tallahassee",
        temp: 16,
        description: "clear sky",
        fetchedAt: "2025-11-18T21:30:00.000Z",
      },
    ];

    const tbody = document.getElementById("history-body");
    renderHistory(records);

    // 2 data rows
    expect(tbody.querySelectorAll("tr").length).toBe(2);
    expect(tbody.textContent).toContain("New York");
    expect(tbody.textContent).toContain("Tallahassee");
  });

  // 7. renderHistory – adds Refresh/Delete buttons
  test("renderHistory adds Refresh and Delete buttons for each row", () => {
    const records = [
      {
        _id: "1",
        city: "New York",
        temp: 7,
        description: "overcast clouds",
        fetchedAt: "2025-11-18T21:00:00.000Z",
      },
    ];

    renderHistory(records);

    const refreshBtn = document.querySelector("button.btn.btn-secondary");
    const deleteBtn = document.querySelector("button.btn.btn-danger");

    expect(refreshBtn).not.toBeNull();
    expect(refreshBtn.textContent).toBe("Refresh");

    expect(deleteBtn).not.toBeNull();
    expect(deleteBtn.textContent).toBe("Delete");
  });

  // 8. handleSearch – happy path (user interaction + success)
  test("handleSearch fetches weather and updates status on success", async () => {
    const cityInput = document.getElementById("city-input");
    const statusEl = document.getElementById("status");

    cityInput.value = "Paris";

    // First call: POST /fetch
    // Second call: GET /api/weather
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          city: "Paris",
          temp: 10,
          description: "cloudy",
          fetchedAt: "2025-11-18T22:00:00.000Z",
        }),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        text: async () => "",
      });

    const fakeEvent = { preventDefault: jest.fn() };

    await handleSearch(fakeEvent);

    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(statusEl.textContent).toContain("Weather fetched and saved for Paris");
    expect(cityInput.value).toBe(""); // cleared
  });

  // 9. handleSearch – error path
  test("handleSearch shows an error message when the API call fails", async () => {
    const cityInput = document.getElementById("city-input");
    const statusEl = document.getElementById("status");

    cityInput.value = "Paris";

    // First call fails (POST /fetch)
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      text: async () => "Something went wrong",
    });

    const fakeEvent = { preventDefault: jest.fn() };

    await handleSearch(fakeEvent);

    expect(statusEl.textContent).toContain("Failed to fetch weather");
  });

  // 10. deleteWeather – user cancels
  test("deleteWeather does nothing when the user cancels confirm dialog", async () => {
    global.confirm = jest.fn(() => false);
    global.fetch = jest.fn();

    await deleteWeather("12345");

    // fetchJSON should never be called because confirm returned false
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
