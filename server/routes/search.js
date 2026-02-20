import express from 'express';
import { geocodeZip } from '../services/geocode.js';
import { fetchListings } from '../services/listings.js';

const router = express.Router();

/**
 * POST /api/search
 * Body: { zip: string, radiusMiles: number }
 * Returns: { location: {...}, listings: [...], usingMockData: boolean }
 *
 * Sorting is performed client-side so changing sort criteria never requires
 * a round-trip back to the server.
 */
router.post('/', async (req, res) => {
  const { zip, radiusMiles } = req.body;

  // --- Validate input ---
  if (!zip || !/^\d{5}$/.test(zip.trim())) {
    return res.status(400).json({ error: 'Please provide a valid 5-digit US zip code.' });
  }
  const radius = parseFloat(radiusMiles);
  if (isNaN(radius) || radius <= 0 || radius > 500) {
    return res.status(400).json({ error: 'Radius must be between 1 and 500 miles.' });
  }

  try {
    // 1. Geocode the zip code
    const location = await geocodeZip(zip.trim());

    // 2. Fetch listings (unsorted — client will sort)
    const usingMockData = !process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here';
    const listings = await fetchListings(location.lat, location.lon, radius);

    return res.json({
      location,
      listings,
      usingMockData,
    });
  } catch (err) {
    console.error('[search] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Search failed. Please try again.' });
  }
});

export default router;

