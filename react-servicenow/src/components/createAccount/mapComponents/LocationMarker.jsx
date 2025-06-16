import React, { useEffect } from "react";
import { Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const LocationMarker = React.memo(({ 
  location, 
  setLocation, 
  setLocationLoading, 
  setError, 
  setValidationErrors,
  markLocationAsTouched,
  API_URL
}) => {
  const map = useMap();
  
  useMapEvents({
    async click(e) {
      setLocationLoading(true);
      setError("");
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.location;
        return newErrors;
      });

      try {
        const { lat, lng } = e.latlng;
        const response = await fetch(`${API_URL}/api/reverse-geocode?lat=${lat}&lng=${lng}`);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: 'Unknown error fetching address' }));
          throw new Error(`Geocoding failed: ${errorBody.message || response.statusText}`);
        }

        const addressData = await response.json();

        setLocation({
          latitude: lat,
          longitude: lng,
          address: addressData.address || '',
          city: addressData.city || '',
          state: addressData.state || '',
          country: addressData.country || '',
          postalCode: addressData.postalCode || '',
        });

        markLocationAsTouched();
        
        map.flyTo([lat, lng], 11, {
          animate: true,
          duration: 1
        });
      } catch (err) {
        console.error("Reverse geocoding error:", err);
        const errorMessage = `Could not get address details for this location: ${err.message || 'Network error'}`;
        setError(errorMessage);
        setValidationErrors(prev => ({
          ...prev,
          location: errorMessage,
        }));
      } finally {
        setLocationLoading(false);
      }
    }
  });

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      map.flyTo([location.latitude, location.longitude], 11, {
        animate: true,
        duration: 1
      });
    }
  }, [location?.latitude, location?.longitude, map]);

  return location?.latitude && location?.longitude ? (
    <Marker position={[location.latitude, location.longitude]} />
  ) : null;
});

export default LocationMarker;