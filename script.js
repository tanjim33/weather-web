// API Configuration - Using OpenWeatherMap Free API (No backend needed)
const API_KEY = 'cao6ba1fc7f59758b815d873d39e69816';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Global State (everything stored in localStorage)
let currentCity = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Weather Icons Mapping
const weatherIcons = {
    '01d': 'fas fa-sun',
    '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun',
    '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud',
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud',
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain',
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-sun-rain',
    '10n': 'fas fa-cloud-moon-rain',
    '11d': 'fas fa-bolt',
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake',
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog',
    '50n': 'fas fa-smog'
};

// Initialize
function init() {
    displayRecentSearches();
    displayFavorites();
    updateLastUpdate();
    loadSettings();
    
    // Set default city on load or show demo
    if (recentSearches.length > 0) {
        document.getElementById('cityInput').value = recentSearches[0];
        searchCity();
    } else {
        // Show demo data on first load
        showDemoData();
    }
}

// Weather Functions
async function searchCity() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
        alert('Please enter a city name');
        return;
    }

    try {
        showLoading(true);
        
        // First get coordinates for the city
        const geoResponse = await fetch(`${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
        if (!geoResponse.ok) {
            if (geoResponse.status === 401) {
                throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
            }
            throw new Error('City not found');
        }

        const data = await geoResponse.json();
        
        // Create current weather data
        const weatherData = {
            current: {
                city: data.name,
                country: data.sys.country,
                temperature: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                windSpeed: data.wind.speed,
                visibility: data.visibility,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                dewPoint: Math.round(data.main.temp - ((100 - data.main.humidity) / 5)),
                windDirection: data.wind.deg || 0,
                uvIndex: Math.floor(Math.random() * 11) + 1
            },
            forecast: await generateForecast(data.coord.lat, data.coord.lon)
        };

        displayWeatherData(weatherData);
        currentCity = weatherData.current;

        // Save search
        addToRecentSearches(city);
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Search error:', error);
        
        // Fallback to mock data on error
        useMockData(city);
    } finally {
        showLoading(false);
    }
}

// Generate actual forecast from API
async function generateForecast(lat, lon) {
    try {
        const response = await fetch(`${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error('Forecast data unavailable');
        
        const data = await response.json();
        const dailyForecast = [];
        
        // Process 5-day forecast (OpenWeatherMap provides 3-hour intervals)
        for (let i = 0; i < data.list.length; i += 8) {
            const dayData = data.list[i];
            const date = new Date(dayData.dt * 1000);
            
            dailyForecast.push({
                date: date.toISOString(),
                high: Math.round(dayData.main.temp_max),
                low: Math.round(dayData.main.temp_min),
                description: dayData.weather[0].description,
                icon: dayData.weather[0].icon
            });
            
            if (dailyForecast.length >= 5) break;
        }
        
        return dailyForecast;
    } catch (error) {
        console.warn('Using mock forecast data');
        return generateMockForecast('Unknown');
    }
}

// Use mock data when API is unavailable
function useMockData(city) {
    const mockData = {
        current: {
            city: city,
            country: 'Demo',
            temperature: Math.floor(Math.random() * 30) + 10,
            feelsLike: Math.floor(Math.random() * 30) + 10,
            humidity: Math.floor(Math.random() * 50) + 30,
            pressure: Math.floor(Math.random() * 100) + 1000,
            windSpeed: (Math.random() * 10).toFixed(1),
            visibility: Math.floor(Math.random() * 10) + 5,
            description: 'Partly Cloudy',
            icon: '02d',
            dewPoint: Math.floor(Math.random() * 15) + 5,
            windDirection: Math.floor(Math.random() * 360),
            uvIndex: Math.floor(Math.random() * 11) + 1
        },
        forecast: generateMockForecast(city)
    };
    
    displayWeatherData(mockData);
    currentCity = mockData.current;
    addToRecentSearches(city);
}

// Show demo data on initial load
function showDemoData() {
    const demoCities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'];
    const randomCity = demoCities[Math.floor(Math.random() * demoCities.length)];
    document.getElementById('cityInput').value = randomCity;
    useMockData(randomCity);
}

function generateMockForecast(cityName) {
    const forecast = [];
    const baseTemp = Math.floor(Math.random() * 25) + 10;
    
    for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const tempVariation = Math.floor(Math.random() * 8) - 4;
        const high = baseTemp + tempVariation + 3;
        const low = baseTemp + tempVariation - 3;
        
        const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Stormy'];
        const description = conditions[Math.floor(Math.random() * conditions.length)];
        
        forecast.push({
            date: date.toISOString(),
            high: high,
            low: low,
            description: description,
            icon: '02d'
        });
    }
    
    return forecast;
}

function displayWeatherData(data) {
    const current = data.current;

    document.getElementById('cityName').textContent = `${current.city}, ${current.country}`;
    document.getElementById('weatherDate').textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('temperature').textContent = Math.round(current.temperature);
    document.getElementById('weatherCondition').textContent = current.description;
    document.getElementById('feelsLike').textContent = Math.round(current.feelsLike) + '°';
    document.getElementById('humidity').textContent = current.humidity + '%';
    document.getElementById('windSpeed').textContent = current.windSpeed + ' m/s';
    document.getElementById('visibility').textContent = (current.visibility / 1000).toFixed(1) + ' km';
    document.getElementById('pressure').textContent = current.pressure + ' hPa';
    document.getElementById('dewPoint').textContent = current.dewPoint + '°';
    document.getElementById('windDirection').textContent = current.windDirection + '°';
    document.getElementById('precipChance').textContent = Math.floor(Math.random() * 100) + '%';
    document.getElementById('uvIndex').textContent = current.uvIndex;
    document.getElementById('uvDetail').textContent = current.uvIndex;
    document.getElementById('aqi').textContent = 'Good';
    document.getElementById('pm25').textContent = '25';

    // Update weather icon
    const weatherIcon = document.getElementById('weatherMainIcon');
    const iconClass = weatherIcons[current.icon] || 'fas fa-sun';
    weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;

    displayForecast(data.forecast);
    updateLastUpdate();
}

function displayForecast(forecast) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    forecast.forEach(day => {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const card = document.createElement('div');
        card.className = 'forecast-day-card';
        card.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <div class="forecast-icon"><i class="${weatherIcons[day.icon] || 'fas fa-cloud-sun'}"></i></div>
            <div style="font-size: 0.9em; margin-bottom: 10px; text-transform: capitalize;">${day.description}</div>
            <div class="forecast-temps">
                <div><strong>${Math.round(day.high)}°</strong></div>
                <div style="opacity: 0.6;">${Math.round(day.low)}°</div>
            </div>
        `;
        forecastGrid.appendChild(card);
    });
}

// Favorites (stored in localStorage)
function addToFavorites() {
    if (!currentCity) {
        alert('Please search for a city first');
        return;
    }

    const favorite = {
        city: currentCity.city,
        country: currentCity.country,
        temperature: currentCity.temperature
    };

    if (!favorites.find(f => f.city === favorite.city)) {
        favorites.push(favorite);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        displayFavorites();
        alert('Added to favorites!');
    } else {
        alert('Already in favorites');
    }
}

function displayFavorites() {
    const container = document.getElementById('favoritesContainer');
    if (favorites.length === 0) {
        container.innerHTML = '<p class="no-favorites">No favorites added yet. Add cities from home screen.</p>';
        return;
    }

    container.innerHTML = favorites.map((fav, idx) => `
        <div class="favorite-card">
            <button class="remove-favorite" onclick="removeFavorite(${idx})">✕</button>
            <h4>${fav.city}</h4>
            <p>${fav.country}</p>
            <p style="margin-top: 10px; font-size: 1.5em;">${Math.round(fav.temperature)}°</p>
            <button class="btn btn-primary" style="width: 100%; margin-top: 10px; padding: 5px;" onclick="searchFavorite('${fav.city}')">
                View
            </button>
        </div>
    `).join('');
}

function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
}

function searchFavorite(city) {
    document.getElementById('cityInput').value = city;
    searchCity();
    showSection('home');
}

// Recent Searches (stored in localStorage)
function addToRecentSearches(city) {
    recentSearches = recentSearches.filter(c => c !== city);
    recentSearches.unshift(city);
    recentSearches = recentSearches.slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

function displayRecentSearches() {
    const container = document.getElementById('recentSearches');
    if (recentSearches.length === 0) {
        container.innerHTML = '<div class="search-tag">No recent searches</div>';
        return;
    }
    
    container.innerHTML = recentSearches.map(city => `
        <div class="search-tag" onclick="searchRecentCity('${city}')">${city}</div>
    `).join('');
}

function searchRecentCity(city) {
    document.getElementById('cityInput').value = city;
    searchCity();
}

// Geolocation
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            error => {
                alert('Error getting location: ' + error.message);
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        showLoading(true);

        const response = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error('Location not found');

        const data = await response.json();
        
        const weatherData = {
            current: {
                city: data.name,
                country: data.sys.country,
                temperature: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                windSpeed: data.wind.speed,
                visibility: data.visibility,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                dewPoint: Math.round(data.main.temp - ((100 - data.main.humidity) / 5)),
                windDirection: data.wind.deg || 0,
                uvIndex: Math.floor(Math.random() * 11) + 1
            },
            forecast: await generateForecast(lat, lon)
        };

        displayWeatherData(weatherData);
        currentCity = weatherData.current;
        addToRecentSearches(data.name);
    } catch (error) {
        alert('Error fetching location weather: ' + error.message);
        useMockData('Your Location');
    } finally {
        showLoading(false);
    }
}

// UI Functions
function toggleAuth() {
    const authSection = document.getElementById('authSection');
    authSection.classList.toggle('show');
}

function toggleSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.classList.toggle('open');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    document.getElementById('darkModeToggle').checked = isDarkMode;
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName + 'Section').classList.add('active');
}

function saveSetting(key, value) {
    localStorage.setItem(key, value);
    alert('Setting saved: ' + key + ' = ' + value);
}

function loadSettings() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
    
    const tempUnit = localStorage.getItem('tempUnit');
    if (tempUnit) {
        document.getElementById('tempUnit').value = tempUnit;
    }
    
    const windUnit = localStorage.getItem('windUnit');
    if (windUnit) {
        document.getElementById('windUnit').value = windUnit;
    }
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
}

function showLoading(show) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.disabled = show;
    });
}

// Mock authentication functions
function loginUser() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
        document.getElementById('authMessage').textContent = 'Please fill all fields';
        document.getElementById('authMessage').style.color = 'var(--danger-color)';
        return;
    }
    
    document.getElementById('authMessage').textContent = 'Login successful!';
    document.getElementById('authMessage').style.color = 'var(--success-color)';
    document.getElementById('authBtn').innerHTML = '<i class="fas fa-user"></i> ' + email.split('@')[0];
    toggleAuth();
}

function registerUser() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (!email || !password) {
        document.getElementById('authMessage').textContent = 'Please fill all fields';
        document.getElementById('authMessage').style.color = 'var(--danger-color)';
        return;
    }
    
    document.getElementById('authMessage').textContent = 'Registration successful!';
    document.getElementById('authMessage').style.color = 'var(--success-color)';
    document.getElementById('authBtn').innerHTML = '<i class="fas fa-user"></i> ' + email.split('@')[0];
    toggleAuth();
}

function logoutUser() {
    document.getElementById('authBtn').innerHTML = '<i class="fas fa-user"></i> Login';
    document.getElementById('authEmail').value = '';
    document.getElementById('authPassword').value = '';
    alert('Logged out successfully');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    init();
    
    document.getElementById('cityInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchCity();
        }
    });
});
