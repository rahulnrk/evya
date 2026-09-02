// stationsApi.js - UPDATED
import axios from "axios";

const API_URL = "https://server.evyaa.com/api/mobile/mobilegetAllSites";

/**
 * SCALE-1: location may include optional bbox { minLat, minLng, maxLat, maxLng }.
 * When bbox is present it is sent as query params; lat/lng radius path remains for legacy callers.
 */
const getStations = async ({ location, filters, search, from, to, limit } = {}, signal) => {
  let params = {};

  console.log("🔄 getStations called with:", { location, filters, search, from, to, limit });

  // SCALE-1: viewport bbox (preferred when all four corners present)
  const hasBbox =
    location?.minLat != null &&
    location?.minLng != null &&
    location?.maxLat != null &&
    location?.maxLng != null;

  if (hasBbox) {
    params.minLat = location.minLat;
    params.minLng = location.minLng;
    params.maxLat = location.maxLat;
    params.maxLng = location.maxLng;
    // Center still useful for clients that want distance later
    if (location?.latitude != null) params.latitude = location.latitude;
    if (location?.longitude != null) params.longitude = location.longitude;
    if (limit != null) params.limit = limit;
  } else {
    // Legacy: radius + center (backend uses lat/lng distance when bbox absent)
    params.radius = location?.radius ?? 100;
    if (location?.latitude != null) params.latitude = location.latitude;
    if (location?.longitude != null) params.longitude = location.longitude;
  }

  // ✅ Extract filter parameters - UPDATED to match API expectations
  if (filters) {
    if (filters.connectorType != null) params.connectorTypes = filters.connectorType;
    if (filters.power != null) params.powerRange = filters.power;
    if (filters.chargerType != null) params.powerType = filters.chargerType;
    if (filters.status != null) params.status = filters.status;
    if (filters.evya != null) params.evya = filters.evya;
  }

  // ✅ Search parameter
  if (search && search.trim() !== "") params.search = search.trim();

  // ✅ From/To parameters
  if (from) params.from = from;
  if (to) params.to = to;

  // Remove null/undefined/empty string
  Object.keys(params).forEach((key) => {
    if (params[key] === null || params[key] === undefined || params[key] === "") {
      delete params[key];
    }
  });

  console.log("✅ FINAL API URL:", `${API_URL}?${new URLSearchParams(params).toString()}`);
  console.log("✅ FINAL Params Object:", params);

  try {
    const response = await axios.get(API_URL, { params, signal });

    if (response.status === 204) {
      console.log("✅ API returned 204 - No stations found");
      return [];
    }

    const stationsData = response.data;
    console.log("API Response:", stationsData);
    
    // Transform API response to match your application's expected format
    const transformedStations = stationsData.map(station => ({
      id: station.siteId,
      name: station.siteName,
      address: station.address,
      totalPorts: station.noOfPorts,
      available: station.avaiPorts,
      status: station.siteStatus,
      power: station.capacityRange,
      price: station.priceRange,
      latitude: station.latitude,
      longitude: station.longitude,
      coordinates: {
        latitude: station.latitude,
        longitude: station.longitude
      },
      // Keep original API fields as well
      siteId: station.siteId,
      siteName: station.siteName,
      noOfPorts: station.noOfPorts,
      avaiPorts: station.avaiPorts,
      siteStatus: station.siteStatus,
      powerTypes: station.powerTypes,
      connectorTypes: station.connectorTypes,
      distanceKm: station.distanceKm,
      capacityRange: station.capacityRange,
      priceRange: station.priceRange,
      // SCALE-3 correlation (OCPPId → EvyaSense Redis charger key)
      chargerRefs: station.chargerRefs || station.charger_refs || [],
      ports: station.ports || [],
      // For backward compatibility
      connectors: station.connectorTypes || [],
      current_type: station.powerTypes && station.powerTypes.length > 0 ? station.powerTypes.join('/') : 'DC/AC'
    }));

    return transformedStations;

  } catch (error) {
    console.error("❌ API Error:", error);
    throw error;
  }
};

const Apis = {
  getStations,
  
  getStationsByFilters: (filters, signal) => getStations({ filters }, signal),
  
  getStationsBySearch: async (search, signal) => {
    try {
      console.log("🔍 Searching with:", search);
      const response = await getStations({ search }, signal);
      return response;
    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  },
  
  getStationsByLocation: (location, signal) => getStations({ location }, signal),
  
  getStationsByFromTo: (from, to, signal) => getStations({ from, to }, signal),
};

export default Apis;
