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
              }}
            >
              <MenuItem value="" disabled>
                여행 지역을 선택하세요.
              </MenuItem>
              <MenuItem value="서울">서울</MenuItem>
              <MenuItem value="부산">부산</MenuItem>
              <MenuItem value="제주">제주</MenuItem>
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