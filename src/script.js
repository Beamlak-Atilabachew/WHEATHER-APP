// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_KEY = "512fd03373fd36152cac779f06f1dd74";
const BASE    = "https://api.openweathermap.org/data/2.5";

// ─── DATE HELPERS ────────────────────────────────────────────────────────────
const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDateTime(date) {
  const min  = String(date.getMinutes()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${DAYS[date.getDay()]} ${hour}:${min}`;
}

function formatForecastDay(timestamp) {
  const d = new Date(timestamp * 1000);
  return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// OpenWeatherMap icon URL
function iconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// ─── DISPLAY CURRENT WEATHER ─────────────────────────────────────────────────
function displayCurrentWeather(response) {
  const data = response.data;

  document.getElementById("current-city").textContent        = data.name;
  document.getElementById("current-date").textContent        = formatDateTime(new Date());
  document.getElementById("current-description").textContent = data.weather[0].description;
  document.getElementById("current-humidity").textContent    = `${data.main.humidity}%`;
  // OWM returns wind in m/s → convert to km/h
  document.getElementById("current-wind").textContent        = `${Math.round(data.wind.speed * 3.6)} km/h`;
  document.getElementById("current-temperature").textContent = Math.round(data.main.temp);

  const icon = document.getElementById("current-icon");
  icon.src = iconUrl(data.weather[0].icon);
  icon.alt = data.weather[0].description;
}

// ─── DISPLAY FORECAST ────────────────────────────────────────────────────────
// OWM free plan returns 3-hour intervals for 5 days (40 entries total).
// We group by date and pick the entry closest to midday for each future day.
function displayForecast(response) {
  const forecastEl = document.getElementById("forecast");
  forecastEl.innerHTML = "";

  const list = response.data.list;

  // Group by date, prefer the 12:00 entry
  const byDay = {};
  list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    const time = entry.dt_txt.split(" ")[1];
    if (!byDay[date] || time === "12:00:00") {
      byDay[date] = entry;
    }
  });

  // Skip today, show next 5 days
  const today      = new Date().toISOString().split("T")[0];
  const futureDays = Object.keys(byDay).filter((d) => d > today).slice(0, 5);

  futureDays.forEach((dateKey) => {
    const day  = byDay[dateKey];
    const high = Math.round(day.main.temp_max);
    const low  = Math.round(day.main.temp_min);

    const col = document.createElement("div");
    col.className = "weather-forecast-day";
    col.innerHTML = `
      <div class="weather-forecast-date">${formatForecastDay(day.dt)}</div>
      <img
        src="${iconUrl(day.weather[0].icon)}"
        alt="${day.weather[0].description}"
        class="weather-forecast-icon"
        title="${day.weather[0].description}"
      />
      <div class="weather-forecast-temperatures">
        <span class="weather-forecast-temperature high">${high}°</span>
        <span class="weather-forecast-temperature low">${low}°</span>
      </div>
    `;
    forecastEl.appendChild(col);
  });
}

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────
function showError(msg) {
  document.getElementById("error-message").textContent = msg;
}

function clearError() {
  document.getElementById("error-message").textContent = "";
}

// ─── SEARCH ──────────────────────────────────────────────────────────────────
function searchCity(city) {
  clearError();

  const currentUrl  = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const forecastUrl = `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  Promise.all([axios.get(currentUrl), axios.get(forecastUrl)])
    .then(([currentRes, forecastRes]) => {
      displayCurrentWeather(currentRes);
      displayForecast(forecastRes);
    })
    .catch((error) => {
      if (error.response && error.response.status === 404) {
        showError("City not found. Please check the name and try again.");
      } else if (error.response && error.response.status === 401) {
        showError("Invalid API key. Please check your OpenWeatherMap key.");
      } else {
        showError("Something went wrong. Please try again.");
      }
    });
}

function handleSearch(event) {
  event.preventDefault();
  const city = document.getElementById("search-input").value.trim();
  if (city) searchCity(city);
}

// ─── INIT ────────────────────────────────────────────────────────────────────
document.getElementById("search-form").addEventListener("submit", handleSearch);
document.getElementById("current-date").textContent = formatDateTime(new Date());

// Default city
searchCity("Addis Ababa");
