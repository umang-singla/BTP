let params = {};
let regex = /([^&=]+)=([^&]*)/g,
  m;
while ((m = regex.exec(location.href))) {
  params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
}

if (Object.keys(params).length > 0) {
  localStorage.setItem("authInfo", JSON.stringify(params));
}

// hide the access token
window.history.pushState({}, document.title, "/" + "profile.html");

let info = JSON.parse(localStorage.getItem("authInfo"));
let profile = "";

fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
  headers: {
    Authorization: `Bearer ${info["access_token"]}`,
  },
})
  .then((response) => {
    if (response.ok) {
      return response.json();
    } else return Promise.reject(response);
  })
  .then((info) => {
    profile = info;
  })
  .catch((error) => {
    location.href = "http://localhost:5500/index.html";
  });
function logout() {
  fetch("https://oauth2.googleapis.com/revoke?token=" + info["access_token"], {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
    },
  }).then((data) => {
    location.href = "http://localhost:5500/index.html";
  });
}

let map = L.map("mapid").setView([40.73061, -73.935242], 13);

let SERVER_URL = "http://10.5.16.160:5000/";
let KEY_SERVER_URL = "http://10.5.16.160:5050/";

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let markers = [];
let routingControl = 1;

var props = {};

const url = new URL(KEY_SERVER_URL + "get_public_key");
url.searchParams.append("username", "prot1_serv");

fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json(); // Parse the response body as JSON
  })
  .then((data) => {
    // Do something with the data
    props.public_key = data.public_key;
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });

// Initialize the geosearch control
const pickupSearch = new GeoSearch.GeoSearchControl({
  provider: new GeoSearch.OpenStreetMapProvider(),
  style: "bar",
  autoComplete: true, // Optional: to enable autocomplete
  autoCompleteDelay: 250, // Optional: adjust the delay until the autocomplete starts
  showMarker: true, // Optional: show a marker at the location of the search result
  retainZoomLevel: false, // Optional: retain the zoom level after selecting a search result
  animateZoom: true, // Optional: animate the zoom to the search result
});

const dropoffSearch = new GeoSearch.GeoSearchControl({
  provider: new GeoSearch.OpenStreetMapProvider(),
  style: "bar",
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
    position: "bottomright", // Change position as needed
  },

  onAdd: function (map) {
    var container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    container.innerHTML =
      '<button class="btn btn-light" data-bs-toggle="modal" data-bs-target="#staticBackdrop" id="find_ride">Find Ride</button> <button class="btn btn-light" id="publish_ride" >Publish Ride</button>';
    return container;
  },
});

// Add the custom control to the map
map.addControl(new customControl());

customControl = L.Control.extend({
  options: {
    position: "topleft", // Change position as needed
  },

  onAdd: function (map) {
    var container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    container.innerHTML = `<div id="dropbtn"><button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                ☰
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" onclick="fetch_rides()" href="#" data-bs-toggle="modal" data-bs-target="#exampleModal">My Rides</a></li>
                <li><a class="dropdown-item" onclick="logout()" href="#">Logout</a></li>
            </ul></div>`;
    return container;
  },
});

const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });

// Function to generate a random key and IV
function generateKeyAndIV() {
  return {
    key: forge.random.getBytesSync(16), // AES-128
    iv: forge.random.getBytesSync(16), // Initialization vector
  };
}

function aes_encrypt(plaintext, key, iv) {
  const cipher = forge.cipher.createCipher("AES-CBC", key);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(plaintext));
  cipher.finish();
  const encrypted = cipher.output.getBytes();
  return forge.util.encode64(encrypted);
}

function aes_decrypt(ciphertext, key, iv) {
  const decipher = forge.cipher.createDecipher("AES-CBC", key);
  decipher.start({ iv: iv });
  decipher.update(forge.util.createBuffer(forge.util.decode64(ciphertext)));
  decipher.finish();
  return decipher.output.toString();
}

// Usage
const key = forge.random.getBytesSync(16);
const iv = forge.random.getBytesSync(16);

// Get the public and private keys
var publicKey = forge.pki.publicKeyToPem(keyPair.publicKey);
var privateKey = forge.pki.privateKeyToPem(keyPair.privateKey);

function encrypt(key, value) {
  public_key = forge.pki.publicKeyFromPem(key);
  var encrypted = public_key.encrypt(value, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: forge.mgf1.create(),
  });
  var base64 = forge.util.encode64(encrypted);
  return base64;
}

function decrypt(key, value) {
  // Convert the provided private key from PEM format to a Forge private key object
  var private_key = forge.pki.privateKeyFromPem(key);

  // Convert the base64-encoded encrypted value to a byte buffer
  var encryptedValue = forge.util.decode64(value);

  try {
    // Decrypt the encrypted value using RSA-OAEP decryption
    var decrypted = private_key.decrypt(encryptedValue, "RSA-OAEP", {
      md: forge.md.sha256.create(), // SHA-256 hashing algorithm
      mgf1: forge.mgf1.create(), // MGF1 mask generation function
    });

    // Return the decrypted value
    return decrypted;
  } catch (error) {
    // If decryption fails, return "DECRYPTION FAILED"
    return "DECRYPTION FAILED";
  }
}

function fetch_rides() {
  let data = JSON.parse(localStorage.getItem(profile.email)).routes;
  let div =
    document.getElementById("exampleModal").childNodes[1].childNodes[1]
      .childNodes[3];
  div.innerHTML = "";
  for (let i = 0; i < data.length; i++) {
    div.innerHTML +=
      `<div style="display: block !important; width: 100%;" class="toast align-items-center text-bg-primary border-0" role="alert" aria-live="assertive"
                        aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body" style="display:flex; justify-content: space-around; width: 100%;">
                                <p>From: [` +
      data[i][0].lat +
      ", " +
      data[i][0].lng +
      "]</p> <p>To: [" +
      data[i][data[i].length - 1].lat +
      "," +
      data[i][data[i].length - 1].lng +
      `]</p>
                            </div>
                        </div>
                    </div><br>`;
  }

}

// Add the custom control to the map
map.addControl(new customControl());

document.getElementById("dropbtn").addEventListener("click", function (event) {
  event.stopPropagation();
});

// Find Ride
document
  .getElementById("find_ride")
  .addEventListener("click", function (event) {
    let t1 = new Date()
    if (markers.length >= 2) {
      let coordinates = [];

      for (let i = 0; i < props.coordinates.length; i++) {
        coordinates.push({
          lat: aes_encrypt(JSON.stringify(props.coordinates[i].lat), key, iv),
          lng: aes_encrypt(JSON.stringify(props.coordinates[i].lng), key, iv),
        });
      }

      let data = {
        key: encrypt(props.public_key, key),
        iv: encrypt(props.public_key, iv),
        coordinates: coordinates,
        email: aes_encrypt(profile.email, key, iv),
      };


      fetch(SERVER_URL + "find_ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json(); // Parse the response body as JSON
        })
        .then((data) => {
          let div =
            document.getElementById("staticBackdrop").childNodes[1]
              .childNodes[1].childNodes[3];
          for (let i = 0; i < data.routes.length; i++) {
            for (let j = 0; j < data.routes[i].coordinates.length; j++) {
              data.routes[i].coordinates[j][0] = aes_decrypt(
                data.routes[i].coordinates[j][0],
                key,
                iv
              );
              data.routes[i].coordinates[j][1] = aes_decrypt(
                data.routes[i].coordinates[j][1],
                key,
                iv
              );
            }
            div.innerHTML +=
              `<div style="display: block !important; width: 100%;" class="toast align-items-center text-bg-primary border-0" role="alert" aria-live="assertive"
                    aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body" style="width: 100%;">
                            <p>Name: ` +
              aes_decrypt(data.routes[i].name, key, iv) +
              `</p>
                            <p>Email: ` +
              aes_decrypt(data.routes[i].email, key, iv) +
              `</p>
                            <p>From: [` +
              data.routes[i].coordinates[0][0] +
              ", " +
              data.routes[i].coordinates[0][1] +
              "]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;To: [" +
              data.routes[i].coordinates[
                data.routes[i].coordinates.length - 1
              ][0] +
              "," +
              data.routes[i].coordinates[
                data.routes[i].coordinates.length - 1
              ][1] +
              `]</p>
                        </div>
                    </div>
                </div><br>`;
          }
          let t2 = new Date()
          console.log(t2-t1)
          window.alert(data.count + " rides found");
        });
    }

    event.stopPropagation();
  });

// Publish Ride
document
  .getElementById("publish_ride")
  .addEventListener("click", function (event) {
    let t1 = new Date()
    if (markers.length >= 2) {
      let coordinates = [];

      let temp_data = localStorage.getItem(profile.email);
      if (temp_data == null) {
        localStorage.setItem(
          profile.email,
          JSON.stringify({
            routes: [props.coordinates],
            name: profile.name,
          })
        );
      } else {
        temp_data = JSON.parse(temp_data);
        temp_data.routes.push(props.coordinates);
        localStorage.setItem(profile.email, JSON.stringify(temp_data));
      }

      for (let i = 0; i < props.coordinates.length; i++) {
        coordinates.push({
          lat: aes_encrypt(JSON.stringify(props.coordinates[i].lat), key, iv),
          lng: aes_encrypt(JSON.stringify(props.coordinates[i].lng), key, iv),
        });
      }
      let data = {
        coordinates: coordinates,
        key: encrypt(props.public_key, key),
        iv: encrypt(props.public_key, iv),
        email: aes_encrypt(profile.email, key, iv),
        name: aes_encrypt(profile.name, key, iv),
      };

      fetch(SERVER_URL + "publish_ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json(); // Parse the response body as JSON
      });
    }
    let t2 = new Date();
    console.log("Publish Ride: ", t2-t1)
    event.stopPropagation();
  });

map.on("click", function (e) {
  if (markers.length >= 2) {
    clearMap();
  }

  const newMarker = L.marker(e.latlng).addTo(map);
  markers.push(newMarker);

  if (markers.length >= 2) {
    redrawRoutes();
  }
});

document.getElementById("clearMap").addEventListener("click", clearMap);

function clearMap() {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];
  map.removeControl(routingControl);
}

function redrawRoutes() {
  routingControl = L.Routing.control({
    waypoints: [markers[0]._latlng, markers[1]._latlng],
  })
    .on("routesfound", function (e) {
      props.coordinates = e.routes[0].coordinates;
    })
    .addTo(map);
}
