// src/components/IndoraMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Car Icon
const carIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
});

const IndoraMap = ({ pickup, dropoff, driverLocation, routeGeometry }) => {
    // Default to Nagpur center if no coordinates provided
    const defaultCenter = [21.1458, 79.0882];
    const mapCenter = (pickup && pickup[0]) ? pickup : defaultCenter;

    return (
        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Pickup Marker */}
            {pickup && pickup[0] && (
                <Marker position={pickup}>
                    <Popup>Pickup Location</Popup>
                </Marker>
            )}

            {/* Destination Marker */}
            {dropoff && dropoff[0] && (
                <Marker position={dropoff}>
                    <Popup>Destination</Popup>
                </Marker>
            )}

            {/* Driver's Current Location */}
            {driverLocation && driverLocation[0] && (
                <Marker position={driverLocation} icon={carIcon}>
                    <Popup>You are here</Popup>
                </Marker>
            )}

            {/* Route Geometry Line */}
            {routeGeometry && <GeoJSON data={routeGeometry} />}
        </MapContainer>
    );
};

export default IndoraMap;