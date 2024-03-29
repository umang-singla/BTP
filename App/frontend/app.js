let map = L.map('mapid').setView([40.730610, -73.935242], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let routingControl = 1;

// Initialize the geosearch control
const pickupSearch = new GeoSearch.GeoSearchControl({
  provider: new GeoSearch.OpenStreetMapProvider(),
  style: 'bar',
  autoComplete: true, // Optional: to enable autocomplete
  autoCompleteDelay: 250, // Optional: adjust the delay until the autocomplete starts
  showMarker: true, // Optional: show a marker at the location of the search result
  retainZoomLevel: false, // Optional: retain the zoom level after selecting a search result
  animateZoom: true, // Optional: animate the zoom to the search result
});


const dropoffSearch = new GeoSearch.GeoSearchControl({
    provider: new GeoSearch.OpenStreetMapProvider(),
    style: 'bar',
    autoComplete: true, // Optional: to enable autocomplete
    autoCompleteDelay: 250, // Optional: adjust the delay until the autocomplete starts
    showMarker: true, // Optional: show a marker at the location of the search result
    retainZoomLevel: false, // Optional: retain the zoom level after selecting a search result
    animateZoom: true, // Optional: animate the zoom to the search result
  });

map.addControl(pickupSearch);
// map.addControl(dropoffSearch);

map.on('click', function(e) {
    if (markers.length >= 2) {
        clearMap();
    }

    const newMarker = L.marker(e.latlng).addTo(map);
    markers.push(newMarker);
    
    if (markers.length >= 2) {
        redrawRoutes();
    }
});

document.getElementById('clearMap').addEventListener('click', clearMap);

function clearMap() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    map.removeControl(routingControl);
}

function redrawRoutes() {
    routingControl = L.Routing.control({
        waypoints: [
            markers[0]._latlng,
            markers[1]._latlng
        ]
    }).on('routesfound', function(e){
        console.log(e);
    }).addTo(map);
}