// Map initialization for contact page
function initContactMap(lat, lng, address) {
  document.addEventListener('DOMContentLoaded', function() {
    var mapElement = document.getElementById('contact-map');
    if (mapElement && typeof L !== 'undefined') {
      // Initialize the map
      var map = L.map('contact-map').setView([lat, lng], 15);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add marker
      L.marker([lat, lng]).addTo(map)
        .bindPopup('<b>Westminster Astronomical Society</b><br>' + address)
        .openPopup();
    }
  });
}
