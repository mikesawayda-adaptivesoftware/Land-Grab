/**
 * Client-side API wrapper for the LandGrab search endpoint.
 */

/**
 * Fetch property listings near a zip code. Sorting and secondary filters are
 * done client-side in App.jsx — only homeType triggers a new server request.
 * @param {{ zip: string, radiusMiles: number, homeType?: string }} params
 * @returns {Promise<{ location: object, listings: Array, usingMockData: boolean, homeType: string }>}
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

