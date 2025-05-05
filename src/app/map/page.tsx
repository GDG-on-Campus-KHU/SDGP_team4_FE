'use client';
import { GoogleMap, Marker, Polyline, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import styled from '@emotion/styled';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import TravelPlanModal from '@/components/map/TravelPlanModal';
import Sidebar from '@/components/map/Sidebar';
import RightPanel from '@/components/map/RightPanel';
import { TransportMode, PlaceItem as BasePlaceItem, DayPlan, Plan } from '@/type/plan';
import ChatIcon from '@mui/icons-material/Chat';
import api from '@/utils/axios';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { setEditingMode, resetTravelInfo } from '@/redux/slices/travelSlice';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 37.5665,
  lng: 126.9780,
};

interface SelectedPlace {
  name: string;
  address: string;
  location?: google.maps.LatLng;
  photos?: google.maps.places.PlacePhoto[];
  imgUrls?: string[];
}

// PlaceItem 타입 확장 (기존 PlaceItem을 확장)
interface PlaceItem extends BasePlaceItem {
  placeId?: number; // 서버의 placeId 추가
}

export default function MapPage() {
  const [placeName, setPlaceName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [searchBox, setSearchBox] = useState<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [transportMode, setTransportMode] = useState<TransportMode>('DRIVING');

  // Polyline 옵션을 위한 상수 추가
  const [polylineOptions, setPolylineOptions] = useState({
    strokeColor: '#557EB3',
    strokeOpacity: 1,
    strokeWeight: 4,
  });

  // 새로운 마커 애니메이션을 위한 state 추가
  const [newPlaceId, setNewPlaceId] = useState<string | null>(null);

  // 1. mapPins 상태 추가
  const [mapPins, setMapPins] = useState<{ placeId: number; latitude: number; longitude: number; commentsCnt: number, bestCount: number, goodCount: number, sosoCount: number, badCount: number }[]>([]);

  // 선택된 장소의 placeId 저장 (API 요청용)
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [isPlaceLoading, setIsPlaceLoading] = useState(false);

  // 호버된 마커 관리
  const [hoverPlaceId, setHoverPlaceId] = useState<number | null>(null);

  // 임시 검색 결과를 저장할 상태 추가
  const [pendingSearchResult, setPendingSearchResult] = useState<{
    lat: number;
    lng: number;
    name: string;
    address: string;
    photos?: google.maps.places.PlacePhoto[];
    isFromGeocoder?: boolean;
  } | null>(null);

  // mapPins 업데이트 후 검색을 처리했는지 추적하는 플래그
  const searchAfterMapUpdate = useRef(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
    language: 'ko',
  });

  const onLoad = useCallback((ref: google.maps.places.Autocomplete) => {
    ref.setFields(['name', 'formatted_address', 'geometry', 'photos']);
    ref.setComponentRestrictions({ country: 'kr' });
    setSearchBox(ref);
  }, []);

  // 두 좌표 간 거리 계산 함수 추가 (미터 단위)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // 지구 반경 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // 검색한 장소가 백엔드에 이미 등록되어 있는지 직접 확인하는 함수 수정
  const checkIfPlaceExistsInBackend = async (lat: number, lng: number, address?: string): Promise<{ placeId: number } | null> => {
    try {
      // 1. 먼저 현재 로드된 맵핀에서 확인 (가장 빠름)
      const localMatch = mapPins.find(pin => 
        Math.abs(pin.latitude - lat) < 0.000001 && 
        Math.abs(pin.longitude - lng) < 0.000001
      );
      
      if (localMatch) {
        console.log('로컬 맵핀에서 정확한 좌표 일치 발견:', localMatch.placeId);
        return { placeId: localMatch.placeId };
      }
      
      // 일치하는 장소를 찾지 못함
      return null;
    } catch (error) {
      console.error('백엔드에서 장소 확인 중 오류:', error);
      return null;
    }
  };

  // 마커 클릭 핸들러 (먼저 정의)
  const handleMarkerClick = useCallback(async (pin: { placeId: number; latitude: number; longitude: number; commentsCnt: number }) => {
    // 이미 선택된 장소면 무시
    if (selectedPlaceId === pin.placeId) return;
    
    setIsPlaceLoading(true);
    try {
      // 해당 placeId로 장소 정보 API 요청
      const res = await api.get(`/v1/places/${pin.placeId}`);
      
      if (res.status === 200) {
        console.log('res:', res.data);
        // 타입 명시로 오류 해결
        const data = res.data as {
          imgUrls: string[];
          placeId: number;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          commentsCnt: number;
          best?: number;
          good?: number;
          soso?: number;
          bad?: number;
        };
        
        console.log('장소 정보 조회 성공:', data);
        
        // Google Maps LatLng 객체 생성
        const location = new google.maps.LatLng(pin.latitude, pin.longitude);
        
        // selectedPlace 상태 업데이트
        setSelectedPlace({
          name: data.name || '장소 정보',
          address: data.address || '',
          location: location,
          photos: undefined, // API에서 사진 정보가 없으므로 undefined
          imgUrls: data.imgUrls || []
        });
        
        setSelectedPlaceId(pin.placeId);
        
        // 지도 중심 이동
        if (map) {
          map.setCenter({ lat: pin.latitude, lng: pin.longitude });
          map.setZoom(16);
        }
        
        // 사이드바 열기
        setSidebarOpen(true);
      }
    } catch (e) {
      console.error('장소 정보 조회 실패:', e);
    } finally {
      setIsPlaceLoading(false);
    }
  }, [map, selectedPlaceId]);

  // onPlaceChanged 함수 수정 - 지도를 이동시키고 mapPins 업데이트 후 검색 처리
  const onPlaceChanged = useCallback(() => {
    if (searchBox && map) {
      try {
        // 검색 시 selectedPlaceId 초기화
        setSelectedPlaceId(null);
        
        const place = searchBox.getPlace();
        const searchText = placeName;
        
        if (!place.geometry?.location) {
          const geocoder = new google.maps.Geocoder();
          
          geocoder.geocode(
            { address: searchText, region: 'KR' },
            (results, status) => {
              if (status === 'OK' && results?.[0]) {
                const location = results[0].geometry.location;
                const address = results[0].formatted_address || '';
                
                const lat = location.lat();
                const lng = location.lng();
                
                // 검색 결과를 보류 상태로 저장
                setPendingSearchResult({
                  lat,
                  lng,
                  name: searchText,
                  address,
                  isFromGeocoder: true
                });
                
                // 검색 후 맵 업데이트 플래그 설정
                searchAfterMapUpdate.current = true;
                
                // 지도를 검색 위치로 이동 - 이동 후 handleMapIdle이 호출됨
                map.setCenter(location);
                map.setZoom(15);
              }
            }
          );
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || '';
        
        // 검색 결과를 보류 상태로 저장
        setPendingSearchResult({
          lat,
          lng,
          name: place.name || '',
          address,
          photos: place.photos
        });
        
        // 검색 후 맵 업데이트 플래그 설정
        searchAfterMapUpdate.current = true;
        
        // 지도를 검색 위치로 이동 - 이동 후 handleMapIdle이 호출됨
        map.setCenter({ lat, lng });
        map.setZoom(15);
        
      } catch (error) {
        console.error('Place selection error:', error);
      }
    }
  }, [searchBox, map, placeName]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // google 객체가 사용 가능할 때 화살표 옵션 추가
    setPolylineOptions(prev => ({
      ...prev,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        },
        offset: '100%'
      }]
    }));
  }, []);

  const handleAddPlan = (region: string, startDate: Date, endDate: Date) => {
    setPlan({ region, startDate, endDate });
  };

  const getDateRange = (start: Date, end: Date): Date[] => {
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const dateRange = plan ? getDateRange(plan.startDate, plan.endDate) : [];
  const currentDate = dateRange[currentDateIndex] || null;

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const calculateTravelTime = async (
    origin: PlaceItem, 
    destination: PlaceItem,
    mode: TransportMode  // 현재 선택된 이동수단을 파라미터로 받음
  ) => {
    if (!window.google || !origin.location || !destination.location) return null;

    try {
      if (mode === 'TRANSIT') {  // transportMode 대신 mode 사용
        const service = new google.maps.DistanceMatrixService();
        const request = {
          origins: [{
            lat: origin.location.lat,
            lng: origin.location.lng
          }],
          destinations: [{
            lat: destination.location.lat,
            lng: destination.location.lng
          }],
          travelMode: google.maps.TravelMode.TRANSIT,
          region: 'kr'
        };

        const response = await service.getDistanceMatrix(request);

        if (response.rows[0]?.elements[0]?.status === 'OK') {
          const element = response.rows[0].elements[0];
          return {
            duration: Math.round(element.duration.value / 60),
            durationText: element.duration.text
          };
        }
      } else {
        // 직선 거리 계산 (도보/자동차)
        const lat1 = origin.location.lat;
        const lng1 = origin.location.lng;
        const lat2 = destination.location.lat;
        const lng2 = destination.location.lng;

        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const speedKmH = mode === 'WALKING' ? 4 : 30;  // mode 사용
        const timeHours = distance / speedKmH;
        const timeMinutes = Math.round(timeHours * 60);

        return {
          duration: timeMinutes,
          durationText: `${timeMinutes}분`
        };
      }

      return null;
    } catch (error) {
      console.error('Travel time calculation error:', error);
      return {
        duration: 0,
        durationText: '계산 불가'
      };
    }
  };

  const handleAddPlace = useCallback(async (place: SelectedPlace) => {
    if (!currentDate || !place?.location) return;

    const currentDateStr = currentDate.toDateString();
    const newId = generateUniqueId();  // ID 미리 생성

    // 선택된 마커의 위치 정보 사용 (selectedPlaceId가 있는 경우)
    let lat, lng;
    let serverPlaceId = undefined;  // 서버의 placeId 초기화
    
    // 검색 결과인지 지도 선택인지 구분
    const isFromSearch = !selectedPlaceId && place.location;
    
    if (selectedPlaceId && !isFromSearch) {
      // 맵 핀에서 선택된 장소의 좌표 찾기
      const pin = mapPins.find(p => p.placeId === selectedPlaceId);
      if (pin) {
        lat = pin.latitude;
        lng = pin.longitude;
        serverPlaceId = selectedPlaceId;  // 지도 마커에서 선택한 경우에만 placeId 설정
      } else {
        // 핀을 찾을 수 없으면, 검색 결과처럼 처리
        lat = place.location.lat();
        lng = place.location.lng();
      }
    } else {
      // 일반 검색으로 찾은 장소는 원래대로 처리 (placeId 없음)
      lat = place.location.lat();
      lng = place.location.lng();
    }

    const newPlace: PlaceItem = {
      id: newId,
      name: place.name,
      address: place.address,
      location: {
        lat: lat,
        lng: lng
      },
      placeId: serverPlaceId, // 지도 마커에서 선택한 경우에만 placeId 설정
      travelDuration: 0,
      travelDurationText: ''
    };

    const prevPlans = [...dayPlans];
    const planIndex = prevPlans.findIndex(p => p.date.toDateString() === currentDateStr);

    if (planIndex >= 0) {
      const currentPlan = { ...prevPlans[planIndex] };
      const places = [...currentPlan.places];

      // 🚗 이동시간 계산: 이전 장소 → 새 장소
      if (places.length > 0) {
        const lastPlace = places[places.length - 1];
        const travelTime = await calculateTravelTime(lastPlace, newPlace, transportMode);
        if (travelTime) {
          // 새로운 장소에 이동시간 설정 (이전 장소로부터의 이동시간)
          newPlace.travelDuration = travelTime.duration;
          newPlace.travelDurationText = travelTime.durationText;
        }
      }

      places.push(newPlace);
      currentPlan.places = places;
      prevPlans[planIndex] = currentPlan;
      setDayPlans(prevPlans);

    } else {
      // 해당 날짜가 아예 없을 경우
      setDayPlans([
        ...prevPlans,
        {
          date: new Date(currentDate),
          places: [newPlace]
        }
      ]);
    }

    // 새로운 장소 ID 설정
    setNewPlaceId(newId);
    // 애니메이션 종료 후 ID 초기화
    setTimeout(() => setNewPlaceId(null), 500);
  }, [currentDate, dayPlans, calculateTravelTime, selectedPlaceId, mapPins]);

  const handleDeletePlace = useCallback(async (dateStr: string, placeId: string) => {
    // 깊은 복사를 하되 Date 객체 유지
    const updatedPlans = dayPlans.map(plan => ({
      ...plan,
      date: new Date(plan.date),  // Date 객체 재생성
      places: [...plan.places]
    }));

    const planIndex = updatedPlans.findIndex(plan =>
      plan.date.toDateString() === dateStr
    );

    if (planIndex === -1) return;

    const currentPlan = updatedPlans[planIndex];
    const placeIndex = currentPlan.places.findIndex(place => place.id === placeId);

    if (placeIndex === -1) return;

    // 장소 삭제
    currentPlan.places.splice(placeIndex, 1);

    // 남은 장소가 1개 이하면 모든 이동시간 초기화
    if (currentPlan.places.length <= 1) {
      currentPlan.places.forEach(place => {
        place.travelDuration = 0;
        place.travelDurationText = '';
      });
      setDayPlans(updatedPlans);
      return;
    }

    // 중간 장소가 삭제된 경우, 삭제된 장소 다음 장소의 이동시간 재계산
    if (placeIndex > 0 && placeIndex < currentPlan.places.length) {
      const prevPlace = currentPlan.places[placeIndex - 1];
      const nextPlace = currentPlan.places[placeIndex];

      // 다음 장소의 이동시간 재계산 (이전 장소로부터의 이동시간)
      const travelTime = await calculateTravelTime(prevPlace, nextPlace, transportMode);
      if (travelTime) {
        nextPlace.travelDuration = travelTime.duration;
        nextPlace.travelDurationText = travelTime.durationText;
      }
    }

    setDayPlans(updatedPlans);
  }, [dayPlans, calculateTravelTime]);

  // 현재 선택된 날짜의 장소들 가져오기
  const getCurrentDayMarkers = useCallback(() => {
    if (!currentDate) return [];
    
    const currentPlan = dayPlans.find(plan => 
      plan.date.toDateString() === currentDate.toDateString()
    );

    // 모든 추가된 장소 반환 (필터링 제거)
    return currentPlan?.places || [];
  }, [currentDate, dayPlans]);

  // 경로 좌표 생성
  const getPathCoordinates = useCallback(() => {
    const places = getCurrentDayMarkers();
    return places.map(place => ({
      lat: place.location.lat,
      lng: place.location.lng
    }));
  }, [getCurrentDayMarkers]);

  // 이동시간 재계산 함수 추가
  const recalculateAllTravelTimes = useCallback(async () => {
    console.log("재계산 시작", transportMode);
    const updatedPlans = [...dayPlans];
    
    for (const plan of updatedPlans) {
      const places = plan.places;
      if (places.length <= 1) continue;

      // 각 장소별로 이전 장소로부터의 이동시간 재계산
      for (let i = 1; i < places.length; i++) {
        const prevPlace = places[i - 1];
        const currentPlace = places[i];
        
        const travelTime = await calculateTravelTime(prevPlace, currentPlace, transportMode);
        if (travelTime) {
          currentPlace.travelDuration = travelTime.duration;
          currentPlace.travelDurationText = travelTime.durationText;
        }
      }
    }

    setDayPlans(updatedPlans);
  }, [dayPlans, calculateTravelTime]);

  // transportMode 변경 핸들러 수정
  const handleTransportModeChange = useCallback(async (mode: TransportMode) => {
    // 새로운 이동수단으로 바로 계산
    const updatedPlans = [...dayPlans];
    
    for (const plan of updatedPlans) {
      const places = plan.places;
      if (places.length <= 1) continue;

      for (let i = 1; i < places.length; i++) {
        const prevPlace = places[i - 1];
        const currentPlace = places[i];
        
        // 새로운 이동수단(mode)으로 바로 계산
        const travelTime = await calculateTravelTime(prevPlace, currentPlace, mode);
        if (travelTime) {
          currentPlace.travelDuration = travelTime.duration;
          currentPlace.travelDurationText = travelTime.durationText;
        }
      }
    }

    // 계산이 완료된 후에 상태 업데이트
    setDayPlans(updatedPlans);
    setTransportMode(mode);
  }, [dayPlans, calculateTravelTime]);

  // handleMapIdle 함수 수정 - 디버깅 로그 추가 및 좌표 비교 허용 오차 증가
  const handleMapIdle = useCallback(async () => {
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const minLat = sw.lat();
    const maxLat = ne.lat();
    const minLng = sw.lng();
    const maxLng = ne.lng();

    try {
      const res = await api.get(`/v1/map/places/pin?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`);
      const data = res.data;
      console.log("mapPins 업데이트:", data);
      if (Array.isArray(data)) {
        //setMapPins(data.filter((pin: any) => pin.commentsCnt > 0));
        setMapPins(data);       
        // 보류 중인 검색 결과가 있으면 처리
        if (pendingSearchResult && searchAfterMapUpdate.current) {
          searchAfterMapUpdate.current = false;
          const { lat, lng, name, address, photos, isFromGeocoder } = pendingSearchResult;
          // 맵핀에서 일치하는 장소 찾기 - 허용 오차 증가 (약 20미터)
          let matchingPin = null;
          
          // 1. 먼저 정확한 좌표 일치 확인 - mapPins 대신 API 응답 데이터인 data 배열 사용
          const exactMatch = data.find(pin => 
            Math.abs(pin.latitude - lat) < 0.0001 && 
            Math.abs(pin.longitude - lng) < 0.0001
          );
          
          if (exactMatch) {
            console.log(`정확한 좌표 일치 발견: ${exactMatch.placeId}`, {
              pinLat: exactMatch.latitude, 
              pinLng: exactMatch.longitude,
              searchLat: lat,
              searchLng: lng,
              latDiff: Math.abs(exactMatch.latitude - lat),
              lngDiff: Math.abs(exactMatch.longitude - lng)
            });
            matchingPin = exactMatch;
          } else {
            // 2. 거리 기반 검색 (50미터 이내) - mapPins 대신 data 배열 사용
            let closestPin = null;
            let minDistance = Number.MAX_VALUE;
            
            for (const pin of data) {
              const distance = calculateDistance(lat, lng, pin.latitude, pin.longitude);
              if (distance < minDistance) {
                minDistance = distance;
                closestPin = pin;
              }
            }
            
            if (closestPin && minDistance <= 50) {
              console.log(`가까운 마커 발견 (${minDistance.toFixed(2)}m): ${closestPin.placeId}`, {
                pinLat: closestPin.latitude, 
                pinLng: closestPin.longitude,
                searchLat: lat,
                searchLng: lng,
                distance: minDistance
              });
              matchingPin = closestPin;
            } else if (closestPin) {
              console.log(`가장 가까운 마커가 너무 멀리 있음 (${minDistance.toFixed(2)}m): ${closestPin.placeId}`);
            }
          }
          
          if (matchingPin) {
            // 일치하는 맵핀이 있으면 해당 맵핀 정보 사용
            console.log(`지도 업데이트 후 일치하는 맵핀 발견: ${matchingPin.placeId}`);
            handleMarkerClick(matchingPin);
          } else {
            // 일치하는 맵핀이 없으면 일반 검색 결과 사용
            console.log('일치하는 맵핀이 없어 검색 결과 사용');
            setSelectedPlace({
              name,
              address,
              location: new google.maps.LatLng(lat, lng),
              photos
            });

            if (!isFromGeocoder) {
              setPlaceName(name);
            }
            
            setMarkerPosition({ lat, lng });
          }
          
          // 보류 중인 검색 결과 초기화
          setPendingSearchResult(null);
        }
      } else {
        setMapPins([]);
        console.error(data);
      }
    } catch (e: any) {
      if (e.response) {
        console.error('핀 목록 조회 실패:', e.response.status, e.response.data);
      } else {
        console.error('핀 목록 조회 실패:', e);
      }
      setMapPins([]);
      
      // 오류가 발생해도 보류 중인 검색 결과가 있으면 일반 검색 결과로 처리
      if (pendingSearchResult && searchAfterMapUpdate.current) {
        searchAfterMapUpdate.current = false;
        const { lat, lng, name, address, photos, isFromGeocoder } = pendingSearchResult;
        
        // 일반 검색 결과 사용
        setSelectedPlace({
          name,
          address,
          location: new google.maps.LatLng(lat, lng),
          photos
        });

        if (!isFromGeocoder) {
          setPlaceName(name);
        }
        
        setMarkerPosition({ lat, lng });
        setPendingSearchResult(null);
      }
    }
  }, [map, pendingSearchResult, handleMarkerClick, calculateDistance]);

  // Redux 상태 및 디스패치 추가
  const dispatch = useAppDispatch();
  const travelInfo = useAppSelector(state => state.travel);
  
  // Redux 상태의 여행 정보로 초기화하는 useEffect 추가
  useEffect(() => {
    // Google Maps API가 로드되었는지 확인
    if (!isLoaded) return;
    
    // travelInfo.isEditing이 true인 경우 Redux 데이터로 초기화
    if (travelInfo.isEditing && travelInfo.travelId) {
      console.log('Redux에서 여행 정보 로드:', travelInfo);
      
      // 1. 여행 계획 정보 설정
      setPlan({
        region: travelInfo.area,
        startDate: new Date(travelInfo.startDate),
        endDate: new Date(travelInfo.endDate)
      });
      
      // 2. 임시 장소 데이터 생성 (지오코딩 전)
      const formattedDays: DayPlan[] = travelInfo.days.map(day => {
        // 각 장소에 필요한 속성 추가 (임시 좌표 설정)
        const places: PlaceItem[] = day.places.map((place: any) => {
          // moveTime이 있으면 사용하여 이동시간 설정
          const moveTime = place.moveTime || 0;
          
          return {
            id: generateUniqueId(),
            name: place.name,
            address: place.address,
            location: {
              lat: 37.5665, // 임시 좌표
              lng: 126.9780
            },
            travelDuration: moveTime,
            travelDurationText: moveTime > 0 ? `${moveTime}분` : '',
            memo: place.description || ''
          } as PlaceItem;
        });
        
        return {
          date: new Date(day.date),
          places
        };
      });
      
      setDayPlans(formattedDays);
      
      // 3. 편집 모드 알림 표시 - 최초 접속 시에만 표시
      if (!sessionStorage.getItem('editModeAlertShown')) {
        alert('여행 정보를 수정 모드로 불러왔습니다. 장소를 추가하거나 변경할 수 있습니다.');
        sessionStorage.setItem('editModeAlertShown', 'true');
      }
      
      // 4. 지오코딩으로 장소 좌표 업데이트
      const geocodeAndUpdatePlaces = async () => {
        if (!google || !google.maps) return;
        
        const geocoder = new google.maps.Geocoder();
        const updatedDays = [...formattedDays];
        let isUpdated = false;
        
        // 모든 날짜의 모든 장소에 대해 지오코딩 수행
        for (let dayIndex = 0; dayIndex < updatedDays.length; dayIndex++) {
          const day = updatedDays[dayIndex];
          
          for (let placeIndex = 0; placeIndex < day.places.length; placeIndex++) {
            const place = day.places[placeIndex];
            
            // 검색 키워드 설정 (주소 또는 이름)
            const searchKeyword = place.address || place.name;
            if (!searchKeyword) continue;
            
            try {
              // 지오코딩 수행
              const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: searchKeyword, region: 'kr' }, (results, status) => {
                  if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                    resolve(results);
                  } else {
                    reject(status);
                  }
                });
              });
              
              // 첫 번째 결과의 좌표 사용
              const location = result[0].geometry.location;
              
              // 장소 좌표 업데이트
              updatedDays[dayIndex].places[placeIndex].location = {
                lat: location.lat(),
                lng: location.lng()
              };
              
              isUpdated = true;
              
              // 짧은 딜레이 추가 (API 제한 방지)
              await new Promise(resolve => setTimeout(resolve, 300));
              
            } catch (error) {
              console.error(`지오코딩 실패: ${searchKeyword}`, error);
            }
          }
        }
        
        // 좌표가 업데이트된 경우에만 상태 업데이트
        if (isUpdated) {
          setDayPlans(updatedDays);
          console.log('지오코딩으로 장소 좌표 업데이트 완료:', updatedDays);
        }
      };
      
      // 지오코딩 실행
      geocodeAndUpdatePlaces();
    }
  }, [isLoaded, travelInfo]);

  // 이동시간 재계산을 위한 별도의 useEffect
  useEffect(() => {
    // Google Maps API가 로드되었는지 확인
    if (!isLoaded) return;
    
    // 편집 모드이고 dayPlans가 로드된 경우에만 실행
    if (travelInfo.isEditing && travelInfo.travelId && dayPlans.length > 0) {
      // 이동시간 재계산이 이미 수행되었는지 확인
      const recalcKey = `recalc-${travelInfo.travelId}`;
      if (!sessionStorage.getItem(recalcKey)) {
        // 이동시간 다시 계산 (지연 실행)
        const timer = setTimeout(() => {
          recalculateAllTravelTimes();
          sessionStorage.setItem(recalcKey, 'true');
        }, 1500);
        
        // 컴포넌트 언마운트 시 타이머 정리
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded, dayPlans.length, travelInfo.isEditing, travelInfo.travelId]);

  // 저장 및 종료 핸들러 추가
  const handleSaveAndExit = async () => {
    if (!plan || !travelInfo.travelId) return;
    
    try {
      // 서버에 저장할 데이터 준비
      const travelUpdateDto = {
        title: travelInfo.title,
        area: plan.region,
        thumbnail: null, // 필요시 수정
        startDate: travelInfo.startDate, 
        endDate: travelInfo.endDate
      };
      
      // 코스 데이터 준비
      const courseUpdateDto = dayPlans.flatMap(day => 
        day.places.map(place => ({
          name: place.name,
          address: place.address,
          description: (place as any).memo || "", // memo 필드를 description으로 매핑
          courseDate: day.date.toISOString().split('T')[0], // 날짜 포맷 변환
          moveTime: place.travelDuration || 0
        }))
      );
      
      // API 요청
      await api.put(`/v1/travel/${travelInfo.travelId}`, {
        travelUpdateDto,
        courseUpdateDto
      });
      
      alert('여행 정보가 성공적으로 저장되었습니다.');
      
      // Redux 상태 초기화
      dispatch(resetTravelInfo());
      
      // 알림 플래그만 유지하고 다른 sessoinStorage 항목은 제거할 필요가 있다면 여기에 추가
      
      // 이전 페이지로 이동
      window.history.back();
    } catch (error) {
      console.error('여행 정보 저장 실패:', error);
      alert('여행 정보 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };
  
  // 취소 핸들러
  const handleCancel = () => {
    if (confirm('변경 사항을 저장하지 않고 나가시겠습니까?')) {
      dispatch(resetTravelInfo());
      window.history.back();
    }
  };

  if (!isLoaded) return <div>지도를 불러오는 중...</div>;

  return (
    <Container>
      <MapWrapper>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          onLoad={onMapLoad}
          onIdle={handleMapIdle}
        >
          {/* 선택된 날짜의 장소들 표시 - 지도에 등록된 pin이 아닌 검색으로 추가된 장소들 */}
          {getCurrentDayMarkers().filter(place => !(place as any).placeId).map((place, index) => (
            <React.Fragment key={place.id}>
              <OverlayView
                position={{
                  lat: place.location.lat,
                  lng: place.location.lng
                }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({
                  x: -(width / 2),
                  y: -height
                })}
              >
                <MarkerContainer isNew={place.id === newPlaceId}>
                  <NumberMarker>
                    {/* 추가된 순서 계산 */}
                    {getCurrentDayMarkers().findIndex(p => p.id === place.id) + 1}
                  </NumberMarker>
                  <CommentBubble>
                    <ChatIcon fontSize='small'/>
                    0
                  </CommentBubble>
                </MarkerContainer>
              </OverlayView>
            </React.Fragment>
          ))}

          {/* 순서 동그라미를 잇는 선 - 모든 추가된 장소 연결 */}
          <Polyline
            path={getPathCoordinates()}
            options={{
              ...polylineOptions,
              strokeColor: '#4B89DC',
              strokeOpacity: 1,
              strokeWeight: 3,
              icons: []
            }}
          />

          {/* 검색된 장소 마커 */}
          {markerPosition && !selectedPlace && (
            <Marker
              position={markerPosition}
              animation={google.maps.Animation.DROP}
            />
          )}

          {/* mapPins로 받은 장소 마커 렌더링 (클릭 이벤트 추가) */}
          {mapPins.map((pin) => {
            // 현재 일정에 이미 추가된 장소인지 확인
            const addedPlaceIndex = getCurrentDayMarkers().findIndex(place => 
              (place as any).placeId === pin.placeId
            );
            
            const isAddedPlace = addedPlaceIndex !== -1;
            const orderNumber = isAddedPlace ? addedPlaceIndex + 1 : null;

            return (
              <OverlayView
                key={pin.placeId}
                position={{ lat: pin.latitude, lng: pin.longitude }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({
                  x: -(width / 2),
                  y: -height
                })}
              >
                <MarkerContainer 
                  isNew={false} 
                  onClick={() => handleMarkerClick(pin)}
                  isSelected={selectedPlaceId === pin.placeId}
                  onMouseEnter={() => setHoverPlaceId(pin.placeId)}
                  onMouseLeave={() => setHoverPlaceId(null)}
                >
                  {isAddedPlace && (
                    <NumberMarker>
                      {orderNumber}
                    </NumberMarker>
                  )}
                  {hoverPlaceId === pin.placeId && (
                    <FeedbackTooltip>
                      <FeedbackItem>
                        <img src="/icons/emotion/best.svg" alt="최고예요" width={16} height={16} />
                        <span>{pin.bestCount || 0}</span>
                      </FeedbackItem>
                      <FeedbackItem>
                        <img src="/icons/emotion/good.svg" alt="좋아요" width={16} height={16} />
                        <span>{pin.goodCount || 0}</span>
                      </FeedbackItem>
                      <FeedbackItem>
                        <img src="/icons/emotion/soso.svg" alt="그저 그래요" width={16} height={16} />
                        <span>{pin.sosoCount || 0}</span>
                      </FeedbackItem>
                      <FeedbackItem>
                        <img src="/icons/emotion/bad.svg" alt="별로예요" width={16} height={16} />
                        <span>{pin.badCount || 0}</span>
                      </FeedbackItem>
                    </FeedbackTooltip>
                  )}
                  <CommentBubble isSelected={selectedPlaceId === pin.placeId}>
                    <ChatIcon fontSize='small'/>
                    {pin.commentsCnt}
                  </CommentBubble>
                </MarkerContainer>
              </OverlayView>
            );
          })}
        </GoogleMap>
      </MapWrapper>
      <Sidebar
        open={sidebarOpen}
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        placeName={placeName}
        setPlaceName={setPlaceName}
        selectedPlace={selectedPlace}
        onAddPlace={() => selectedPlace && handleAddPlace(selectedPlace)}
        selectedPlaceId={selectedPlaceId}
        setSelectedPlaceId={setSelectedPlaceId}
        isLoading={isPlaceLoading}
      />
      <ToggleButton sidebarOpen={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? (
          <ChevronLeftIcon sx={{ color: '#9A9A9A' }} />
        ) : (
          <ChevronRightIcon sx={{ color: '#9A9A9A' }} />
        )}
      </ToggleButton>
      {plan ? (
        <RightPanel
          isOpen={isRightPanelOpen}
          plan={plan}
          currentDate={currentDate}
          currentDateIndex={currentDateIndex}
          dateRange={dateRange}
          dayPlans={dayPlans}
          onTogglePanel={() => setIsRightPanelOpen(prev => !prev)}
          onOpenModal={() => setModalOpen(true)}
          onDateChange={setCurrentDateIndex}
          transportMode={transportMode}
          onTransportModeChange={handleTransportModeChange}
          onDeletePlace={handleDeletePlace}
          isEditMode={travelInfo.isEditing}
          onSave={handleSaveAndExit}
          onCancel={handleCancel}
        />
      ) : (
        <FloatingButton
          variant='contained'
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          여행일정 추가
        </FloatingButton>
      )}
      <TravelPlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddPlan}
        initialRegion={plan?.region}
        initialStartDate={plan?.startDate}
        initialEndDate={plan?.endDate}
      />
    </Container>
  );
}

const Container = styled(Box)`
  position: relative;
  width: 100%;
  height: calc(100dvh - 70px);
  overflow: hidden;
`;

const ToggleButton = styled('div') <{ sidebarOpen: boolean }>`
  position: absolute;
  top: 50%;
  left: ${(props) => (props.sidebarOpen ? '320px' : '0')};
  transform: translateY(-50%);
  background-color: #ffffff;
  border: 1px solid #ccc;
  width: 30px;
  height: 78px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
  z-index: 15;
  transition: left 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  border-left: none;
  cursor: pointer;
`;

const FloatingButton = styled(Button)`
  position: absolute;
  bottom: 24px;
  right: 24px;
  border-radius: 20px;
  z-index: 20;
`;

const MapWrapper = styled(Box)`
  width: 100%;
  height: 100%;
  z-index: 1;
`;

// 스타일 컴포넌트 수정
const MarkerContainer = styled.div<{ isNew: boolean; isSelected?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${props => props.isNew ? 'bounce 0.5s ease' : 'none'};
  cursor: pointer;
  transition: transform 0.2s ease;
  
  /* 선택된 마커 강조 효과 */
  transform: ${props => props.isSelected ? 'scale(1.1)' : 'scale(1)'};
  
  &:hover {
    transform: scale(1.05);
  }

  @keyframes bounce {
    0% {
      transform: translateY(-50px);
      opacity: 0;
    }
    60% {
      transform: translateY(10px);
      opacity: 1;
    }
    80% {
      transform: translateY(-5px);
    }
    100% {
      transform: translateY(0);
    }
  }
`;

const NumberMarker = styled.div`
  width: 24px;
  height: 24px;
  background: #557EB3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
`;

const CommentBubble = styled.div<{ isSelected?: boolean }>`
  background: ${props => props.isSelected ? '#FEF9D9' : 'white'};
  border: 1px solid #C1C1C1;
  border-radius: 10px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 12px;
  font-size: 14px;
  transition: background-color 0.2s ease;
`;

// 피드백 툴팁 스타일 수정
const FeedbackTooltip = styled.div`
  position: absolute;
  top: -35px; /* 마커 위에 표시 */
  background: #FEF9D9;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  min-width: 120px;
  z-index: 3;
`;

const FeedbackItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  
  span {
    color: #666;
  }
`;


