'use client';
import { GoogleMap, Marker, Polyline, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import React, { useState, useCallback, useRef } from 'react';
import { Box, Button } from '@mui/material';
import styled from '@emotion/styled';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import TravelPlanModal from '@/components/map/TravelPlanModal';
import Sidebar from '@/components/map/Sidebar';
import RightPanel from '@/components/map/RightPanel';
import { TransportMode, PlaceItem, DayPlan, Plan } from '@/type/plan';
import ChatIcon from '@mui/icons-material/Chat';
import api from '@/utils/axios';

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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyDx01yI23584jz6SnjWsltrVrl0vkQve6U',
    libraries: ['places', 'geometry'],
    language: 'ko',
  });

  const onLoad = useCallback((ref: google.maps.places.Autocomplete) => {
    ref.setFields(['name', 'formatted_address', 'geometry', 'photos']);
    ref.setComponentRestrictions({ country: 'kr' });
    setSearchBox(ref);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (searchBox && map) {
      try {
        const place = searchBox.getPlace();
        const searchText = placeName;
        
        if (!place.geometry?.location) {
          const geocoder = new google.maps.Geocoder();
          
          geocoder.geocode(
            { address: searchText, region: 'KR' },
            (results, status) => {
              if (status === 'OK' && results?.[0]) {
                const location = results[0].geometry.location;
                
                setSelectedPlace({
                  name: searchText,
                  address: results[0].formatted_address || '',
                  location: location,
                  photos: undefined
                });

                setPlaceName(searchText);
                setMarkerPosition({
                  lat: location.lat(),
                  lng: location.lng()
                });
                map.setCenter(location);
                map.setZoom(15);
              }
            }
          );
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setSelectedPlace({
          name: place.name || '',
          address: place.formatted_address || '',
          location: new google.maps.LatLng(lat, lng),
          photos: place.photos
        });

        setPlaceName(place.name || '');
        setMarkerPosition({ lat, lng });
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

    const newPlace: PlaceItem = {
      id: newId,
      name: place.name,
      address: place.address,
      location: {
        lat: place.location.lat(),
        lng: place.location.lng()
      },
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
  }, [currentDate, dayPlans, calculateTravelTime]);

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

  // 2. 지도 onIdle에서 bounds로 API 요청
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
      console.log("data:", data);
      if (Array.isArray(data)) {
        //setMapPins(data.filter((pin: any) => pin.commentsCnt > 0));
        setMapPins(data);
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
    }
  }, [map]);

  // 마커 클릭 핸들러 추가
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
          {/* 선택된 날짜의 장소들 표시 */}
          {getCurrentDayMarkers().map((place, index) => (
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
                    {index + 1}
                  </NumberMarker>
                  <CommentBubble>
                    <ChatIcon fontSize='small'/>
                    0
                  </CommentBubble>
                </MarkerContainer>
              </OverlayView>
            </React.Fragment>
          ))}

          {/* 순서 동그라미를 잇는 선 */}
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
          {mapPins.map((pin) => (
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
          ))}
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


