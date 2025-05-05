import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 여행 관련 인터페이스 정의
interface Place {
  name: string;
  address: string;
  description?: string;
}

interface Day {
  date: string;
  places: Place[] | any[];
}

interface TravelInfo {
  travelId: string | number | null;
  title: string;
  area: string;
  startDate: string;
  endDate: string;
  days: Day[];
  isEditing: boolean;
}

const initialState: TravelInfo = {
  travelId: null,
  title: '',
  area: '',
  startDate: '',
  endDate: '',
  days: [],
  isEditing: false
};

const travelSlice = createSlice({
  name: 'travel',
  initialState,
  reducers: {
    // 여행 정보 설정
    setTravelInfo: (state, action: PayloadAction<{
      travelId: string | number;
      title: string;
      area: string;
      startDate: string;
      endDate: string;
      days: Day[];
    }>) => {
      state.travelId = action.payload.travelId;
      state.title = action.payload.title;
      state.area = action.payload.area;
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.days = action.payload.days;
      state.isEditing = true;
    },
    
    // 편집 모드 설정
    setEditingMode: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
    
    // 여행 정보 초기화
    resetTravelInfo: (state) => {
      return initialState;
    },
    
    // 장소 추가/수정
    updatePlace: (state, action: PayloadAction<{
      dayIndex: number;
      placeIndex: number;
      place: Place;
    }>) => {
      const { dayIndex, placeIndex, place } = action.payload;
      if (state.days[dayIndex] && state.days[dayIndex].places) {
        if (placeIndex < state.days[dayIndex].places.length) {
          // 기존 장소 수정
          state.days[dayIndex].places[placeIndex] = {
            ...state.days[dayIndex].places[placeIndex],
            ...place
          };
        } else {
          // 새 장소 추가
          state.days[dayIndex].places.push(place);
        }
      }
    },
    
    // 장소 삭제
    removePlace: (state, action: PayloadAction<{
      dayIndex: number;
      placeIndex: number;
    }>) => {
      const { dayIndex, placeIndex } = action.payload;
      if (state.days[dayIndex] && state.days[dayIndex].places) {
        state.days[dayIndex].places = state.days[dayIndex].places.filter((_, index) => index !== placeIndex);
      }
    }
  }
});

export const { 
  setTravelInfo, 
  setEditingMode, 
  resetTravelInfo, 
  updatePlace, 
  removePlace 
} = travelSlice.actions;

export default travelSlice.reducer; 