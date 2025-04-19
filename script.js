
const API_KEY = 'e9416e0f19179f9e97cf7c309c53f921';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');
const recentDropdown = document.getElementById('recentDropdown');
const currentWeather = document.getElementById('currentWeather');
const forecastEl = document.getElementById('forecast');
const errorEl = document.getElementById('error');
const loader = document.getElementById('loader');

// Load recent cities from localStorage
let recentCities = JSON.parse(localStorage.getItem('recentCities') || '[]');
updateDropdown();

// Show the loader
function showLoader() {
    loader.classList.add('active');
}

// Hide the loader after 1 second
function hideLoader() {
    setTimeout(() => {
        loader.classList.remove('active');
    }, 1000);
}

// Event listeners
searchBtn.addEventListener('click', () => fetchWeatherByCity(cityInput.value.trim()));
locBtn.addEventListener('click', fetchWeatherByLocation);
recentDropdown.addEventListener('change', () => fetchWeatherByCity(recentDropdown.value));

// Fetch weather by city
async function fetchWeatherByCity(city) {
    if (!city) return showError('Please enter a city name.');
    clearError();
    showLoader(); // Show loader
    try {
        const [current, forecast] = await Promise.all([
            fetchCurrent(city),
            fetchForecast(city)
        ]);
        displayCurrent(current);
        displayForecast(forecast);
        saveRecent(city);
    } catch (e) {
        showError(e.message);
    } finally {
        hideLoader(); // Hide loader
    }
}

// Fetch weather by location
async function fetchWeatherByLocation() {
    if (!navigator.geolocation) return showError('Geolocation not supported.');
    showLoader(); // Show loader
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        clearError();
        try {
            const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${coords.latitude}&lon=${coords.longitude}&limit=1&appid=${API_KEY}`);
            const [{ name }] = await res.json();
            fetchWeatherByCity(name);
        } catch (e) {
            showError('Unable to get location name.');
        } finally {
            hideLoader(); // Hide loader
        }
    }, () => {
        showError('Permission denied.');
        hideLoader(); // Hide loader
    });
}

// Fetch current weather data
function fetchCurrent(query) {
    return fetch(`https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${API_KEY}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error('City not found.')));
}

// Fetch forecast data
function fetchForecast(query) {
    return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${query}&units=metric&appid=${API_KEY}`)
        .then(res => res.ok ? res.json() : Promise.reject(new Error('Forecast not available.')));
}

// Display current weather
function displayCurrent(data) {
    const currentDate = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('description').textContent = data.weather[0].description;
    document.getElementById('temp').textContent = Math.round(data.main.temp);
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('wind').textContent = data.wind.speed;

    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = currentDate;
    } else {
        const newDateEl = document.createElement('p');
        newDateEl.id = 'currentDate';
        newDateEl.className = 'text-lg font-medium text-gray-600';
        newDateEl.textContent = currentDate;
        currentWeather.prepend(newDateEl);
    }

    currentWeather.classList.add('opacity-100');
}

// Display forecast
function displayForecast(data) {
    const daily = {};
    data.list.forEach(item => {
        if (item.dt_txt.includes('12:00:00')) {
            daily[item.dt_txt.split(' ')[0]] = item;
        }
    });
    forecastEl.innerHTML = '';
    Object.entries(daily).slice(0, 5).forEach(([date, item]) => {
        const day = new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const card = document.createElement('div');
        card.className = 'bg-gradient-to-br from-smokeWhite to-mint p-4 w-94 rounded-xl text-center hover:scale-105 transition-shadow duration-300';
        card.innerHTML = `
        <h3 class="font-semibold mb-2">${day}</h3>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="" class="mx-auto" />
        <p>${Math.round(item.main.temp)}°C</p>
        <p>💧 ${item.main.humidity}%</p>
        <p>💨 ${item.wind.speed} m/s</p>
    `;
        forecastEl.append(card);
    });
    forecastEl.classList.add('opacity-100');
}

// Show error message
function showError(msg) {
    errorEl.textContent = msg;
}

// Clear error message
function clearError() {
    errorEl.textContent = '';
}

// Save recent searches
function saveRecent(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) recentCities.pop();
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        updateDropdown();
    }
}

// Update recent searches dropdown
function updateDropdown() {
    if (recentCities.length) {
        recentDropdown.hidden = false;
        recentDropdown.innerHTML = '<option value="" disabled selected>Recent searches</option>' +
            recentCities.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

// Simple fade-in animation
const style = document.createElement('style');
style.innerHTML = `@keyframes fade-in { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: translateY(0);} } .animate-fade-in { animation: fade-in 0.6s ease-out; }`;
document.head.append(style);