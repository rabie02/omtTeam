import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function LocationInfoForm({ open, setOpen, initialData = {} }) {
  const handleCancel = () => setOpen(false);
  const [mapReady, setMapReady] = useState(false);

  // Get coordinates from location data
  const getCoordinates = () => {
    if (initialData?.latitude && initialData?.longitude) {
      return [parseFloat(initialData.latitude), parseFloat(initialData.longitude)];
    }
    if (initialData?.coordinates?.length === 2) {
      return initialData.coordinates;
    }
    return null;
  };

  const coordinates = getCoordinates();
  const defaultPosition = [51.505, -0.09]; // London coordinates as fallback
  const position = coordinates || defaultPosition;
  const mapZoom = coordinates ? 5 : 2; // Adjusted zoom level (13 is a good middle ground)

  const formatFullAddress = () => {
    const parts = [
      initialData?.address,
      initialData?.city,
      initialData?.state,
      initialData?.postalCode,
      initialData?.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        setMapReady(true);
      }, 300);
    } else {
      setMapReady(false);
    }
  }, [open]);

  return (
    <Modal
      title={`Location Details: ${initialData?.name || ''}`}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      style={{ top: 20 }}
      width={900}
      afterOpenChange={() => {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 300);
      }}
    >
      <div className="grid grid-cols-1 gap-6" style={{ height: '300px' }}>
        {/* Map Section */}
        <div style={{ 
          height: '300px', 
          width: '100%', 
          zIndex: 1,
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          backgroundColor: !coordinates ? '#f0f0f0' : 'transparent'
        }}>
          {!coordinates && (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666'
            }}>
              No location coordinates available
            </div>
          )}
          
          {mapReady && coordinates && (
            <MapContainer 
              center={position} 
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(map) => {
                setTimeout(() => map.invalidateSize(), 100);
              }}
            >
              <MapViewUpdater center={position} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h4 style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                      {initialData?.name || 'Location'}
                    </h4>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Address:</strong> {formatFullAddress() || 'N/A'}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Coordinates:</strong> {position[0]?.toFixed(6)}, {position[1]?.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          )}
        </div>

      </div>
      {/* Location details form */}
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <label className="block font-medium mb-1">Location Name</label>
            <input
              value={initialData?.name || 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          {/* Full Address Display */}
          <div className="col-span-2">
            <label className="block font-medium mb-1">Full Address</label>
            <textarea
              value={formatFullAddress() || 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
              rows={2}
            />
          </div>

          {/* Individual Address Components */}
          <div>
            <label className="block font-medium mb-1">Street Address</label>
            <input
              value={initialData?.address || 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">City</label>
            <input
              value={initialData?.city || 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">State/Province</label>
            <input
              value={initialData?.state || 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Postal Code</label>
            <input
              value={initialData?.postalCode || 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Country</label>
            <input
              value={initialData?.country || 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>

          {/* Account */}
          <div>
          <label className="block font-medium mb-1">Account</label>
          <input
            value={initialData?.account?.name || 'N/A'}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

          {/* Timestamps */}
          <div>
            <label className="block font-medium mb-1">Created On</label>
            <input
              value={initialData?.createdAt ? 
                new Date(initialData.createdAt).toLocaleString() : 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-1">Updated At</label>
            <input
              value={initialData?.updatedAt ? 
                new Date(initialData.updatedAt).toLocaleString() : 'N/A'}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
    </Modal>
  );
}

export default LocationInfoForm;