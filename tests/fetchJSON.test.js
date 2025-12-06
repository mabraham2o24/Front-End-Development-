import { jest } from "@jest/globals";
import { fetchJSON } from "../public/js/utils/fetchJSON.js";

// Mock the global fetch() used inside fetchJSON
global.fetch = jest.fn();

describe("fetchJSON()", () => {
  test("returns JSON when the response is OK", async () => {
    const mockData = { message: "success" };

    // fake a successful fetch() response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchJSON("/fake-url");

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test("throws an error when response is NOT ok", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Bad Request",
    });

    await expect(fetchJSON("/fake")).rejects.toThrow("Bad Request");
  });
});
