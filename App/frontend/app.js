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
        position: 'topleft' // Change position as needed
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `<div id="dropbtn"><button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                ☰
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" onclick="fetch_rides()" href="#" data-bs-toggle="modal" data-bs-target="#exampleModal">My Rides</a></li>
            </ul></div>`;
        return container;
    }
});

const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

// Get the public and private keys
var publicKey = forge.pki.publicKeyToPem(keyPair.publicKey);
var privateKey = forge.pki.privateKeyToPem(keyPair.privateKey);;

function encrypt(key, value) {
    public_key = forge.pki.publicKeyFromPem(key);
    var encrypted = public_key.encrypt(value, "RSA-OAEP", {
        md: forge.md.sha256.create(),
        mgf1: forge.mgf1.create()
    });
    var base64 = forge.util.encode64(encrypted);
    return base64
}

function decrypt(key, value) {

    // Convert the provided private key from PEM format to a Forge private key object
    var private_key = forge.pki.privateKeyFromPem(key);

    // Convert the base64-encoded encrypted value to a byte buffer
    var encryptedValue = forge.util.decode64(value);

    try {
        // Decrypt the encrypted value using RSA-OAEP decryption
        var decrypted = private_key.decrypt(encryptedValue, "RSA-OAEP", {
            md: forge.md.sha256.create(),  // SHA-256 hashing algorithm
            mgf1: forge.mgf1.create()      // MGF1 mask generation function
        });

        // Return the decrypted value
        return decrypted;
    } catch (error) {
        // If decryption fails, return "DECRYPTION FAILED"
        return "DECRYPTION FAILED";
    }
}

function fetch_rides() {
    fetch('http://127.0.0.1:5000/fetch_rides')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the response body as JSON
        })
        .then(data => {
            let div = document.getElementById("exampleModal").childNodes[1].childNodes[1].childNodes[3]
            div.innerHTML = ""
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].coordinates.length; j++) {
                    data[i].coordinates[j].lat = decrypt(privateKey, data[i].coordinates[j].lat)
                    data[i].coordinates[j].lng = decrypt(privateKey, data[i].coordinates[j].lng)
                }
                div.innerHTML += `<div style="display: block !important; width: 100%;" class="toast align-items-center text-bg-primary border-0" role="alert" aria-live="assertive"
                        aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body" style="display:flex; justify-content: space-around; width: 100%;">
                                <p>From: [`+ data[i].coordinates[0].lat + ', ' + data[i].coordinates[0].lng + ']</p> <p>To: [' + data[i].coordinates[data[i].coordinates.length - 1].lat + ',' + data[i].coordinates[data[i].coordinates.length - 1].lng +`]</p>
                            </div>
                        </div>
                    </div><br>`
            }

            console.log(data);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}


// Add the custom control to the map
map.addControl(new customControl());

document.getElementById("dropbtn").addEventListener('click', function (event) { event.stopPropagation() })


// Find Ride
document.getElementById('find_ride').addEventListener('click', function (event) {

    if (markers.length >= 2) {

        let coordinates = [];

        for (let i = 0; i < props.coordinates.length; i++) {
            coordinates.push({
                lat: encrypt(props.public_key, JSON.stringify(props.coordinates[i].lat)),
                lng: encrypt(props.public_key, JSON.stringify(props.coordinates[i].lng))
            });
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

        let coordinates = [];

        for (let i = 0; i < props.coordinates.length; i++) {
            coordinates.push({
                lat: encrypt(props.public_key, JSON.stringify(props.coordinates[i].lat)),
                lng: encrypt(props.public_key, JSON.stringify(props.coordinates[i].lng))
            });
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