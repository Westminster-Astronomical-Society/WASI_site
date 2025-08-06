// Global variables
let currentLatitude = 39.647398; // Blaine F. Roelke Memorial Observatory
let currentLongitude = -76.987309; // Blaine F. Roelke Memorial Observatory

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if almanac elements exist
    if (!document.getElementById('date')) {
        return; // Not on almanac page
    }
    
    // Set default date to today
    const today = new Date();
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today.toISOString().split('T')[0];
    }
    
    // Set default coordinates in input fields
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    
    if (latInput) latInput.value = currentLatitude;
    if (lonInput) lonInput.value = currentLongitude;
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial update
    updateDateDisplay();
    updateLocationDisplay();
    updateTimes();
    
    // Start the clock if clock elements exist
    if (document.getElementById('local-time')) {
        updateClock();
        setInterval(updateClock, 1000);
    }
});

// Setup event listeners for automatic updates
function setupEventListeners() {
    // Date picker change event
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            updateTimes();
        });
    }
    
    // Latitude input events
    const latInput = document.getElementById('latitude');
    if (latInput) {
        latInput.addEventListener('change', function() {
            updateTimes();
        });
        
        latInput.addEventListener('input', function() {
            clearTimeout(window.latTimeout);
            window.latTimeout = setTimeout(() => {
                const value = parseFloat(this.value);
                if (!isNaN(value) && value >= -90 && value <= 90) {
                    updateTimes();
                }
            }, 1000);
        });
    }
    
    // Longitude input events
    const lonInput = document.getElementById('longitude');
    if (lonInput) {
        lonInput.addEventListener('change', function() {
            updateTimes();
        });
        
        lonInput.addEventListener('input', function() {
            clearTimeout(window.lonTimeout);
            window.lonTimeout = setTimeout(() => {
                const value = parseFloat(this.value);
                if (!isNaN(value) && value >= -180 && value <= 180) {
                    updateTimes();
                }
            }, 1000);
        });
    }
}

// Update date display
function updateDateDisplay() {
    const dateInput = document.getElementById('date');
    if (!dateInput) return;
    
    const selectedDate = dateInput.value ? new Date(dateInput.value + 'T00:00:00') : new Date();
    const followingDay = new Date(selectedDate);
    followingDay.setDate(followingDay.getDate() + 1);
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    safeUpdateElement('today-date', selectedDate.toLocaleDateString('en-US', options));
    safeUpdateElement('tomorrow-date', followingDay.toLocaleDateString('en-US', options));
}

// Get current location using geolocation API
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                currentLatitude = position.coords.latitude;
                currentLongitude = position.coords.longitude;
                
                // Update input fields
                const latInput = document.getElementById('latitude');
                const lonInput = document.getElementById('longitude');
                if (latInput) latInput.value = currentLatitude.toFixed(6);
                if (lonInput) lonInput.value = currentLongitude.toFixed(6);
                
                updateLocationDisplay();
                updateTimes();
            },
            function(error) {
                console.error('Error getting location:', error);
                alert('Could not get your location. Please enter coordinates manually.');
            }
        );
    } else {
        alert('Geolocation is not supported by this browser. Please enter coordinates manually.');
    }
}

// Update location display
function updateLocationDisplay() {
    if (currentLatitude !== null && currentLongitude !== null) {
        const latDir = currentLatitude >= 0 ? 'N' : 'S';
        const lonDir = currentLongitude >= 0 ? 'E' : 'W';
        const latDisplay = Math.abs(currentLatitude).toFixed(4) + '°' + latDir;
        const lonDisplay = Math.abs(currentLongitude).toFixed(4) + '°' + lonDir;
        
        const locationElement = document.getElementById('location-display');
        if (!locationElement) return;
        
        // Check if it's the default Blaine F. Roelke Memorial Observatory location
        if (Math.abs(currentLatitude - 39.647398) < 0.0001 && Math.abs(currentLongitude - (-76.987309)) < 0.0001) {
            locationElement.textContent = `Blaine F. Roelke Memorial Observatory (${latDisplay}, ${lonDisplay})`;
        } else {
            locationElement.textContent = `${latDisplay}, ${lonDisplay}`;
        }
    }
}

// Update times based on current coordinates
function updateTimes() {
    // Get coordinates from input fields or use current location
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    
    if (latInput && lonInput && latInput.value && lonInput.value) {
        currentLatitude = parseFloat(latInput.value);
        currentLongitude = parseFloat(lonInput.value);
    }
    
    if (currentLatitude === null || currentLongitude === null || isNaN(currentLatitude) || isNaN(currentLongitude)) {
        console.error('Invalid coordinates');
        return;
    }
    
    updateLocationDisplay();
    updateDateDisplay();
    
    // Get selected date or use today
    const dateInput = document.getElementById('date');
    const selectedDate = dateInput && dateInput.value ? new Date(dateInput.value + 'T00:00:00') : new Date();
    const followingDay = new Date(selectedDate);
    followingDay.setDate(followingDay.getDate() + 1);
    
    try {
        // Get sun times for selected date (sunset and twilight endings)
        const selectedDateTimes = SunCalc.getTimes(selectedDate, currentLatitude, currentLongitude);
        
        // Get sun times for following day (twilight beginnings and sunrise)
        const followingDayTimes = SunCalc.getTimes(followingDay, currentLatitude, currentLongitude);
        
        // Update selected date times
        updateTimeDisplay('sunset-time', selectedDateTimes.sunset);
        updateTimeDisplay('civil-end-time', selectedDateTimes.dusk);
        updateTimeDisplay('nautical-end-time', selectedDateTimes.nauticalDusk);
        updateTimeDisplay('astronomical-end-time', selectedDateTimes.night);
        
        // Update following day times
        updateTimeDisplay('astronomical-begin-time', followingDayTimes.nightEnd);
        updateTimeDisplay('nautical-begin-time', followingDayTimes.nauticalDawn);
        updateTimeDisplay('civil-begin-time', followingDayTimes.dawn);
        updateTimeDisplay('sunrise-time', followingDayTimes.sunrise);
        
        // Update moon information
        updateMoonInformation(selectedDate);
        
    } catch (error) {
        console.error('Error calculating sun times:', error);
    }
}

// Helper function to safely update DOM elements
function safeUpdateElement(elementId, textContent) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = textContent;
    }
}

// Helper function to format and display time
function updateTimeDisplay(elementId, timeValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (!timeValue || isNaN(timeValue.getTime())) {
        element.textContent = 'N/A';
        return;
    }
    
    // Format time in 24-hour format
    const timeString = timeValue.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    element.textContent = timeString;
}

// Update moon information
function updateMoonInformation(date) {
    try {
        // Get moon illumination and phase
        const moonIllumination = SunCalc.getMoonIllumination(date);
        
        // Get moon rise/set times
        const moonTimes = SunCalc.getMoonTimes(date, currentLatitude, currentLongitude);
        
        // Update moon phase
        const phase = getMoonPhaseName(moonIllumination.phase);
        safeUpdateElement('moon-phase-short', phase);
        
        // Update illumination percentage
        const illuminationPercent = Math.round(moonIllumination.fraction * 100);
        safeUpdateElement('moon-illumination', illuminationPercent + '%');
        
        // Calculate moon position at transit (highest point)
        const transitTime = calculateMoonTransit(date);
        if (transitTime) {
            const transitPos = SunCalc.getMoonPosition(transitTime, currentLatitude, currentLongitude);
            
            const transitTimeString = transitTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            safeUpdateElement('moon-meridian', transitTimeString);
            
            const elevation = (transitPos.altitude * 180 / Math.PI);
            safeUpdateElement('moon-elevation', elevation.toFixed(1) + '°');
        } else {
            safeUpdateElement('moon-meridian', 'N/A');
            safeUpdateElement('moon-elevation', 'N/A');
        }
        
        // Update moonrise
        if (moonTimes.rise) {
            const moonriseString = moonTimes.rise.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            safeUpdateElement('moonrise-time', moonriseString);
            
            const risePos = SunCalc.getMoonPosition(moonTimes.rise, currentLatitude, currentLongitude);
            const riseAzimuth = (risePos.azimuth * 180 / Math.PI + 180) % 360;
            safeUpdateElement('moonrise-azimuth', riseAzimuth.toFixed(0) + '°');
        } else {
            safeUpdateElement('moonrise-time', 'N/A');
            safeUpdateElement('moonrise-azimuth', 'N/A');
        }
        
        // Update moonset
        if (moonTimes.set) {
            const moonsetString = moonTimes.set.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            safeUpdateElement('moonset-time', moonsetString);
            
            const setPos = SunCalc.getMoonPosition(moonTimes.set, currentLatitude, currentLongitude);
            const setAzimuth = (setPos.azimuth * 180 / Math.PI + 180) % 360;
            safeUpdateElement('moonset-azimuth', setAzimuth.toFixed(0) + '°');
        } else {
            safeUpdateElement('moonset-time', 'N/A');
            safeUpdateElement('moonset-azimuth', 'N/A');
        }
        
    } catch (error) {
        console.error('Error calculating moon information:', error);
    }
}

// Calculate moon transit (highest point in sky)
function calculateMoonTransit(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    let maxAltitude = -Math.PI/2;
    let transitTime = null;
    
    // Check every 15 minutes throughout the day
    for (let hour = 0; hour < 24; hour += 0.25) {
        const checkTime = new Date(startOfDay.getTime() + hour * 3600000);
        const pos = SunCalc.getMoonPosition(checkTime, currentLatitude, currentLongitude);
        
        if (pos.altitude > maxAltitude) {
            maxAltitude = pos.altitude;
            transitTime = checkTime;
        }
    }
    
    return transitTime;
}

// Helper function to get moon phase name
function getMoonPhaseName(phase) {
    if (phase < 0.01) return 'New Moon';
    if (phase < 0.24) return 'Waxing Crescent';
    if (phase < 0.26) return 'First Quarter';
    if (phase < 0.49) return 'Waxing Gibbous';
    if (phase < 0.51) return 'Full Moon';
    if (phase < 0.74) return 'Waning Gibbous';
    if (phase < 0.76) return 'Last Quarter';
    if (phase < 0.99) return 'Waning Crescent';
    return 'New Moon';
}

// Clock update functions
function updateClock() {
    const now = new Date();
    
    // Get timezone abbreviation
    const timeZoneAbbr = getTimezoneAbbreviation(now);
    
    // Local time in 24h format
    const localTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    // UTC time
    const utcTime = now.toUTCString().slice(17, 25); // Extract HH:MM:SS
    
    // Calculate sidereal time
    const siderealTime = calculateSiderealTime(now, currentLongitude);
    
    // Update display
    safeUpdateElement('local-time', `${localTime} ${timeZoneAbbr}`);
    safeUpdateElement('utc-time', `UTC: ${utcTime}`);
    safeUpdateElement('sidereal-time', siderealTime);
}

// Calculate Local Sidereal Time
function calculateSiderealTime(date, longitude) {
    // Convert date to Julian Day Number
    const jd = getJulianDay(date);
    
    // Calculate Greenwich Sidereal Time
    const T = (jd - 2451545.0) / 36525.0;
    const gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000.0;
    
    // Calculate Local Sidereal Time
    const lst = gst + longitude;
    
    // Normalize to 0-360 degrees
    const normalizedLst = ((lst % 360) + 360) % 360;
    
    // Convert degrees to hours (360 degrees = 24 hours)
    const hours = normalizedLst / 15.0;
    
    // Extract hours, minutes, seconds
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Helper function to calculate Julian Day Number
function getJulianDay(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    
    // Convert time to decimal days
    const decimalDay = day + (hour + minute / 60.0 + second / 3600.0) / 24.0;
    
    // Calculate Julian Day Number
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    
    return decimalDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getTimezoneAbbreviation(date) {
    const timeString = date.toLocaleTimeString('en-US', {
        timeZoneName: 'short'
    });
    const parts = timeString.split(' ');
    return parts[parts.length - 1];
}

// Make getCurrentLocation available globally
window.getCurrentLocation = getCurrentLocation;
