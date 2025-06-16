import React from "react";
import { Typography } from "@material-tailwind/react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LocationMarker from "./mapComponents/LocationMarker";
import LocationControl from "./mapComponents/LocationControl";

const LocationForm = ({
  location,
  setLocation,
  locationLoading,
  setLocationLoading,
  setError,
  setValidationErrors,
  markLocationAsTouched,
  API_URL,
  getCurrentLocation
}) => {
  return (
    <div className="flex flex-col gap-4">
      <Typography variant="small" color="gray">
        (Click on the map or use "Use My Location")
      </Typography>

      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={[35.6895, -0.6]}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            location={location}
            setLocation={setLocation}
            setLocationLoading={setLocationLoading}
            setError={setError}
            setValidationErrors={setValidationErrors}
            markLocationAsTouched={markLocationAsTouched}
            API_URL={API_URL}
          />
          <LocationControl
            position="topright"
            onButtonClick={getCurrentLocation}
            loading={locationLoading}
          />
        </MapContainer>
      </div>

      {location?.latitude && location?.longitude && (
        <div className="text-sm text-gray-600 mt-2">
          Selected Location:
          {location.address && <span> {location.address},</span>}
          {location.city && <span> {location.city},</span>}
          {location.state && <span> {location.state},</span>}
          {location.country && <span> {location.country}</span>}
          {location.postalCode && <span> {location.postalCode}</span>}
          {!(location.address || location.city || location.state || location.country || location.postalCode) && (
            <span> Latitude: {location.latitude.toFixed(4)}, Longitude: {location.longitude.toFixed(4)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationForm;