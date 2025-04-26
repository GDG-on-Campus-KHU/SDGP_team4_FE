'use client';

import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { ko } from 'date-fns/locale';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CalendarIcon } from '@mui/x-date-pickers';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';

interface TravelPlanModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (region: string, startDate: Date, endDate: Date) => void;
  initialRegion?: string;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export default function TravelPlanModal({
  open,
  onClose,
  onSubmit,
  initialRegion = '',
  initialStartDate = new Date(),
  initialEndDate = new Date(),
}: TravelPlanModalProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [region, setRegion] = useState(initialRegion);
  const [selectionRange, setSelectionRange] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate,
    key: 'selection',
  });

  useEffect(() => {
    if (open) {
      setRegion(initialRegion);
      setSelectionRange({
        startDate: initialStartDate,
        endDate: initialEndDate,
        key: 'selection',
      });
      setCalendarOpen(false);
    }
  }, [open]); // ← 이렇게만!

  const handleSelect = (ranges: any) => {
    setSelectionRange(ranges.selection);
  };

  const formatRange = () => {
    const { startDate, endDate } = selectionRange;
    return `${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()}`;
  };

  const isValid = region !== '' && selectionRange.startDate && selectionRange.endDate;

  const koreanCities = [
    // 특별시, 광역시, 특별자치시
    '서울특별시',
    '부산광역시',
    '대구광역시',
    '인천광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',

    // 경기도
    '경기도 수원시', '경기도 고양시', '경기도 용인시', '경기도 성남시', '경기도 부천시', 
    '경기도 안산시', '경기도 화성시', '경기도 남양주시', '경기도 안양시', '경기도 평택시', 
    '경기도 시흥시', '경기도 파주시', '경기도 의정부시', '경기도 김포시', '경기도 광주시', 
    '경기도 광명시', '경기도 군포시', '경기도 하남시', '경기도 오산시', '경기도 양주시', 
    '경기도 이천시', '경기도 구리시', '경기도 안성시', '경기도 포천시', '경기도 의왕시', 
    '경기도 여주시', '경기도 동두천시',

    // 강원도
    '강원도 춘천시', '강원도 원주시', '강원도 강릉시', '강원도 동해시', 
    '강원도 태백시', '강원도 속초시', '강원도 삼척시',

    // 충청북도
    '충청북도 청주시', '충청북도 충주시', '충청북도 제천시',

    // 충청남도
    '충청남도 천안시', '충청남도 공주시', '충청남도 보령시', '충청남도 아산시', 
    '충청남도 서산시', '충청남도 논산시', '충청남도 계룡시', '충청남도 당진시',

    // 전라북도
    '전라북도 전주시', '전라북도 군산시', '전라북도 익산시', '전라북도 정읍시', 
    '전라북도 남원시', '전라북도 김제시',

    // 전라남도
    '전라남도 목포시', '전라남도 여수시', '전라남도 순천시', '전라남도 나주시', 
    '전라남도 광양시',

    // 경상북도
    '경상북도 포항시', '경상북도 경주시', '경상북도 김천시', '경상북도 안동시', 
    '경상북도 구미시', '경상북도 영주시', '경상북도 영천시', '경상북도 상주시', 
    '경상북도 문경시', '경상북도 경산시',

    // 경상남도
    '경상남도 창원시', '경상남도 진주시', '경상남도 통영시', '경상남도 사천시', 
    '경상남도 김해시', '경상남도 밀양시', '경상남도 거제시', '경상남도 양산시',

    // 제주특별자치도
    '제주특별자치도 제주시', '제주특별자치도 서귀포시'
];
  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <CloseButton
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </CloseButton>

        <Typography variant="h6" fontWeight={600} mb={3}>
          여행 일정 추가
        </Typography>

        <FormBox>
          <div>
            <Label>여행 지역</Label>
            <TextField
              select
              fullWidth
              size="small"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              SelectProps={{
                IconComponent: CustomDropdownIcon,
                displayEmpty: true,
                MenuProps: {
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  PaperProps: {
                    sx: {
                      mt: 0.5,  // TextField와의 간격
                      maxHeight: 300, // 최대 높이 지정
                      '& .MuiList-root': {
                        padding: 0, // 기본 패딩 제거
                      }
                    },
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                여행 지역을 선택하세요.
              </MenuItem>
              {koreanCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div>
            <Label>여행 날짜</Label>
            <Box sx={{ position: 'relative' }}>
              <TextField
                size="small"
                fullWidth
                value={formatRange()}
                placeholder="여행 날짜를 선택하세요."
                onClick={() => setCalendarOpen(!calendarOpen)}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarIcon
                        onClick={() => setCalendarOpen(!calendarOpen)}
                        sx={{ cursor: "pointer", color: "#D9D9D9" }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              {calendarOpen && (
                <CalendarWrapper>
                  <DateRange
                    locale={ko}
                    editableDateInputs={true}
                    onChange={handleSelect}
                    moveRangeOnFirstSelection={false}
                    ranges={[selectionRange]}
                    rangeColors={["#D2E0FB"]}
                    showDateDisplay={false}
                  />
                </CalendarWrapper>
              )}
            </Box>
          </div>
          <SubmitButton
            variant="contained"
            color="primary"
            disabled={!isValid}
            onClick={() => {
              if (isValid) {
                onSubmit(region, selectionRange.startDate, selectionRange.endDate);
                onClose();
              }
            }}
          >
            일정 추가하기
          </SubmitButton>
        </FormBox>
      </ModalContent>
    </Modal>
  );
}

const ModalContent = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  padding: 32px 40px;
  width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  outline: none;
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 16px;
  right: 16px;
`;

const FormBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Label = styled(Typography)`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const SubmitButton = styled(Button)`
  margin-top: 10px;
  height: 42px;
  text-transform: none;
  font-weight: 600;
  border-radius: 8px;
`;

const CalendarWrapper = styled(Box)`
  position: absolute;
  z-index: 10;
  top: 48px;
  left: 0;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
`;

const CustomDropdownIcon = styled(ArrowDropDownIcon)`
  color: #D9D9D9 !important;
  margin-right: 5px;
`;