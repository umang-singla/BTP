let map = L.map('mapid').setView([40.730610, -73.935242], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let routingControl = 1;

var props = {};

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

// Define a custom control
var customControl = L.Control.extend({
    options: {
        position: 'bottomright' // Change position as needed
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = '<button class="btn btn-light" id="find_ride">Find Ride</button> <button class="btn btn-light" id="publish_ride" >Publish Ride</button>';
        return container;
    }
});

// Add the custom control to the map
map.addControl(new customControl());

customControl = L.Control.extend({
    options: {
        position: 'topright' // Change position as needed
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `<button id="dropbtn" class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                ☰
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#exampleModal">My Rides</a></li>
            </ul>`;
        return container;
    }
});


// Add the custom control to the map
map.addControl(new customControl());

document.getElementById("dropbtn").addEventListener('click', function(event){event.stopPropagation()})

function encrypt(key, value) {
    var publicKey = key;

    const encrypt = new JSEncrypt()
    encrypt.setPublicKey(publicKey)
    const encryptedText = encrypt.encrypt(value) || 'ENCRYPTION FAILED'
    return encryptedText
}

function decrypt(key, value) {
    var private_key = key;
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(key);
    const decryptedText = decrypt.decrypt(value) || 'DECRYPTION FAILED'
    return decryptedText
}
// Find Ride
document.getElementById('find_ride').addEventListener('click', function (event) {

    if (markers.length >= 2) {
        // Create a new instance of JSEncrypt
        var enc = new JSEncrypt();

        // Generate key pair with default key size (2048 bits)
        enc.getKey();

        // Get the public and private keys
        var publicKey = enc.getPublicKey();
        var privateKey = enc.getPrivateKey();

        let coordinates = [];

        for (let i = 0; i < props.coordinates.length; i++) {
            coordinates.push(encrypt(props.public_key, JSON.stringify(props.coordinates[i])));
        }

        let data = {
            public_key: publicKey,
            coordinates: coordinates
        }

        fetch("http://127.0.0.1:5000/find_ride", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the response body as JSON
        }).then(data => {
            window.alert(data.count + " rides found")
        })

    }

    event.stopPropagation();
});

// Publish Ride
document.getElementById('publish_ride').addEventListener('click', function (event) {

    if (markers.length >= 2) {
        // Create a new instance of JSEncrypt
        var enc = new JSEncrypt();

        // Generate key pair with default key size (2048 bits)
        enc.getKey();

        // Get the public and private keys
        var publicKey = enc.getPublicKey();
        var privateKey = enc.getPrivateKey();

        let coordinates = [];

        for (let i = 0; i < props.coordinates.length; i++) {
            coordinates.push(encrypt(props.public_key, JSON.stringify(props.coordinates[i])));
        }

        let data = {
            public_key: publicKey,
            coordinates: coordinates
        }

        fetch("http://127.0.0.1:5000/publish_ride", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the response body as JSON
        })

    }

    event.stopPropagation();
});

map.on('click', function (e) {
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
    }).on('routesfound', function (e) {
        console.log(e);
        props.coordinates = e.routes[0].coordinates;
        fetch('http://127.0.0.1:5000/generate_keys')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse the response body as JSON
            })
            .then(data => {
                // Do something with the data
                props.public_key = data.public_key;
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });

    }).addTo(map);
}