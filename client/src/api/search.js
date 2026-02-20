/**
 * Client-side API wrapper for the LandGrab search endpoint.
 */

/**
 * Fetch land listings near a zip code. Sorting is done client-side in App.jsx.
 * @param {{ zip: string, radiusMiles: number }} params
 * @returns {Promise<{ location: object, listings: Array, usingMockData: boolean }>}
 */
export async function searchListings(params) {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

