"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2 } from "lucide-react";

// Use dynamic import so Leaflet map is only loaded client-side
const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
});

interface LocationPickerProps {
  value: string;
  onChange: (val: string) => void;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  // Default to Bandung, Indonesia
  const [position, setPosition] = useState<[number, number]>([-6.914744, 107.609810]);
  const [searchQuery, setSearchQuery] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Handle click outside to close autocomplete results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
      setShowResults(true);
      
      if (data && data.length > 0) {
        const first = data[0];
        setPosition([parseFloat(first.lat), parseFloat(first.lon)]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSearching(false);
  };

  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setPosition([lat, lon]);
    onChange(result.display_name);
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        onChange(data.display_name);
        setSearchQuery(data.display_name);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSearching(false);
  };

  return (
    <div className="space-y-3 relative z-20">
      <div className="relative" ref={searchRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="Cari nama gedung / kota..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-shadow"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center shrink-0"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* Autocomplete Results */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl max-h-60 overflow-y-auto">
            {searchResults.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectResult(res)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm flex items-start gap-3"
              >
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300 line-clamp-2">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-[10px] text-gray-500 dark:text-gray-400">
        Ketikan alamat dan klik tombol cari, atau klik pada peta untuk menentukan lokasi.
      </div>

      <LocationPickerMap position={position} setPosition={setPosition} onLocationSelect={handleMapClick} />
    </div>
  );
}
