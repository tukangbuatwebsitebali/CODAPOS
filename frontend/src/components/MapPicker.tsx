'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
    height?: string;
}

export default function MapPicker({ latitude, longitude, onChange, height = '300px' }: MapPickerProps) {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [locating, setLocating] = useState(false);

    const updateMarker = useCallback((lat: number, lng: number) => {
        if (!mapRef.current) return;

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            // Custom icon
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    width: 36px; height: 36px;
                    background: linear-gradient(135deg, #1DA1F2, #0d8ecf);
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px rgba(29,161,242,0.4);
                    border: 3px solid white;
                ">
                    <div style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold;">📍</div>
                </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });

            markerRef.current = L.marker([lat, lng], {
                draggable: true,
                icon,
            }).addTo(mapRef.current);

            markerRef.current.on('dragend', () => {
                const pos = markerRef.current!.getLatLng();
                onChange(pos.lat, pos.lng);
            });
        }

        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }, [onChange]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Default: Bali center if no coords
        const initLat = latitude || -8.4095;
        const initLng = longitude || 115.1889;

        mapRef.current = L.map(containerRef.current, {
            center: [initLat, initLng],
            zoom: 15,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapRef.current);

        // Click to pin
        mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
            updateMarker(e.latlng.lat, e.latlng.lng);
            onChange(e.latlng.lat, e.latlng.lng);
        });

        // Place initial marker if coords valid
        if (latitude && longitude) {
            updateMarker(initLat, initLng);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                updateMarker(lat, lng);
                onChange(lat, lng);
                mapRef.current?.setView([lat, lng], 17);
                setLocating(false);
            },
            () => {
                setLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="relative rounded-xl overflow-hidden border border-white/10">
            <div ref={containerRef} style={{ height, width: '100%' }} />

            {/* Locate Me button */}
            <button
                type="button"
                onClick={handleLocateMe}
                disabled={locating}
                className="absolute top-3 right-3 z-[1000] flex items-center gap-2 px-3 py-2 bg-[#1DA1F2] text-white text-xs font-medium rounded-lg shadow-lg hover:bg-[#1DA1F2]/80 transition-colors disabled:opacity-50"
            >
                <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                {locating ? 'Mencari...' : 'Lokasi Saya'}
            </button>

            {/* Coords display */}
            {latitude && longitude ? (
                <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-white/80">
                    <MapPin className="w-3 h-3 text-[#1DA1F2]" />
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
            ) : (
                <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-white/50">
                    Klik peta untuk pin lokasi
                </div>
            )}
        </div>
    );
}
