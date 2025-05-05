import React from 'react';
import styled from '@emotion/styled';
import { Box, Button, Typography, DialogContentText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { TransportMode, DayPlan, Plan } from '@/type/plan';
import { useEffect, useState } from 'react';
import api from '@/utils/axios';
import CustomDialog from '@/components/common/CustomDialog';

interface RightPanelProps {
    isOpen: boolean;
    plan: Plan;
    currentDate: Date;
    currentDateIndex: number;
    dateRange: Date[];
    dayPlans: DayPlan[];
    onTogglePanel: () => void;
    onOpenModal: () => void;
    onDateChange: (index: number) => void;
    transportMode: TransportMode;
    onTransportModeChange: (mode: TransportMode) => void;
    onDeletePlace: (dateStr: string, placeId: string) => void;
    onResetPlaces?: (dateStr: string) => void;
    isEditMode?: boolean;
    isViewOnly?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    onReturn?: () => void;
}

interface CreateTravelResponse {
  data: number; // travelId
}

interface TravelCourse {
  name: string;
  address: string;
  description: string;
  courseDate: string;
  moveTime: number;
}

const RightPanel = ({
    isOpen,
    plan,
    currentDate,
    currentDateIndex,
    dateRange,
    dayPlans,
    onTogglePanel,
    onOpenModal,
    onDateChange,
    transportMode,
    onTransportModeChange,
    onDeletePlace,
    onResetPlaces,
    isEditMode,
    isViewOnly,
    onSave,
    onCancel,
    onReturn,
}: RightPanelProps) => {
    const [totalTravelTime, setTotalTravelTime] = useState(0);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
    const [openErrorDialog, setOpenErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const currentPlan = dayPlans.find(plan =>
            plan.date.toDateString() === currentDate.toDateString()
        );

        if (!currentPlan?.places || currentPlan.places.length <= 1) {
            setTotalTravelTime(0);
            return;
        }

        const totalMinutes = currentPlan.places.reduce((sum, place) =>
            sum + (place.travelDuration || 0), 0);

        setTotalTravelTime(totalMinutes);
    }, [dayPlans, currentDate]);

    const handleReset = () => {
        const currentPlan = dayPlans.find(plan => 
            plan.date.toDateString() === currentDate.toDateString()
        );
        
        if (currentPlan) {
            setOpenConfirmDialog(true);
        }
    };

    const confirmReset = () => {
        const currentPlan = dayPlans.find(plan => 
            plan.date.toDateString() === currentDate.toDateString()
        );
        
        if (currentPlan) {
            currentPlan.places.forEach(place => {
                onDeletePlace(currentDate.toDateString(), place.id);
            });
        }
        setOpenConfirmDialog(false);
    };

    // 시간 포맷팅 함수 추가
    const formatTravelTime = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes}분`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
    };

    const handleCreateTravel = async () => {
        try {
            // 1. 여행 일정 생성 요청
            const { data: createTravelResponse } = await api.post<CreateTravelResponse>('/v1/travel', {
                area: plan.region,
                title: "",
                thumbnail: null,
                startDate: plan.startDate.toISOString().split('T')[0],
                endDate: plan.endDate.toISOString().split('T')[0],
            });

            const travelId = createTravelResponse.data;
            console.log("travelId", plan.region);

            // 2. 날짜별로 정렬된 코스 데이터 생성
            const courses: TravelCourse[] = dayPlans
                .filter(dayPlan => dayPlan.places.length > 0) // 장소가 있는 날짜만 필터링
                .flatMap(dayPlan => 
                    dayPlan.places.map(place => ({
                        name: place.name,
                        address: place.address.split(' ').slice(1).join(' '),
                        description: '',
                        courseDate: dayPlan.date.toISOString().split('T')[0],
                        moveTime: place.travelDuration || 0,
                    }))
                );

            // 3. 여행 코스 등록 요청
            const res = await api.post(`/v1/travel/${travelId}/course`, courses);
            console.log("res", res);

            // 성공 시 처리
            setOpenSuccessDialog(true);

        } catch (error) {
            console.error('Error:', error);
            setErrorMessage('여행 일정 등록에 실패했습니다.');
            setOpenErrorDialog(true);
        }
    };

    const handleSuccessClose = () => {
        setOpenSuccessDialog(false);
        window.location.href = '/my';
    };

    return (
        <>
            <RightPanelWrapper open={isOpen}>
                <PanelToggleButton onClick={onTogglePanel}>
                    {isOpen ?
                        <KeyboardArrowDownIcon sx={{ color: '#9A9A9A' }} /> :
                        <KeyboardArrowUpIcon sx={{ color: '#9A9A9A' }} />
                    }
                </PanelToggleButton>
                <Planinfo onClick={onOpenModal} style={{ cursor: 'pointer' }}>
                    <Typography fontWeight={500}>{plan.region}</Typography>
                    <Typography fontSize={12}>
                        {plan.startDate.toLocaleDateString()} ~{' '}
                        {plan.endDate.toLocaleDateString()}
                    </Typography>
                </Planinfo>
                {isOpen && (
                    <PlanContents>
                        <DaySelector>
                            <ArrowButton
                                disabled={currentDateIndex === 0}
                                onClick={() => onDateChange(Math.max(currentDateIndex - 1, 0))}
                            >
                                ◀
                            </ArrowButton>
                            <Typography fontSize={15} fontWeight={500} sx={{ textAlign: 'center' }}>
                                {currentDate.toLocaleDateString()}
                            </Typography>
                            <ArrowButton
                                disabled={currentDateIndex === dateRange.length - 1}
                                onClick={() => onDateChange(Math.min(currentDateIndex + 1, dateRange.length - 1))}
                            >
                                ▶
                            </ArrowButton>
                        </DaySelector>
                        
                        {currentDate && (
                            <>
                                {(() => {
                                    const currentPlan = dayPlans.find(plan =>
                                        plan.date.toDateString() === currentDate.toDateString()
                                    );

                                    return currentPlan?.places.length ? (
                                        <>
                                            {!isViewOnly && (
                                                <ResetButton onClick={handleReset}>
                                                    장소선택 초기화
                                                </ResetButton>
                                            )}
                                            <PlaceList isViewOnly={isViewOnly}>
                                                {currentPlan.places.map((place, index) => (
                                                    <PlaceItem key={place.id}>
                                                        <PlaceNumber>{index + 1}</PlaceNumber>
                                                        <PlaceContent>
                                                            <PlaceInfo>
                                                                <PlaceName>{place.name}</PlaceName>
                                                                <PlaceAddress>
                                                                    {place.address.split(' ').slice(1).join(' ')}
                                                                </PlaceAddress>
                                                            </PlaceInfo>
                                                            {index > 0 && place.travelDurationText && (
                                                                <TravelTime>
                                                                    {place.travelDurationText}
                                                                </TravelTime>
                                                            )}
                                                            {!isViewOnly && (
                                                                <DeleteButton onClick={() => onDeletePlace(currentDate.toDateString(), place.id)}>
                                                                    <img src="/icons/trash.svg" alt="delete" />
                                                                </DeleteButton>
                                                            )}
                                                        </PlaceContent>
                                                    </PlaceItem>
                                                ))}
                                            </PlaceList>
                                            <EstimatedTimeBox>
                                                <div>
                                                    <Typography fontSize={12}>예상 총 이동시간</Typography>
                                                    <Typography fontWeight={600}>
                                                        {formatTravelTime(totalTravelTime)}
                                                    </Typography>
                                                </div>
                                                {!isViewOnly && (
                                                    <TransportModeSelector>
                                                        <TransportButton selected={transportMode === 'WALKING'} onClick={() => onTransportModeChange('WALKING')}>
                                                            도보
                                                        </TransportButton>
                                                        <TransportButton selected={transportMode === 'TRANSIT'} onClick={() => onTransportModeChange('TRANSIT')}>
                                                            대중교통
                                                        </TransportButton>
                                                        <TransportButton selected={transportMode === 'DRIVING'} onClick={() => onTransportModeChange('DRIVING')}>
                                                            자동차
                                                        </TransportButton>
                                                    </TransportModeSelector>
                                                )}
                                            </EstimatedTimeBox>
                                        </>
                                    ) : (
                                        <NoPlan>
                                            장소를 추가해 <br />
                                            여행 계획을 세워보세요!
                                        </NoPlan>
                                    );
                                })()}
                            </>
                        )}

                        <BottomSection>
                            {isViewOnly ? (
                                <Button 
                                    color="primary" 
                                    variant="outlined" 
                                    fullWidth
                                    onClick={onReturn}
                                >
                                    돌아가기
                                </Button>
                            ) : isEditMode ? (
                                <ButtonContainer>
                                    <SaveButton variant="contained" onClick={onSave}>
                                        저장하고 나가기
                                    </SaveButton>
                                    <CancelButton variant="outlined" onClick={onCancel}>
                                        취소
                                    </CancelButton>
                                </ButtonContainer>
                            ) : (
                                <Button 
                                    color="primary" 
                                    variant="contained" 
                                    fullWidth
                                    onClick={handleCreateTravel}
                                >
                                    + 여행 일정 등록하기
                                </Button>
                            )}
                        </BottomSection>
                    </PlanContents>
                )}
            </RightPanelWrapper>

            {/* 확인 모달 */}
            <CustomDialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
                title="확인"
                confirmButtonText="삭제"
                onConfirm={confirmReset}
                showCancelButton={true}
            >
                <DialogContentText>
                    선택한 날짜의 모든 장소가 삭제됩니다. 계속하시겠습니까?
                </DialogContentText>
            </CustomDialog>

            {/* 성공 모달 */}
            <CustomDialog
                open={openSuccessDialog}
                onClose={handleSuccessClose}
                title="성공"
                confirmButtonText="확인"
                onConfirm={handleSuccessClose}
            >
                <DialogContentText>
                    여행 일정이 성공적으로 등록되었습니다.
                </DialogContentText>
            </CustomDialog>

            {/* 에러 모달 */}
            <CustomDialog
                open={openErrorDialog}
                onClose={() => setOpenErrorDialog(false)}
                title="오류"
                confirmButtonText="확인"
            >
                <DialogContentText>
                    {errorMessage}
                </DialogContentText>
            </CustomDialog>
        </>
    );
};

const RightPanelWrapper = styled(Box) <{ open: boolean }>`
  display: flex;
  position: absolute;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  width: 320px;
  height: ${({ open }) => (open ? '580px' : '56px')};
  transition: height 0.3s ease;
  border-radius: 10px;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const PanelToggleButton = styled('div')`
  position: absolute;
  top: -31px;
  left: 50%;
  transform: translateX(-50%);
  height: 30px;
  width: 78px;
  background-color: white;
  border: 1px solid #ddd;
  border-bottom: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
`;

const Planinfo = styled(Box)`
  display: flex;
  align-items: end;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #DDD;
  height: 56px
`;

const PlanContents = styled(Box)`
  display: flex;
  flex-direction: column;
  height: calc(100% - 56px);
  padding: 16px;
  padding-top: 0px;
`;

const NoPlan = styled(Box)`
  flex: 1;
  width: 100%;
  background-color: #F7F7F7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9A9A9A;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 18px;
  border-radius: 6px;
  text-align: center;
  line-height: 150%
`;

const DaySelector = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
`;

const ArrowButton = styled(Button)`
  min-width: 24px;
  padding: 0;
  font-size: 18px;
  color: #CCC;
  background: none;
  &:disabled {
    color: #F0F0F0;
  }
`;

const PlaceList = styled(Box)<{ isViewOnly?: boolean }>`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: ${({ isViewOnly }) => isViewOnly ? '12px' : undefined};
`;

const PlaceItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 6px;
`;

const PlaceNumber = styled('div')`
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background-color: #D2E0FB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlaceContent = styled(Box)`
  flex: 1;
  display: flex;
  flex-direction: row;
  border-radius: 10px;
  border: 1px solid #D2E0FB;
  padding: 12px;
  align-items: center;
`;


const PlaceInfo = styled(Box)`
  width: 100%;
  display: flex;
  flex-direction: column;
  
`;

const PlaceName = styled(Typography)`
  font-size: 12px;
  font-weight: 500;
  color: #000000;
`;

const PlaceAddress = styled(Typography)`
  font-size: 10px;
  color: #666666;
  margin-top: 2px;
`;

const DeleteButton = styled(Button)`
  margin-left: 10px;
  min-width: 24px;
  padding: 0;
  font-size: 18px;
  color: #CCC;
  background: none;
  &:hover {
    color: #8EACCD;
  }
`;

const TravelTime = styled('div')`
  font-size: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #8EACCD;
  padding: 4px 8px;
  border-radius: 10px;
  height: 22px;
  white-space: nowrap;
`;

const ResetButton = styled(Typography)`
  margin-top: 10px;
  color: #8C8C8C;
  font-size: 10px;
  text-align: right;
  cursor: pointer;
  margin-bottom: 8px;
  text-decoration: underline;
`;

const BottomSection = styled(Box)`
  margin-top: auto;
  padding-top: 16px;
`;

const EstimatedTimeBox = styled(Box)`
  background-color: #FEF9D9;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const TransportModeSelector = styled.div`
  height: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: end;
`;

const TransportButton = styled.button<{ selected: boolean }>`
  padding: 4px 6px;
  border: none;
  border: 1px solid black;
  background-color: ${props => props.selected ? '#000000' : 'transparent'};
  border-radius: 10px;
  cursor: pointer;
  font-size: 10px;
  color: ${props => props.selected ? '#FFFFFF' : '#000000'};
  transition: all 0.2s ease;
`;

const ButtonContainer = styled(Box)`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const SaveButton = styled(Button)`
  flex: 1;
`;

const CancelButton = styled(Button)`
  flex: 1;
`;

export default RightPanel;


