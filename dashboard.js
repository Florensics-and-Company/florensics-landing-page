// Demo API fetch simulation
function fetchDashboardData() {
    // Replace with real API call
    return Promise.resolve({
        temperature: 23.5,
        humidity: 48,
        fire: false,
        smoke: 42
    });
}

function updateDashboard(data) {
    document.getElementById('temperature-value').textContent = `${data.temperature} °C`;
    document.getElementById('humidity-value').textContent = `${data.humidity} %`;
    document.getElementById('fire-value').textContent = data.fire ? 'Fire detected' : 'Clear';
    document.getElementById('fire-box').classList.toggle('fire-active', data.fire);
    document.getElementById('smoke-value').textContent = data.smoke;
    if (data.smoke > 50) {
        document.getElementById('smoke-warning').style.display = 'block';
    } else {
        document.getElementById('smoke-warning').style.display = 'none';
    }
}

// Map setup for Lisbon Exhibition & Congress Centre
function setupMap(data) {
    // Determine whether to show the marker: only when temperature is a valid number
    var showMarker = data && typeof data.temperature === 'number' && !isNaN(data.temperature);

    // Check if Leaflet is loaded; if not, insert a simple OpenStreetMap iframe fallback
    if (typeof L === 'undefined' || !L.map) {
        console.warn('Leaflet not loaded — inserting simple OSM iframe fallback');
        var mapContainer = document.getElementById('map');
        if (mapContainer) {
            var lat = 38.7681, lon = -9.0946, zoom = 15;
            var delta = 0.02; // bbox half-size for embed
            var left = lon - delta, right = lon + delta, bottom = lat - delta, top = lat + delta;
            // only include marker parameter when showMarker is true
            var markerParam = showMarker ? ('&marker=' + lat + ',' + lon) : '';
            var src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + left + ',' + bottom + ',' + right + ',' + top + '&layer=mapnik' + markerParam;
            mapContainer.innerHTML = '<iframe src="' + src + '" style="border:0;width:100%;height:350px;border-radius:16px;display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
                '<p style="text-align:center;margin-top:8px;">' +
                '<a href="https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lon + '#map=' + zoom + '/' + lat + '/' + lon + '" target="_blank" rel="noopener noreferrer" style="color:inherit;">Open larger map</a>' +
                '</p>';
        }
        return;
    }

    var mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Reset map container
    mapContainer.style.height = '350px';
    mapContainer.innerHTML = '';

    var center = [38.7681, -9.0946];

    var map = L.map('map', {
        zoomControl: true,
        scrollWheelZoom: true,
        minZoom: 3,
        maxZoom: 18
    }).setView(center, 13);

    // Use OpenStreetMap tiles (standard OSM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a','b','c']
    }).addTo(map);

    // Add default Leaflet marker and popup with the label only if showMarker is true
    var marker;
    if (showMarker) {
        marker = L.marker(center, { title: 'Oak N001' }).addTo(map);
        marker.bindPopup('<strong>Oak N001</strong>', { className: 'dark-popup' });
    }

    // Force a map refresh after initialization
    setTimeout(function() {
        try { map.invalidateSize(); } catch (e) { /* ignore */ }
        if (marker) { try { marker.openPopup(); } catch (e2) { /* ignore */ } }
    }, 120);
}

// Wait for full page load including stylesheets
window.addEventListener('load', function() {
    // Attempt to setup map with retry
    var retryCount = 0;
    var maxRetries = 3;

    function attemptMapSetup(data) {
        try {
            setupMap(data);
        } catch (error) {
            console.error('Error setting up map:', error);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log('Retrying map setup (' + retryCount + '/' + maxRetries + ')...');
                setTimeout(function() { attemptMapSetup(data); }, 1000); // Retry after 1 second
            } else {
                var mapContainer = document.getElementById('map');
                if (mapContainer) {
                    mapContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Unable to load map. Please refresh the page.</div>';
                }
            }
        }
    }

    fetchDashboardData().then(function(data) {
        updateDashboard(data);
        attemptMapSetup(data);
    }).catch(function(error) {
        console.error('Error fetching dashboard data:', error);
        // still try to setup map without data
        attemptMapSetup();
    });
});