export type TransportMode = 'DRIVING' | 'TRANSIT' | 'WALKING';

export interface PlaceItem {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  travelDuration: number;
  travelDurationText: string;
}

export interface DayPlan {
  date: Date;
  places: PlaceItem[];
}

export interface Plan {
  region: string;
  startDate: Date;
  endDate: Date;
}

interface SelectedPlace {
  name: string;
  address: string;
  location: google.maps.LatLng | null;
  photos?: google.maps.places.PlacePhoto[];
}