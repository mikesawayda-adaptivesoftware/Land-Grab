/**
 * Listings Service
 * Fetches land listings from the ZLLW Working API (Zillow data via RapidAPI).
 *
 * Endpoint used: GET /search/bycoordinates
 *   - Accepts lat, longitude, radius, homeType, listingStatus, page
 *   - homeType=Lots-Land filters to land/lot results natively
 *   - Data sourced from Zillow — very comprehensive US coverage
 *
 * Free tier: BASIC plan at $0.00/mo.
 * Sign up at https://rapidapi.com and subscribe to "ZLLW Working API" (Basic/Free plan).
 * Set RAPIDAPI_KEY in your .env file.
 */

const RAPIDAPI_HOST = 'zllw-working-api.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/search/bycoordinates`;

// How many result pages to fetch (each page has ~40 listings).
// Increase for wider searches; keep low to stay in free-tier limits.
const MAX_PAGES = 3;

/**
 * Haversine formula — returns distance in miles between two lat/lon points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Normalise a raw ZLLW/Zillow listing into our standard shape.
 *
 * The ZLLW API returns each search result as:
 *   { property: { zpid, address, location, price, lotSizeWithUnit, ... }, resultType: "property" }
 *
 * This function accepts either the wrapper object OR the inner property object directly.
 */
function normaliseListing(rawOrWrapper, originLat, originLon) {
  // Unwrap the { property, resultType } envelope if present
  const raw = rawOrWrapper?.property ?? rawOrWrapper;

  // --- Price ---
  // ZLLW: raw.price = { value: 225000, ... }
  let price = null;
  if (raw.price != null) {
    if (typeof raw.price === 'object' && raw.price.value != null) {
      price = parseFloat(raw.price.value);
    } else {
      price = parseFloat(String(raw.price).replace(/[^0-9.]/g, ''));
    }
  }

  // --- Acreage ---
  // ZLLW: raw.lotSizeWithUnit = { lotSize: 1742.4, lotSizeUnit: "squareFeet" }
  // Older/fallback fields: lotAreaValue/lotAreaUnit, lotSizeAcres, lotSizeSquareFeet
  let acreage = null;
  if (raw.lotSizeWithUnit?.lotSize != null && raw.lotSizeWithUnit.lotSize > 0) {
    const unit = (raw.lotSizeWithUnit.lotSizeUnit || 'squareFeet').toLowerCase();
    acreage =
      unit === 'acres' || unit === 'acre'
        ? parseFloat(raw.lotSizeWithUnit.lotSize)
        : parseFloat(raw.lotSizeWithUnit.lotSize) / 43560;
  } else if (raw.lotAreaValue != null && raw.lotAreaValue > 0) {
    const unit = (raw.lotAreaUnit || 'sqft').toLowerCase();
    acreage =
      unit === 'acres' || unit === 'acre'
        ? parseFloat(raw.lotAreaValue)
        : parseFloat(raw.lotAreaValue) / 43560;
  } else if (raw.lotSizeAcres != null) {
    acreage = parseFloat(raw.lotSizeAcres);
  } else if (raw.lotSizeSquareFeet != null && raw.lotSizeSquareFeet > 0) {
    acreage = parseFloat(raw.lotSizeSquareFeet) / 43560;
  }

  // --- Price Per Acre ---
  const pricePerAcre =
    price != null && acreage != null && acreage > 0
      ? Math.round(price / acreage)
      : null;

  // --- Coordinates & Distance ---
  // ZLLW: raw.location = { latitude: 40.6, longitude: -74.1 }
  const listingLat =
    raw.location?.latitude != null
      ? parseFloat(raw.location.latitude)
      : raw.latitude != null
        ? parseFloat(raw.latitude)
        : null;
  const listingLon =
    raw.location?.longitude != null
      ? parseFloat(raw.location.longitude)
      : raw.longitude != null
        ? parseFloat(raw.longitude)
        : null;
  const distanceMiles =
    listingLat != null && listingLon != null
      ? parseFloat(
          haversineDistance(originLat, originLon, listingLat, listingLon).toFixed(2)
        )
      : null;

  // --- Address ---
  // ZLLW: raw.address = { streetAddress, city, state, zipcode }
  let address = 'Unknown Address';
  const addrObj = raw.address;
  if (addrObj) {
    if (typeof addrObj === 'string') {
      address = addrObj;
    } else {
      address = [addrObj.streetAddress, addrObj.city, addrObj.state, addrObj.zipcode]
        .filter(Boolean)
        .join(', ');
    }
  } else if (raw.formattedAddress) {
    address = raw.formattedAddress;
  }

  const city = addrObj?.city || raw.city || '';
  const state = addrObj?.state || raw.state || '';
  const zipCode = addrObj?.zipcode || addrObj?.zipCode || raw.zipCode || '';

  // --- Days on Market ---
  // ZLLW: raw.daysOnZillow
  const daysOnMarket =
    raw.daysOnZillow != null
      ? parseInt(raw.daysOnZillow)
      : raw.daysOnMarket != null
        ? parseInt(raw.daysOnMarket)
        : null;

  // --- Photo ---
  // ZLLW: raw.media.propertyPhotoLinks.mediumSizeLink
  const photoUrl =
    raw.media?.propertyPhotoLinks?.mediumSizeLink ||
    raw.imgSrc ||
    raw.photoUrl ||
    null;

  // --- Zillow listing URL ---
  // hdpView.hdpUrl is an internal app URL — use zpid to build a proper public URL instead
  const zpid = raw.zpid || raw.id;
  const url = zpid
    ? `https://www.zillow.com/homedetails/${zpid}_zpid/`
    : raw.detailUrl
      ? `https://www.zillow.com${raw.detailUrl}`
      : null;

  return {
    id: zpid || address,
    address,
    city,
    state,
    zipCode,
    price,
    acreage: acreage != null ? parseFloat(acreage.toFixed(4)) : null,
    pricePerAcre,
    propertyType: raw.propertyType || raw.homeType || 'land',
    status: raw.listing?.listingStatus || raw.listingStatus || raw.status || 'forSale',
    daysOnMarket,
    lat: listingLat,
    lon: listingLon,
    distanceMiles,
    url,
    photoUrl,
  };
}

/**
 * Fetch a single page of results from ZLLW API.
 */
async function fetchPage(lat, lon, radiusMiles, page, apiKey) {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('radius', radiusMiles);
  url.searchParams.set('page', page);
  url.searchParams.set('sortOrder', 'Homes_for_you');
  url.searchParams.set('listingStatus', 'For_Sale');
  url.searchParams.set('bed_min', 'No_Min');
  url.searchParams.set('bed_max', 'No_Max');
  url.searchParams.set('bathrooms', 'Any');
  url.searchParams.set('homeType', 'Lots-Land');
  url.searchParams.set('maxHOA', 'Any');
  url.searchParams.set('listingType', 'By_Agent');
  url.searchParams.set('listingTypeOptions', 'Agent listed,New Construction,Fore-closures,Auctions');
  url.searchParams.set('parkingSpots', 'Any');
  url.searchParams.set('mustHaveBasement', 'No');
  url.searchParams.set('daysOnZillow', 'Any');
  url.searchParams.set('soldInLast', 'Any');

  console.log('[listings] Fetching:', url.toString().replace(apiKey, '***'));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('[listings] ZLLW API error:', response.status, body);
    throw new Error(`Listings API error: ${response.status}`);
  }

  const data = await response.json();

  // Log the top-level keys so we can see the real response shape
  console.log('[listings] Response top-level keys:', Object.keys(data));
  if (Object.keys(data).length <= 5) {
    // Small response — log it fully to diagnose
    console.log('[listings] Full response:', JSON.stringify(data, null, 2).slice(0, 2000));
  }

  // ZLLW response shape:
  //   { message, searchResults: [ { property: {...}, resultType: "property" }, ... ],
  //     resultsCount: { totalMatchingCount, ... }, pagesInfo: { totalPages, ... } }
  const listings =
    data.searchResults ||
    data.props ||
    data.results ||
    data.listings ||
    data.data ||
    (Array.isArray(data) ? data : []);

  const totalCount =
    data.resultsCount?.totalMatchingCount ||
    data.totalResultCount ||
    data.totalCount ||
    data.total ||
    data.count ||
    listings.length;

  const totalPages = data.pagesInfo?.totalPages ?? null;

  console.log(
    `[listings] Page ${page}: found ${listings.length} items` +
    ` (total reported: ${totalCount}, total pages: ${totalPages})`
  );

  return { listings, totalCount, totalPages };
}

/**
 * Fetch land listings near a lat/lon point within radiusMiles.
 * Returns a normalised array of listing objects.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusMiles
 * @returns {Promise<Array>}
 */
export async function fetchListings(lat, lon, radiusMiles) {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey || apiKey === 'your_rapidapi_key_here') {
    console.warn('[listings] No RAPIDAPI_KEY set — returning mock data');
    return getMockListings(lat, lon, radiusMiles);
  }

  try {
    // Fetch page 1 first to get total count and page info
    const { listings: page1, totalCount, totalPages } = await fetchPage(
      lat,
      lon,
      radiusMiles,
      1,
      apiKey
    );

    let allRaw = [...page1];

    // Fetch additional pages if there are more results
    if (MAX_PAGES > 1 && totalPages != null && totalPages > 1) {
      const pagesToFetch = Math.min(MAX_PAGES, totalPages);

      const pagePromises = [];
      for (let p = 2; p <= pagesToFetch; p++) {
        pagePromises.push(fetchPage(lat, lon, radiusMiles, p, apiKey));
      }

      const additionalPages = await Promise.all(pagePromises);
      for (const { listings } of additionalPages) {
        allRaw = allRaw.concat(listings);
      }
    }

    console.log(`[listings] Fetched ${allRaw.length} raw listings (total reported: ${totalCount})`);

    return allRaw.map((item) => normaliseListing(item, lat, lon));
  } catch (err) {
    console.error('[listings] fetchListings error:', err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Mock data — used when no RAPIDAPI_KEY is configured so the UI always works
// ---------------------------------------------------------------------------

function getMockListings(originLat, originLon, radiusMiles) {
  const mockRaw = [
    {
      zpid: 'mock-1',
      address: { streetAddress: '123 Prairie Rd', city: 'Springfield', state: 'IL', zipcode: '62701' },
      price: 45000,
      lotAreaValue: 5.2,
      lotAreaUnit: 'acres',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 12,
      latitude: originLat + 0.02,
      longitude: originLon + 0.01,
      detailUrl: null,
      imgSrc: null,
    },
    {
      zpid: 'mock-2',
      address: { streetAddress: '456 Hilltop Ln', city: 'Lincoln', state: 'IL', zipcode: '62656' },
      price: 120000,
      lotAreaValue: 22.0,
      lotAreaUnit: 'acres',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 45,
      latitude: originLat - 0.05,
      longitude: originLon + 0.03,
      detailUrl: null,
      imgSrc: null,
    },
    {
      zpid: 'mock-3',
      address: { streetAddress: '789 Valley View Dr', city: 'Chatham', state: 'IL', zipcode: '62629' },
      price: 28500,
      lotAreaValue: 76230,
      lotAreaUnit: 'sqft',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 3,
      latitude: originLat + 0.04,
      longitude: originLon - 0.02,
      detailUrl: null,
      imgSrc: null,
    },
    {
      zpid: 'mock-4',
      address: { streetAddress: '321 Oak Creek Blvd', city: 'Auburn', state: 'IL', zipcode: '62615' },
      price: 210000,
      lotAreaValue: 80.0,
      lotAreaUnit: 'acres',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 90,
      latitude: originLat - 0.1,
      longitude: originLon - 0.08,
      detailUrl: null,
      imgSrc: null,
    },
    {
      zpid: 'mock-5',
      address: { streetAddress: '555 Meadow Brook Ct', city: 'Rochester', state: 'IL', zipcode: '62563' },
      price: 67000,
      lotAreaValue: 8.3,
      lotAreaUnit: 'acres',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 21,
      latitude: originLat + 0.07,
      longitude: originLon + 0.05,
      detailUrl: null,
      imgSrc: null,
    },
    {
      zpid: 'mock-6',
      address: { streetAddress: '900 Timber Ridge Rd', city: 'Pawnee', state: 'IL', zipcode: '62558' },
      price: 19900,
      lotAreaValue: 37026,
      lotAreaUnit: 'sqft',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 60,
      latitude: originLat - 0.03,
      longitude: originLon + 0.06,
      detailUrl: null,
      imgSrc: null,
    },
    {
      zpid: 'mock-7',
      address: { streetAddress: '1010 Cornfield Way', city: 'Riverton', state: 'IL', zipcode: '62561' },
      price: 350000,
      lotAreaValue: 160.0,
      lotAreaUnit: 'acres',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 15,
      latitude: originLat + 0.12,
      longitude: originLon - 0.09,
      detailUrl: null,
      imgSrc: null,
    },
    {
      zpid: 'mock-8',
      address: { streetAddress: '2020 Sunset Strip', city: 'Sherman', state: 'IL', zipcode: '62684' },
      price: 55000,
      lotAreaValue: 3.0,
      lotAreaUnit: 'acres',
      homeType: 'LOT',
      listingStatus: 'FOR_SALE',
      daysOnMarket: 7,
      latitude: originLat - 0.06,
      longitude: originLon - 0.04,
      detailUrl: null,
      imgSrc: null,
    },
  ];

  return mockRaw
    .map((item) => normaliseListing(item, originLat, originLon))
    .filter((l) => l.distanceMiles == null || l.distanceMiles <= radiusMiles);
}
