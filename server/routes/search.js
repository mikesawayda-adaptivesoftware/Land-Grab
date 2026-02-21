import express from 'express';
import { geocodeZip } from '../services/geocode.js';
import { fetchListings } from '../services/listings.js';

const router = express.Router();

const VALID_HOME_TYPES = new Set([
  'Lots-Land',
  'Single Family',
  'Multi-Family',
  'Condos',
  'Townhomes',
]);

/**
 * POST /api/search
 * Body: { zip: string, radiusMiles: number, homeType?: string }
 * Returns: { location: {...}, listings: [...], usingMockData: boolean, homeType: string }
 *
 * Sorting and secondary filters are performed client-side — only homeType
 * changes trigger a new request to this endpoint.
 */
router.post('/', async (req, res) => {
  const { zip, radiusMiles, homeType } = req.body;

  // --- Validate input ---
  if (!zip || !/^\d{5}$/.test(zip.trim())) {
    return res.status(400).json({ error: 'Please provide a valid 5-digit US zip code.' });
  }
  const radius = parseFloat(radiusMiles);
  if (isNaN(radius) || radius <= 0 || radius > 500) {
    return res.status(400).json({ error: 'Radius must be between 1 and 500 miles.' });
  }

  const resolvedHomeType =
    homeType && VALID_HOME_TYPES.has(homeType) ? homeType : 'Lots-Land';

  try {
    // 1. Geocode the zip code
    const location = await geocodeZip(zip.trim());

    // 2. Fetch listings (unsorted — client will sort/filter)
    const usingMockData = !process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here';
    const listings = await fetchListings(location.lat, location.lon, radius, resolvedHomeType);

    return res.json({
      location,
      listings,
      usingMockData,
      homeType: resolvedHomeType,
    });
  } catch (err) {
    console.error('[search] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Search failed. Please try again.' });
  }
});

export default router;

