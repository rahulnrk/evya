import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LocateFixed, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const LocationPicker = ({ formData, setFormData }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const locationButtonRef = useRef(null);

  const defaultLocation = { lat: 17.441692, lng: 78.38257 };

  const handleCurrentLocation = (e) => {
      e?.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(location);
            mapInstanceRef.current.setZoom(18);
            placeMarker(location);
            addPulseEffect(location);
          }
          setIsLoading(false);
        },
        (error) => {
          let errorMessage = 'Could not get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          setError(errorMessage);
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: errorMessage,
          });
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Unsupported Feature",
        description: "Geolocation is not supported by your browser",
      });
    }
  };

  const getAddressFromCoordinates = (lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setFormData((prev) => ({
          ...prev,
          address: results[0].formatted_address,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          address: 'Address not found',
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
      }
    });
  };

  const addPulseEffect = (location) => {
    const circle = new window.google.maps.Circle({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.35,
      map: mapInstanceRef.current,
      center: location,
      radius: 30,
    });
    setTimeout(() => circle.setMap(null), 1000);
  };

  const placeMarker = (location) => {
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });
    }

    getAddressFromCoordinates(lat, lng);
  };

  useEffect(() => {
    const initMap = () => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 15,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      markerRef.current = new window.google.maps.Marker({
        position: defaultLocation,
        map,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });

      // Handle map clicks
      map.addListener('click', (e) => {
        placeMarker(e.latLng);
      });

      // Create custom location button
      // const locationButton = document.createElement('button');
      const locationButton = document.createElement('button');
      locationButton.type = 'button'; // ✅ VERY IMPORTANT

      locationButton.innerHTML = `
        <div style="
          background: white;
          border: none;
          border-radius: 2px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;
      
      locationButton.style.margin = '10px';
      locationButton.title = 'Find my location';
      locationButton.addEventListener('click', handleCurrentLocation);
      
      // Store reference to remove later
      locationButtonRef.current = locationButton;
      
      map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
    };

    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError('Failed to load Google Maps API.');
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "Failed to load Google Maps. Please refresh the page.",
        });
      };
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (locationButtonRef.current) {
        locationButtonRef.current.removeEventListener('click', handleCurrentLocation);
      }
    };
  }, [setFormData, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Select Location
        </h2>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <LocateFixed className="h-4 w-4" />
          {isLoading ? "Locating..." : "Use Current Location"}
        </Button>
      </div>
      
      <div 
        id="map" 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-200 overflow-hidden"
      />
      
      {error && (
        <p className="text-sm text-red-500 text-center py-2">
          {error}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;