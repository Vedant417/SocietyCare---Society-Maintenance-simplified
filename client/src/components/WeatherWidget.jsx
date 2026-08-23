import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Cloud,
  Wind,
  Droplets,
  Navigation,
  Search,
  RefreshCw,
  MapPin,
  Loader2,
  X
} from 'lucide-react';

const DEFAULT_LAT = 12.9716;
const DEFAULT_LON = 77.5946;
const DEFAULT_NAME = "Bangalore, India";

const WeatherWidget = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchRef = useRef(null);
  const searchToggleRef = useRef(null);

  // Resolve coordinate preferences
  const lat = user?.weatherLatitude ?? DEFAULT_LAT;
  const lon = user?.weatherLongitude ?? DEFAULT_LON;
  const locationName = user?.weatherLocationName ?? DEFAULT_NAME;

  // Handle clicking outside search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideSearch =
        searchRef.current?.contains(event.target);

      const clickedSearchToggle =
        searchToggleRef.current?.contains(event.target);

      if (!clickedInsideSearch && !clickedSearchToggle) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchWeather = async (latitude = lat, longitude = lon, name = locationName, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const response = await api.get('/weather', {
        params: {
          lat: latitude,
          lon: longitude,
          locationName: name
        }
      });
      if (response.data.success) {
        setWeather(response.data.data);
      } else {
        setError("Weather information unavailable");
      }
    } catch (err) {
      console.error("Failed to load weather data:", err);
      setError("Weather information unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Setup initial fetch and auto-refresh interval (15 minutes)
  useEffect(() => {
    fetchWeather(lat, lon, locationName);

    const interval = setInterval(() => {
      fetchWeather(lat, lon, locationName, true);
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [lat, lon, locationName]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchWeather(lat, lon, locationName, true);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "warning");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLat = position.coords.latitude;
        const newLon = position.coords.longitude;

        try {
          // Let backend geocode the location to get a readable name
          const response = await api.get('/weather', {
            params: { lat: newLat, lon: newLon }
          });

          if (response.data.success) {
            const weatherData = response.data.data;
            // Save location preference to user profile
            const saveRes = await api.patch('/auth/weather-location', {
              latitude: newLat,
              longitude: newLon,
              locationName: weatherData.location
            });

            if (saveRes.data.success) {
              updateUser(saveRes.data.data.user);
              showToast("Location updated successfully!", "success");
            }
          }
        } catch (err) {
          console.error("Failed to save geolocated weather location:", err);
          showToast("Failed to resolve geolocated location.", "error");
          // Fallback to fetch for coordinates directly without saving if save fails
          fetchWeather(newLat, newLon, `${newLat.toFixed(2)}°, ${newLon.toFixed(2)}°`);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied or error:", error);
        showToast("Unable to retrieve location. Please check browser permissions.", "warning");
        setLoading(false);
      }
    );
  };

  // Handle location search input change
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get('/weather/search', {
        params: { q: value }
      });
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (err) {
      console.error("Geocoding search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectLocation = async (loc) => {
    setLoading(true);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);

    try {
      const response = await api.patch('/auth/weather-location', {
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationName: loc.name
      });

      if (response.data.success) {
        updateUser(response.data.data.user);
        showToast(`Location set to ${loc.name}`, "success");
      }
    } catch (err) {
      console.error("Failed to save selected weather location:", err);
      showToast("Failed to save weather location preference.", "error");
      // Fallback to direct weather fetch if update fails
      fetchWeather(loc.latitude, loc.longitude, loc.name);
    }
  };

  const getWeatherIcon = (cond) => {
    const c = cond ? cond.toLowerCase() : "";
    if (c.includes("sunny") || c.includes("clear")) {
      return <Sun className="w-10 h-10 text-amber-500 animate-pulse-slow shrink-0" />;
    }
    if (c.includes("cloudy") && c.includes("partly")) {
      return <CloudSun className="w-10 h-10 text-[#635BFF] shrink-0" />;
    }
    if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) {
      return <CloudRain className="w-10 h-10 text-blue-400 shrink-0" />;
    }
    if (c.includes("thunderstorm") || c.includes("storm")) {
      return <CloudLightning className="w-10 h-10 text-[#635BFF] shrink-0" />;
    }
    if (c.includes("fog")) {
      return <Cloud className="w-10 h-10 text-gray-400 shrink-0" style={{ opacity: 0.7 }} />;
    }
    return <Cloud className="w-10 h-10 text-gray-400 shrink-0" />;
  };

  if (loading) {
    return (
      <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-5 shadow-sm space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-5 shadow-sm flex flex-col items-center justify-center text-center py-8 space-y-3">
        <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
          <RefreshCw className="w-5 h-5" />
        </div>
        <p className="text-sm font-extrabold text-brand-charcoal">{error}</p>
        <button
          onClick={() => fetchWeather(lat, lon, locationName)}
          className="px-4 py-2 bg-[#635BFF] hover:bg-[#635BFF]/90 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-5 shadow-sm space-y-4 select-none relative transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]">

      {/* Upper header block: Location and Controls */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-1.5 min-w-0">
          <MapPin className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-brand-charcoal truncate" title={weather.location}>
              {weather.location}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Today's Weather
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Use My Location Shortcut */}
          <button
            onClick={handleUseMyLocation}
            className="p-1.5 hover:bg-[#EEEAFE] text-gray-400 hover:text-[#635BFF] rounded-xl transition-colors cursor-pointer"
            title="Use My Current Location"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {/* Location Search Toggle */}
          <button
            ref={searchToggleRef}
            onClick={() => setShowSearch((prev) => !prev)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showSearch ? 'bg-[#EEEAFE] text-[#635BFF]' : 'text-gray-400 hover:bg-[#EEEAFE] hover:text-[#635BFF]'
              }`}
            title="Search Location"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Refresh Action */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-[#EEEAFE] text-gray-400 hover:text-[#635BFF] rounded-xl transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Location Search Bar dropdown container */}
      {showSearch && (
        <div ref={searchRef} className="relative w-full z-10 animate-fade-in">
          <div className="flex items-center border border-[#635BFF]/20 rounded-2xl px-3 py-2 bg-[#EEEAFE]/30 focus-within:border-[#635BFF] transition-all">
            <Search className="w-3.5 h-3.5 text-[#635BFF] mr-2" />
            <input
              type="text"
              placeholder="Search city..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full text-xs text-brand-charcoal font-bold bg-transparent outline-none placeholder-gray-400"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-gray-400 hover:text-brand-charcoal cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown list */}
          {(searching || searchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 border border-brand-gray/40 rounded-2xl bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center p-4 text-gray-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#635BFF]" />
                  <span className="text-xs font-semibold">Searching...</span>
                </div>
              ) : (
                searchResults.map((loc, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLocation(loc)}
                    className="px-4 py-2.5 hover:bg-[#EEEAFE] text-xs text-brand-charcoal font-bold border-b border-brand-gray/10 last:border-0 cursor-pointer transition-colors"
                  >
                    {loc.name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Weather details display */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.condition)}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-brand-charcoal leading-none tracking-tight">
                {weather.temperature}°C
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase select-none">
                H:{weather.high}° L:{weather.low}°
              </span>
            </div>
            <p className="text-xs font-bold text-brand-primary mt-1 select-none">
              {weather.condition}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 border-t border-b border-brand-gray/20 py-2.5 text-center bg-gray-50/50 rounded-2xl select-none">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            Rain
          </div>
          <p className="text-xs font-extrabold text-brand-charcoal">{weather.rainProbability}%</p>
        </div>
        <div className="space-y-1 border-l border-r border-brand-gray/25">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
            <Wind className="w-3.5 h-3.5 text-[#635BFF]" />
            Wind
          </div>
          <p className="text-xs font-extrabold text-brand-charcoal">{weather.windSpeed} km/h</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            Humid
          </div>
          <p className="text-xs font-extrabold text-brand-charcoal">{weather.humidity}%</p>
        </div>
      </div>

      {/* Forecast Trend Timeline */}
      <div className="space-y-2 pt-1 select-none">
        <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">
          Hourly Trend
        </p>
        <div className="grid grid-cols-4 gap-2">
          {weather.forecast.map((fc, index) => (
            <div key={index} className="flex flex-col items-center p-2 rounded-2xl bg-white border border-brand-gray/30 space-y-1 text-center">
              <span className="text-[9px] text-gray-400 font-bold uppercase">{fc.time}</span>
              {getWeatherIcon(fc.condition, "w-6 h-6")}
              <span className="text-xs font-extrabold text-brand-charcoal">{fc.temp}°</span>
              <span className="text-[8px] text-blue-400 font-bold">{fc.rainProbability}%</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default WeatherWidget;
