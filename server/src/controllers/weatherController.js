const https = require("https");

// -----------------------------
// Generic JSON GET helper
// -----------------------------
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestUrl = new URL(url);

    const req = https.request(
      {
        protocol: requestUrl.protocol,
        hostname: requestUrl.hostname,
        port: requestUrl.port || 443,
        path: `${requestUrl.pathname}${requestUrl.search}`,

        method: "GET",

        // Force IPv4 for Render outbound requests.
        family: 4,

        timeout: 15000,

        headers: {
          Accept: "application/json",
          "User-Agent": "SocietyCare/1.0",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = "";

        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          const statusCode = res.statusCode || 500;

          if (statusCode < 200 || statusCode >= 300) {
            return reject(
              new Error(
                `External API returned ${statusCode}: ${body.slice(0, 500)}`
              )
            );
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(
              new Error(
                `Invalid JSON from external API: ${error.message}`
              )
            );
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(
        new Error("External weather request timed out.")
      );
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

// -----------------------------
// Weather code mapping
// -----------------------------
function parseWeatherCode(code) {
  if (code === 0) {
    return {
      condition: "Sunny",
      icon: "☀️",
    };
  }

  if ([1, 2, 3].includes(code)) {
    return {
      condition: "Partly Cloudy",
      icon: "🌤️",
    };
  }

  if ([45, 48].includes(code)) {
    return {
      condition: "Foggy",
      icon: "☁️",
    };
  }

  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  ) {
    return {
      condition: "Rain",
      icon: "🌧️",
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      condition: "Snowy",
      icon: "❄️",
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      condition: "Thunderstorm",
      icon: "⛈️",
    };
  }

  return {
    condition: "Cloudy",
    icon: "☁️",
  };
}

// -----------------------------
// GET /api/weather
// -----------------------------
async function getWeather(req, res) {
  try {
    const { lat, lon, locationName } = req.query;

    const latitude = Number(lat);
    const longitude = Number(lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required.",
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90.",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180.",
      });
    }

    // Build URL safely instead of manually concatenating query strings.
    const weatherUrl = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    weatherUrl.searchParams.set("latitude", latitude);
    weatherUrl.searchParams.set("longitude", longitude);

    weatherUrl.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
    );

    weatherUrl.searchParams.set(
      "hourly",
      "temperature_2m,precipitation_probability,weather_code"
    );

    weatherUrl.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min"
    );

    weatherUrl.searchParams.set("timezone", "auto");
    weatherUrl.searchParams.set("forecast_days", "1");

    console.log("Fetching weather:", weatherUrl.toString());

    const weatherData = await fetchJson(weatherUrl.toString());

    // ----------------------------------
    // Resolve location name
    // ----------------------------------
    let resolvedLocation = locationName?.trim() || "";

    // Only reverse-geocode when frontend didn't provide a name.
    if (!resolvedLocation) {
      try {
        const reverseUrl = new URL(
          "https://nominatim.openstreetmap.org/reverse"
        );

        reverseUrl.searchParams.set("lat", latitude);
        reverseUrl.searchParams.set("lon", longitude);
        reverseUrl.searchParams.set("format", "json");
        reverseUrl.searchParams.set("accept-language", "en");

        const geoData = await fetchJson(reverseUrl.toString(), {
          headers: {
            "User-Agent":
              "SocietyCare/1.0 (contact@societycare.com)",
          },
        });

        if (geoData?.address) {
          resolvedLocation =
            geoData.address.city ||
            geoData.address.town ||
            geoData.address.village ||
            geoData.address.suburb ||
            geoData.address.state ||
            "";
        }

        if (!resolvedLocation && geoData?.display_name) {
          resolvedLocation = geoData.display_name.split(",")[0];
        }
      } catch (geoError) {
        console.error(
          "Reverse geocoding failed:",
          geoError.message
        );
      }
    }

    if (!resolvedLocation) {
      resolvedLocation = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
    }

    // ----------------------------------
    // Hourly forecast
    // ----------------------------------
    const hourly = weatherData.hourly || {};

    const forecastTimes = [0, 7, 13, 19];

    const forecast = forecastTimes.map((hour) => {
      const timeLabel =
        hour === 0
          ? "12 AM"
          : hour === 12
            ? "12 PM"
            : hour > 12
              ? `${hour - 12} PM`
              : `${hour} AM`;

      const temp = Math.round(
        hourly.temperature_2m?.[hour] ?? 0
      );

      const code = hourly.weather_code?.[hour] ?? 0;

      const parsed = parseWeatherCode(code);

      const rainProbability = Math.round(
        hourly.precipitation_probability?.[hour] ?? 0
      );

      return {
        time: timeLabel,
        temp,
        condition: parsed.condition,
        icon: parsed.icon,
        rainProbability,
      };
    });

    // ----------------------------------
    // Current weather
    // ----------------------------------
    const current = weatherData.current || {};

    const parsedCurrent = parseWeatherCode(
      current.weather_code ?? 0
    );

    const daily = weatherData.daily || {};

    const high = Math.round(
      daily.temperature_2m_max?.[0] ??
        ((current.temperature_2m ?? 0) + 3)
    );

    const low = Math.round(
      daily.temperature_2m_min?.[0] ??
        ((current.temperature_2m ?? 0) - 4)
    );

    const precipitationValues =
      hourly.precipitation_probability?.slice(0, 24) || [0];

    const rainProbability = Math.round(
      Math.max(...precipitationValues)
    );

    const normalizedData = {
      location: resolvedLocation,

      temperature: Math.round(
        current.temperature_2m ?? 0
      ),

      condition: parsedCurrent.condition,

      icon: parsedCurrent.icon,

      high,

      low,

      rainProbability,

      humidity: Math.round(
        current.relative_humidity_2m ?? 0
      ),

      windSpeed: Math.round(
        current.wind_speed_10m ?? 0
      ),

      forecast,
    };

    return res.status(200).json({
      success: true,
      data: normalizedData,
    });
  } catch (error) {
    console.error("Weather Controller error:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Weather information unavailable",
    });
  }
}

// -----------------------------
// GET /api/weather/search?q=...
// -----------------------------
async function searchLocations(req, res) {
  try {
    const q = String(req.query.q || "").trim();

    if (q.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const searchUrl = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );

    searchUrl.searchParams.set("name", q);
    searchUrl.searchParams.set("count", "5");
    searchUrl.searchParams.set("language", "en");
    searchUrl.searchParams.set("format", "json");

    const searchData = await fetchJson(
      searchUrl.toString()
    );

    const results = (searchData.results || []).map(
      (item) => {
        const parts = [
          item.name,
          item.admin1,
          item.country,
        ].filter(Boolean);

        return {
          name: parts.join(", "),
          latitude: item.latitude,
          longitude: item.longitude,
        };
      }
    );

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(
      "Search locations error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to search locations",
    });
  }
}

module.exports = {
  getWeather,
  searchLocations,
};