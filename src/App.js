// src/App.js
import React, { useState } from "react";
import "./App.css";

const CACHE_KEY = "weather:lastForecast";
// Calculate average of all 6 temp values (3 highs + 3 lows)
function getDominantTemp(days = []) {
  if (!days.length) return null;
  const allTemps = days.flatMap(d => [d.high, d.low]).filter(t => t != null);
  const avg = allTemps.reduce((sum, t) => sum + t, 0) / allTemps.length;
  return avg;
}

// Map average temp to a theme
function getTempTheme(avgTemp) {
  if (avgTemp === null) return tempThemes.default;
  if (avgTemp >= 40)   return tempThemes.scorching;
  if (avgTemp >= 30)   return tempThemes.hot;
  if (avgTemp >= 20)   return tempThemes.warm;
  if (avgTemp >= 10)   return tempThemes.cool;
  return                      tempThemes.cold;
}

const tempThemes = {
  scorching: { bg: "linear-gradient(135deg, #b71c1c 0%, #e53935 50%, #ff7043 100%)", emoji: "🔥", label: "Scorching" },
  hot:       { bg: "linear-gradient(135deg, #e65100 0%, #f57c00 50%, #ffa726 100%)", emoji: "☀️", label: "Hot"       },
  warm:      { bg: "linear-gradient(135deg, #f9a825 0%, #fdd835 50%, #ffee58 100%)", emoji: "🌤️", label: "Warm"      },
  cool:      { bg: "linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)", emoji: "🌥️", label: "Cool"      },
  cold:      { bg: "linear-gradient(135deg, #0d47a1 0%, #1a237e 50%, #283593 100%)", emoji: "❄️", label: "Cold"      },
  default:   { bg: "linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #0288d1 100%)", emoji: "🌍", label: "Weather"   },
};







const weatherIcon = (advice = []) => {
  const all = advice.join(" ").toLowerCase();
  if (all.includes("storm"))    return "⛈️";
  if (all.includes("umbrella")) return "🌧️";
  if (all.includes("sunscreen")) return "☀️";
  if (all.includes("windy"))    return "💨";
  return "🌤️";
};

const sourceLabel = (source) => {
  if (source === "live")          return { text: "● Live",     color: "#2e7d32" };
  if (source === "offline-cache") return { text: "● Cached",   color: "#e65100" };
  return                                 { text: "● No Cache", color: "#999"    };
};



export default function App() {
  const [city, setCity] = useState("london");
  const [offlineMode, setOfflineMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });

  async function loadForecast() {
    setLoading(true);
    setError("");
    try {
      const url = `/api/v1/weather/forecast?city=${encodeURIComponent(city)}&offlineMode=${offlineMode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      localStorage.setItem(CACHE_KEY, JSON.stringify(json));
    } catch (e) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
        setError("Backend unreachable. Showing last cached result.");
      } else {
        setError("Fetch failed and no cached data found.");
      }
    } finally {
      setLoading(false);
    }
  }

  const days = (data?.days || []).slice(0, 3);
  const src = data?.source ? sourceLabel(data.source) : null;
const avgTemp = getDominantTemp(days);
const theme = getTempTheme(avgTemp);
  return (
    <div className="app-bg">
      <div className="page">

        {/* Header */}
        <div className="header">
          <div className="header-title">
            <span className="header-icon">🌍</span>
            <div>
              <h1>Weather Forecast</h1>
              <p>Next 3 days · Powered by OpenWeatherMap</p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="search-card">
          <div className="search-row">
            <div className="input-wrap">
              <span className="input-icon">🔍</span>
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name..."
                onKeyDown={(e) => e.key === "Enter" && loadForecast()}
              />
            </div>

            <label className={`toggle ${offlineMode ? "toggle-on" : ""}`}>
              <input
                type="checkbox"
                checked={offlineMode}
                onChange={(e) => setOfflineMode(e.target.checked)}
              />
              <span className="toggle-slider" />
              <span className="toggle-label">
                {offlineMode ? "Offline Mode" : "Online Mode"}
              </span>
            </label>

            <button
              className="btn"
              onClick={loadForecast}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                "Get Forecast"
              )}
            </button>
          </div>

          {/* Source tag */}
          {src && (
            <div className="source-bar" style={{ color: src.color }}>
              {src.text}&nbsp;
              <span className="source-city">{data?.city}</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="error-box">⚠️ {error}</div>}

        {/* Empty state */}
        {!data && !error && (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <p>Enter a city and click <b>Get Forecast</b> to begin.</p>
          </div>
        )}

        {/* No days in cache */}
        {data && days.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No cached data yet. Switch to <b>Online Mode</b> and search first.</p>
          </div>
        )}

        {/* Forecast cards */}
        {days.length > 0 && (
          <div className="grid3">
            {days.map((d, idx) => (
              <div className="card" key={d.date}>
                <div className="card-header">
                  <span className="card-day">
                    {idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : "Day After"}
                  </span>
                  <span className="card-date">{d.date}</span>
                </div>

                <div className="card-icon">{weatherIcon(d.advice)}</div>

                <div className="temps">
                  <div className="temp-block high">
                    <span className="temp-label">High</span>
                    <span className="temp-value">{d.high}°C</span>
                  </div>
                  <div className="temp-divider" />
                  <div className="temp-block low">
                    <span className="temp-label">Low</span>
                    <span className="temp-value">{d.low}°C</span>
                  </div>
                </div>

                <div className="card-divider" />

                <div className="advice-section">
                  {d.advice?.length > 0 ? (
                    d.advice.map((a, i) => (
                      <div key={i} className="advice-pill">{a}</div>
                    ))
                  ) : (
                    <div className="no-advice">✓ All clear!</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="footer">
          Weather data © OpenWeatherMap · Offline support enabled
        </div>
      </div>
    </div>
  );
}
