/**
 * Geocode Service
 * Uses Nominatim (OpenStreetMap) to convert a US zip code to lat/lon.
 * Completely free — no API key or account required.
 */

/**
 * Given a 5-digit US zip code, return { lat, lon, displayName }.
 * Throws if the zip code cannot be resolved.
 * @param {string} zip
 * @returns {Promise<{ lat: number, lon: number, displayName: string }>}
 */
export async function geocodeZip(zip) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('postalcode', zip);
  url.searchParams.set('countrycodes', 'us');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      // Nominatim requires a descriptive User-Agent per their usage policy
      'User-Agent': 'LandGrab-App/1.0 (land-search-tool)',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`);
  }

  const results = await response.json();

  if (!results || results.length === 0) {
    throw new Error(`Could not geocode zip code: ${zip}`);
  }

  const { lat, lon, display_name } = results[0];
  return {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    displayName: display_name,
  };
}

