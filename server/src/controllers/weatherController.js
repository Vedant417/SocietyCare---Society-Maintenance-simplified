const User = require("../models/User");
const https = require("https");

// Helper to perform HTTPS GET requests returning parsed JSON (compatible with all Node.js versions)
function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse JSON response"));
          }
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

// Helper to map WMO code to human-readable weather conditions and emojis
function parseWeatherCode(code) {
  if (code === 0) return { condition: "Sunny", icon: "☀️" };
  if ([1, 2, 3].includes(code)) return { condition: "Partly Cloudy", icon: "🌤️" };
  if ([45, 48].includes(code)) return { condition: "Foggy", icon: "☁️" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: "Rain", icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "Snowy", icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { condition: "Thunderstorm", icon: "⛈️" };
  return { condition: "Cloudy", icon: "☁️" };
}

/**
 * Get weather data for given coordinates
 * GET /api/weather?lat=...&lon=...
 */
async function getWeather(req, res, next) {
  try {
    const { lat, lon, locationName } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required." });
    }

    // 1. Fetch current and daily forecast from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;

    const weatherData = await httpsGet(weatherUrl);

    // 2. Resolve readable location name
    let resolvedLocation = locationName || "";
    if (!resolvedLocation) {
      try {
        const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
        const geoData = await httpsGet(reverseGeocodeUrl, {
          headers: { "User-Agent": "SocietyCare/1.0 (contact@societycare.com)" }
        });
        if (geoData && geoData.address) {
          // Extract city/town/village/suburb or address display name
          resolvedLocation = geoData.address.city || 
                             geoData.address.town || 
                             geoData.address.village || 
                             geoData.address.suburb || 
                             geoData.address.state || 
                             geoData.display_name.split(",")[0];
        }
      } catch (geoErr) {
        console.error("Reverse geocoding failed:", geoErr.message);
      }
    }

    if (!resolvedLocation) {
      resolvedLocation = `${Number(lat).toFixed(4)}°, ${Number(lon).toFixed(4)}°`;
    }

    // 3. Format hourly forecast trend (12 AM, 7 AM, 1 PM, 7 PM)
    const hourly = weatherData.hourly || {};
    const forecastTimes = [0, 7, 13, 19]; // index maps to hour of day (12 AM, 7 AM, 1 PM, 7 PM)
    const forecast = forecastTimes.map(hour => {
      const timeLabel = hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      const temp = Math.round(hourly.temperature_2m?.[hour] ?? 0);
      const code = hourly.weather_code?.[hour] ?? 0;
      const parsed = parseWeatherCode(code);
      const rainProbability = Math.round(hourly.precipitation_probability?.[hour] ?? 0);

      return {
        time: timeLabel,
        temp,
        condition: parsed.condition,
        icon: parsed.icon,
        rainProbability
      };
    });

    // 4. Extract current status
    const current = weatherData.current || {};
    const parsedCurrent = parseWeatherCode(current.weather_code ?? 0);
    const daily = weatherData.daily || {};

    const high = Math.round(daily.temperature_2m_max?.[0] ?? (current.temperature_2m + 3));
    const low = Math.round(daily.temperature_2m_min?.[0] ?? (current.temperature_2m - 4));
    
    // Rain probability from hourly peak or first hour peak
    const rainProbability = Math.round(Math.max(...(hourly.precipitation_probability?.slice(0, 24) || [0])));

    const normalizedData = {
      location: resolvedLocation,
      temperature: Math.round(current.temperature_2m ?? 0),
      condition: parsedCurrent.condition,
      icon: parsedCurrent.icon,
      high,
      low,
      rainProbability,
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      forecast
    };

    return res.status(200).json({
      success: true,
      data: normalizedData
    });
  } catch (error) {
    console.error("Weather Controller error:", error);
    return res.status(500).json({ success: false, message: "Weather information unavailable" });
  }
}

/**
 * Search locations by name
 * GET /api/weather/search?q=...
 */
async function searchLocations(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en`;
    const searchData = await httpsGet(searchUrl);
    const results = (searchData.results || []).map(item => {
      const parts = [
        item.name,
        item.admin1, // State/Province
        item.country
      ].filter(Boolean);

      return {
        name: parts.join(", "),
        latitude: item.latitude,
        longitude: item.longitude
      };
    });

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Search locations error:", error);
    return res.status(500).json({ success: false, message: "Unable to search locations" });
  }
}

module.exports = {
  getWeather,
  searchLocations
};
