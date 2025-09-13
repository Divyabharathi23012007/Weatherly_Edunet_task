# Weatherly - Dynamic Weather Dashboard

A responsive and interactive weather dashboard that provides real-time weather information for any location worldwide. Built with HTML, CSS, and JavaScript, this application uses the OpenWeatherMap API to fetch weather data and the Geolocation API to get the user's current location.

## Features

- Current weather conditions (temperature, feels like, humidity, wind speed, pressure)
- 5-day weather forecast
- Location-based weather using geolocation
- Search for weather by city name
- Toggle between Celsius and Fahrenheit
- Responsive design that works on all devices
- Beautiful UI with dynamic backgrounds based on weather conditions

## Getting Started

### Prerequisites

- A modern web browser
- An API key from OpenWeatherMap (free tier is sufficient)

### Setup

1. **Get an API Key**
   - Go to [OpenWeatherMap](https://openweathermap.org/)
   - Sign up for a free account
   - Navigate to the [API keys](https://home.openweathermap.org/api_keys) section
   - Copy your API key

2. **Configure the Application**
   - Open the `app.js` file
   - Locate the line: `const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';`
   - Replace `'YOUR_OPENWEATHERMAP_API_KEY'` with your actual API key

3. **Run the Application**
   - Open the `index.html` file in your web browser
   - Allow location access when prompted to see weather for your current location

## How to Use

- **Search for a City**: Type the name of a city in the search box and press Enter or click the search button
- **Use Current Location**: Click the location button to get weather for your current location
- **Toggle Units**: Switch between Celsius and Fahrenheit using the toggle in the bottom-right corner

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**:
  - OpenWeatherMap API for weather data
  - Geolocation API for user's current location
- **Icons**: Font Awesome for weather icons

## Project Structure

```
Weatherly/
├── index.html          # Main HTML file
├── styles.css          # Styles for the application
├── app.js             # JavaScript functionality
└── README.md          # This file
```

## Customization

You can customize the application by modifying the following:

- **Colors**: Update the CSS variables in the `:root` selector in `styles.css`
- **Styling**: Modify the CSS to match your preferred design
- **Features**: Extend the functionality by adding more weather data or features

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons by [Font Awesome](https://fontawesome.com/)
- Design inspiration from various weather applications
