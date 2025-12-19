import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Car Icon for Driver ---
const carIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
});

const IndoraMap = ({ pickup, dropoff, driverLocation, routeGeometry }) => {
  // Use a fallback center if everything is undefined to prevent the map itself from crashing
  const defaultCenter = [28.6139, 77.2090]; 
  const mapCenter = (pickup && pickup[0]) ? pickup : defaultCenter;

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* FIX: Only render if coordinates exist and are NOT undefined */}
      {pickup && pickup[0] && pickup[1] && (
        <Marker position={pickup}>
          <Popup>Pickup Point</Popup>
        </Marker>
      )}
      
      {dropoff && dropoff[0] && dropoff[1] && (
        <Marker position={dropoff}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {driverLocation && driverLocation[0] && driverLocation[1] && (
        <Marker position={driverLocation} icon={carIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {routeGeometry && (
        <GeoJSON 
          key={JSON.stringify(routeGeometry)} 
          data={routeGeometry} 
          style={{ color: "blue", weight: 5, opacity: 0.7 }} 
        />
      )}
    </MapContainer>
  );
};

export default IndoraMap;