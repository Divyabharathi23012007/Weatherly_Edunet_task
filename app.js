// API Configuration
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const locationElement = document.getElementById('location');
const currentTempElement = document.getElementById('current-temp');
const weatherConditionElement = document.getElementById('weather-condition');
const weatherIconElement = document.getElementById('weather-icon');
const feelsLikeElement = document.getElementById('feels-like');
const windElement = document.getElementById('wind');
const humidityElement = document.getElementById('humidity');
const pressureElement = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast-container');
const loadingElement = document.getElementById('loading');
const unitToggleButtons = document.querySelectorAll('.unit-toggle button');

// State
let currentUnit = 'metric';
let currentLocation = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Try to get weather for user's location on page load
    getLocation();
    
    // Search button click event
    searchBtn.addEventListener('click', () => {
        const location = locationInput.value.trim();
        if (location) {
            getWeatherByLocation(location);
        }
    });
    
    // Location button click event
    locationBtn.addEventListener('click', getLocation);
    
    // Unit toggle buttons
    unitToggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.unit !== currentUnit) {
                // Update active state
                unitToggleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update unit and refresh weather data
                currentUnit = button.dataset.unit;
                if (currentLocation) {
                    getWeatherByLocation(currentLocation);
                }
            }
        });
    });
    
    // Handle Enter key in search input
    locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const location = locationInput.value.trim();
            if (location) {
                getWeatherByLocation(location);
            }
        }
    });
});

// Get user's current location
function getLocation() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.error('Error getting location:', error);
                showError('Unable to retrieve your location. Please try again or search for a city.');
                showLoading(false);
                // Default to a popular city if location access is denied
                getWeatherByLocation('London');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser. Please search for a city.');
        getWeatherByLocation('London');
    }
}

// Get coordinates for a location name
async function getCoordinatesForLocation(location) {
    try {
        const response = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('Location not found');
        }
        
        return {
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude,
            name: data.results[0].name,
            country: data.results[0].country
        };
    } catch (error) {
        console.error('Error getting coordinates:', error);
        throw new Error('Could not find the specified location');
    }
}

// Get weather by city name
async function getWeatherByLocation(location) {
    try {
        showLoading(true);
        
        // First, get coordinates for the location
        const locationData = await getCoordinatesForLocation(location);
        
        // Then get weather data using coordinates
        await getWeatherByCoords(locationData.latitude, locationData.longitude, locationData.name, locationData.country);
        
        // Clear input
        locationInput.value = '';
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Could not find the specified location. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon, locationName = null, country = null) {
    try {
        showLoading(true);
        
        // Get current weather and forecast in one request
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,apparent_temperature,relative_humidity_2m,pressure_msl,surface_pressure,wind_speed_10m,weather_code',
            hourly: 'temperature_2m,weather_code',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min',
            timezone: 'auto',
            forecast_days: 5,
            temperature_unit: currentUnit === 'metric' ? 'celsius' : 'fahrenheit',
            wind_speed_unit: currentUnit === 'metric' ? 'ms' : 'mph'
        });
        
        const response = await fetch(`${BASE_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        
        // Format the data to match our UI expectations
        const currentData = {
            current: {
                temp: data.current.temperature_2m,
                feels_like: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m,
                pressure: Math.round(data.current.pressure_msl),
                wind_speed: data.current.wind_speed_10m,
                weather: [{
                    description: getWeatherDescription(data.current.weather_code),
                    icon: getWeatherIconCode(data.current.weather_code, true)
                }]
            },
            name: locationName || 'Current Location',
            country: country || ''
        };
        
        // Format forecast data
        const forecastData = {
            list: data.daily.time.map((time, index) => ({
                dt: new Date(time).getTime() / 1000, // Convert to Unix timestamp
                main: {
                    temp_max: data.daily.temperature_2m_max[index],
                    temp_min: data.daily.temperature_2m_min[index]
                },
                weather: [{
                    main: getWeatherCondition(data.daily.weather_code[index]),
                    description: getWeatherDescription(data.daily.weather_code[index]),
                    icon: getWeatherIconCode(data.daily.weather_code[index], false)
                }]
            }))
        };
        
        // Update UI
        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        
        // Update current location if available
        if (locationName) {
            currentLocation = locationName;
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Unable to fetch weather data. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Helper function to get weather condition from WMO code
function getWeatherCondition(code) {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    const conditions = {
        0: 'Clear',
        1: 'Clear',
        2: 'Clouds',
        3: 'Clouds',
        45: 'Mist',
        48: 'Mist',
        51: 'Drizzle',
        53: 'Drizzle',
        55: 'Drizzle',
        56: 'Drizzle',
        57: 'Drizzle',
        61: 'Rain',
        63: 'Rain',
        65: 'Rain',
        66: 'Rain',
        67: 'Rain',
        71: 'Snow',
        73: 'Snow',
        75: 'Snow',
        77: 'Snow',
        80: 'Rain',
        81: 'Rain',
        82: 'Rain',
        85: 'Snow',
        86: 'Snow',
        95: 'Thunderstorm',
        96: 'Thunderstorm',
        99: 'Thunderstorm'
    };
    
    return conditions[code] || 'Clear';
}

// Helper function to get weather description from WMO code
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    
    return descriptions[code] || 'Clear sky';
}

// Helper function to get weather icon code from WMO code
function getWeatherIconCode(code, isDay = true) {
    // Map WMO codes to OpenWeatherMap icon codes for compatibility with existing UI
    const iconMap = {
        // Clear
        0: isDay ? '01d' : '01n',
        1: isDay ? '01d' : '01n',
        // Partly cloudy
        2: isDay ? '02d' : '02n',
        3: isDay ? '03d' : '03n',
        // Fog
        45: isDay ? '50d' : '50n',
        48: isDay ? '50d' : '50n',
        // Drizzle
        51: isDay ? '09d' : '09n',
        53: isDay ? '09d' : '09n',
        55: isDay ? '09d' : '09n',
        56: isDay ? '09d' : '09n',
        57: isDay ? '09d' : '09n',
        // Rain
        61: isDay ? '10d' : '10n',
        63: isDay ? '10d' : '10n',
        65: isDay ? '10d' : '10n',
        66: isDay ? '10d' : '10n',
        67: isDay ? '10d' : '10n',
        // Snow
        71: isDay ? '13d' : '13n',
        73: isDay ? '13d' : '13n',
        75: isDay ? '13d' : '13n',
        77: isDay ? '13d' : '13n',
        // Rain showers
        80: isDay ? '09d' : '09n',
        81: isDay ? '09d' : '09n',
        82: isDay ? '09d' : '09n',
        // Snow showers
        85: isDay ? '13d' : '13n',
        86: isDay ? '13d' : '13n',
        // Thunderstorm
        95: isDay ? '11d' : '11n',
        96: isDay ? '11d' : '11n',
        99: isDay ? '11d' : '11n'
    };
    
    return iconMap[code] || (isDay ? '01d' : '01n');
}

// Update current weather UI
function updateCurrentWeather(data) {
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const speedUnit = currentUnit === 'metric' ? 'm/s' : 'mph';
    const current = data.current;
    
    locationElement.textContent = data.name;
    if (data.country) {
        locationElement.textContent += `, ${data.country}`;
    }
    
    currentTempElement.textContent = `${Math.round(current.temp)}${tempUnit}`;
    weatherConditionElement.textContent = current.weather[0].description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Update weather icon
    updateWeatherIcon(weatherIconElement, current.weather[0].icon);
    
    // Update weather details
    feelsLikeElement.textContent = `${Math.round(current.feels_like)}${tempUnit}`;
    windElement.textContent = `${current.wind_speed} ${speedUnit}`;
    humidityElement.textContent = `${current.humidity}%`;
    pressureElement.textContent = `${current.pressure} hPa`;
    
    // Update background based on weather condition
    updateBackground(current.weather[0].main);
}

// Update forecast UI
function updateForecast(data) {
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    
    // Skip today's forecast (index 0) and get next 5 days
    const forecastDays = data.list.slice(1, 6);
    
    forecastDays.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Create forecast item
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">
                ${getWeatherIcon(day.weather[0].icon)}
            </div>
            <div class="forecast-condition">${day.weather[0].main}</div>
            <div class="forecast-temp">
                <span class="temp-max">${Math.round(day.main.temp_max)}${tempUnit}</span>
                <span class="temp-min">${Math.round(day.main.temp_min)}${tempUnit}</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Update weather icon based on weather condition
function updateWeatherIcon(element, iconCode) {
    const iconClass = getWeatherIconClass(iconCode);
    element.innerHTML = `<i class="${iconClass}"></i>`;
}

// Get Font Awesome icon class based on OpenWeatherMap icon code
function getWeatherIconClass(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud-meatball',
        '04n': 'fas fa-cloud-meatball',
        '09d': 'fas fa-cloud-rain',
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'far fa-snowflake',
        '13n': 'far fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    
    return iconMap[iconCode] || 'fas fa-question';
}

// Get weather icon HTML
function getWeatherIcon(iconCode) {
    const iconClass = getWeatherIconClass(iconCode);
    return `<i class="${iconClass}"></i>`;
}

// Update background based on weather condition
function updateBackground(weatherCondition) {
    const body = document.body;
    
    // Remove all weather classes
    body.classList.remove(
        'clear-sky', 'few-clouds', 'scattered-clouds', 'broken-clouds',
        'shower-rain', 'rain', 'thunderstorm', 'snow', 'mist'
    );
    
    // Add appropriate class based on weather condition
    const conditionMap = {
        'Clear': 'clear-sky',
        'Clouds': 'scattered-clouds',
        'Drizzle': 'shower-rain',
        'Rain': 'rain',
        'Thunderstorm': 'thunderstorm',
        'Snow': 'snow',
        'Mist': 'mist',
        'Smoke': 'mist',
        'Haze': 'mist',
        'Dust': 'mist',
        'Fog': 'mist',
        'Sand': 'mist',
        'Ash': 'mist',
        'Squall': 'mist',
        'Tornado': 'thunderstorm'
    };
    
    const weatherClass = conditionMap[weatherCondition] || '';
    if (weatherClass) {
        body.classList.add(weatherClass);
    }
}

// Show loading spinner
function showLoading(show) {
    if (show) {
        loadingElement.classList.add('active');
    } else {
        loadingElement.classList.remove('active');
    }
}

// Show error message
function showError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message show';
    errorElement.textContent = message;
    
    // Insert error message after the header
    const header = document.querySelector('header');
    header.parentNode.insertBefore(errorElement, header.nextSibling);
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorElement.classList.remove('show');
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 300);
    }, 5000);
}

// Add CSS for weather backgrounds
const style = document.createElement('style');
style.textContent = `
    .clear-sky {
        --primary-color: #4361ee;
        --secondary-color: #3f37c9;
        background: linear-gradient(135deg, #64b5f6, #1976d2);
    }
    
    .few-clouds, .scattered-clouds, .broken-clouds {
        --primary-color: #5c6bc0;
        --secondary-color: #3949ab;
        background: linear-gradient(135deg, #90caf9, #5c6bc0);
    }
    
    .shower-rain, .rain {
        --primary-color: #3949ab;
        --secondary-color: #283593;
        background: linear-gradient(135deg, #bbdefb, #5c6bc0);
    }
    
    .thunderstorm {
        --primary-color: #311b92;
        --secondary-color: #1a237e;
        background: linear-gradient(135deg, #9fa8da, #5c6bc0);
    }
    
    .snow {
        --primary-color: #b3e5fc;
        --secondary-color: #81d4fa;
        background: linear-gradient(135deg, #e1f5fe, #b3e5fc);
        color: #333;
    }
    
    .snow .weather-details,
    .snow .forecast-item {
        color: #333;
    }
    
    .mist {
        --primary-color: #9e9e9e;
        --secondary-color: #757575;
        background: linear-gradient(135deg, #e0e0e0, #9e9e9e);
        color: #333;
    }
    
    .mist .weather-details,
    .mist .forecast-item {
        color: #333;
    }
`;
document.head.appendChild(style);
