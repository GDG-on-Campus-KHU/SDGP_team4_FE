'use client'
import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import styled from '@emotion/styled';

interface Place {
  name: string;
  address: string;
  description?: string;
  moveTime?: number;
}

interface Day {
  date: string;
  places: Place[];
}

interface TravelPlanViewerProps {
  days: Day[];
}

const TravelPlanViewer: React.FC<TravelPlanViewerProps> = ({ days }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagesCount = Math.ceil(days.length / 3);
  const currentDays = days.slice(currentPage * 3, (currentPage + 1) * 3);

  const handleNextPage = () => {
    if (currentPage < pagesCount - 1) setCurrentPage((prev) => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  return (
    <SectionWrapper>
      <NavButtonLeft onClick={handlePrevPage} disabled={currentPage === 0}>
        <NavCircle>
          <LeftArrow />
        </NavCircle>
      </NavButtonLeft>
      <DaysContainer>
        {currentDays.map((day, dayIdx) => (
          <DaySection key={day.date}>
            <DayTitle>{`${dayIdx + 1 + currentPage * 3}일차 (${day.date})`}</DayTitle>
            <TimelineContainer>
              {day.places.map((place, idx) => (
                <React.Fragment key={place.name + idx}>
                  <PlaceItem>
                    <PlaceContent>
                      <PlaceInfo>
                        <PlaceName>{place.name}</PlaceName>
                        <PlaceAddress>{place.address}</PlaceAddress>
                      </PlaceInfo>
                    </PlaceContent>
                    {place.description && (
                      <MemoBox>
                        <Typography fontSize={13} color="#555">{place.description}</Typography>
                      </MemoBox>
                    )}
                  </PlaceItem>
                  {/* 타임라인 선과 이동시간 */}
                  {idx < day.places.length - 1 && (
                    <TimelineWrapper>
                      <TimelineLine />
                      <TimelineDuration>
                        {day.places[idx + 1].moveTime ? `${day.places[idx + 1].moveTime}분` : ''}
                      </TimelineDuration>
                    </TimelineWrapper>
                  )}
                </React.Fragment>
              ))}
            </TimelineContainer>
          </DaySection>
        ))}
        {/* 빈 칸 채우기 */}
        {Array.from({ length: 3 - currentDays.length }).map((_, idx) => (
          <DaySection key={`empty-${idx}`} style={{ visibility: 'hidden' }} />
        ))}
      </DaysContainer>
      <NavButtonRight onClick={handleNextPage} disabled={currentPage >= pagesCount - 1}>
        <NavCircle>
          <RightArrow />
        </NavCircle>
      </NavButtonRight>
    </SectionWrapper>
  );
};

export default TravelPlanViewer;

const SectionWrapper = styled(Box)`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F7F7F7;
  padding: 25px;
  border-radius: 5px;
`;

const DaysContainer = styled(Box)`
  display: flex;
  min-height: 500px;
  gap: 35px;
  width: 1000px;
  justify-content: center;
`;

const DaySection = styled(Box)`
  flex: 1;
`;

const DayTitle = styled(Typography)`
  font-size: 16px;
  margin-bottom: 18px;
`;

const TimelineContainer = styled(Box)`
`;

const PlaceItem = styled(Box)``;

const PlaceContent = styled(Box)`
  border: 1px solid #D2E0FB;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  background: white;
  width: 210px;
  position: relative;
  z-index: 2;
`;

const PlaceInfo = styled(Box)`
  flex: 1;
`;

const PlaceName = styled(Typography)`
  font-size: 13px;
  font-weight: 500;
`;

const PlaceAddress = styled(Typography)`
  font-size: 11px;
  color: #9A9A9A;
  margin-top: 4px;
`;

const TimelineWrapper = styled(Box)`
  display: flex;
  align-items: center;
  padding-left: 20px;
`;

const TimelineLine = styled(Box)`
  width: 3px;
  height: 40px;
  background-color: #D2E0FB;
  margin-right: 12px;
`;

const TimelineDuration = styled(Box)`
  font-size: 13px;
`;

const MemoBox = styled(Box)`
  background: #FEF9D9;
  padding: 10px;
  padding-top: 16px;
  border-radius: 0px 0px 8px 8px;
  font-size: 11px;
  position: relative;
  width: 210px;
  margin-top: -8px;
  z-index: 1;
  white-space: pre-wrap;
`;

const NavButtonLeft = styled(IconButton)<{ disabled?: boolean }>`
  position: absolute;
  left: -70px;
  top: 50%;
  transform: translateY(-50%);
  opacity: ${props => props.disabled ? 0.3 : 1};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  background: none;
`;

const NavButtonRight = styled(IconButton)<{ disabled?: boolean }>`
  position: absolute;
  right: -70px;
  top: 50%;
  transform: translateY(-50%);
  opacity: ${props => props.disabled ? 0.3 : 1};
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  background: none;
`;

const NavCircle = styled(Box)`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const RightArrow = styled(Box)`
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 10px solid #8EACCD;
  margin-left: 3px;
`;

const LeftArrow = styled(Box)`
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-right: 10px solid #8EACCD;
  margin-right: 3px;
`; 