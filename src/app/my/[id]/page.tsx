'use client'
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import CircularProgress from '@mui/material/CircularProgress';
import api from '@/utils/axios';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TravelJournal from '@/components/my/TravelJournal';
import { useAppDispatch } from '@/redux/hooks';
import { setTravelInfo, setSearchPlace } from '@/redux/slices/travelSlice';

// 인터페이스 정의
interface TravelInfoDto {
    travelId: number;
    title: string;
    thumbnail: string | null;
    startDate: string;
    endDate: string;
    isPost: boolean;
    area: string;
}

interface CourseInfoDto {
    id: number;
    nextId: number | null;
    courseDate: string;
    moveTime: number;
    name: string;
    address: string;
    description: string;
}

interface ApiResponse {
    message: string;
    data: {
        travelInfoDto: TravelInfoDto;
        courseInfoDtoList: CourseInfoDto[];
    };
}

// 날짜별로 코스를 그룹화하는 함수
const groupCoursesByDate = (courses: CourseInfoDto[]) => {
    const grouped = courses.reduce((acc, course) => {
        const date = course.courseDate;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(course);
        return acc;
    }, {} as Record<string, CourseInfoDto[]>);

    return Object.entries(grouped).map(([date, places]) => ({
        date,
        places
    }));
};

// Loading 컴포넌트 스타일 추가
const LoadingContainer = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 70px); // 헤더 높이(70px)를 제외한 전체 높이
`;

export default function TripDetailPage() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [currentPage, setCurrentPage] = useState(0);
    const [editingMemo, setEditingMemo] = useState<number | null>(null);
    const [memoText, setMemoText] = useState<string>('');
    const [tripData, setTripData] = useState<{
        thumbnail: string | null;
        isPost: boolean;
        area: string;
        title: string;
        dateRange: string;
        days: { date: string; places: CourseInfoDto[] }[];
    } | null>(null);
    const [isWritingJournal, setIsWritingJournal] = useState(false);

    useEffect(() => {
        const fetchTripData = async () => {
            try {
                const { data } = await api.get<ApiResponse>(`/v1/member/travel/${params.id}`);
                console.log("data:", data);

                // 데이터 구조 변환
                const formattedData = {
                    thumbnail: data.data.travelInfoDto.thumbnail,
                    isPost: data.data.travelInfoDto.isPost,
                    area: data.data.travelInfoDto.area,
                    title: data.data.travelInfoDto.title,
                    dateRange: `${data.data.travelInfoDto.startDate} ~ ${data.data.travelInfoDto.endDate}`,
                    days: groupCoursesByDate(data.data.courseInfoDtoList)
                };
                console.log(formattedData);
                setTripData(formattedData);
            } catch (error) {
                console.error('Error fetching trip data:', error);
            }
        };

        fetchTripData();
    }, [params.id]);

    if (!tripData) {
        return (
            <LoadingContainer>
                <CircularProgress />
            </LoadingContainer>
        );
    }

    const totalDays = tripData.days.map((day, index) => ({
        ...day,
        uniqueKey: `day-${index}`
    }));

    const pagesCount = Math.ceil(totalDays.length / 3);
    const currentDays = totalDays.slice(currentPage * 3, (currentPage + 1) * 3);

    const handleNextPage = () => {
        if (currentPage < pagesCount - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    // 메모 추가 버튼 클릭 핸들러
    const handleAddMemo = (placeId: number) => {
        setEditingMemo(placeId);
        setMemoText('');
    };

    // 메모 저장 핸들러
    const handleSaveMemo = async (dayIndex: number, placeIndex: number) => {
        if (!tripData) return;
        try {
            // 1. 기존 tripData 복사 및 description만 변경
            const newTripData = { ...tripData };
            const place = newTripData.days[dayIndex].places[placeIndex];
            place.description = memoText;

            setTripData(newTripData);
            setEditingMemo(null);
            setMemoText('');

            // 2. travelUpdateDto 생성
            const [startDate, endDate] = tripData.dateRange.split(' ~ ');
            const travelUpdateDto = {
                area: tripData.area,
                title: tripData.title,
                thumbnail: tripData.thumbnail,
                startDate,
                endDate,
            };

            // 3. courseUpdateDto 생성 (모든 장소 정보 평탄화)
            const courseUpdateDto = newTripData.days.flatMap(day =>
                day.places.map(place => ({
                    name: place.name,
                    address: place.address,
                    description: place.description,
                    courseDate: day.date,
                    moveTime: place.moveTime,
                }))
            );

            // 4. PUT 요청
            await api.put(`/v1/travel/${params.id}`, {
                travelUpdateDto,
                courseUpdateDto,
            });

            // 성공 시 별도 처리 필요 없으면 여기서 끝!
        } catch (error) {
            alert('메모 저장에 실패했습니다.');
            console.error('Error saving memo:', error);
        }
    };

    // 메모 수정 핸들러
    const handleEditMemo = (placeId: number, currentMemo: string) => {
        setEditingMemo(placeId);
        setMemoText(currentMemo);
    };

    // 장소 수정하기 버튼 핸들러 추가
    const handleEditPlaces = () => {
        if (!tripData) return;
        
        // 첫 번째 날짜의 첫 번째 장소 정보 가져오기
        const firstDayPlaces = tripData.days[0]?.places || [];
        const firstPlace = firstDayPlaces[0] || null;
        
        // Redux 액션을 디스패치하여 여행 정보 저장
        dispatch(setTravelInfo({
            travelId: params.id as string,
            title: tripData.title,
            area: tripData.area,
            startDate: tripData.dateRange.split(' ~ ')[0],
            endDate: tripData.dateRange.split(' ~ ')[1],
            days: tripData.days,
            thumbnail: tripData.thumbnail,
            initialPlace: firstPlace ? {
                name: firstPlace.name,
                address: firstPlace.address
            } : undefined
        }));
        
        // 지도 페이지로 이동
        router.push('/map');
    };

    // 지도에서 보기 버튼 핸들러 추가
    const handleViewOnMap = () => {
        if (!tripData) return;
        
        // 첫 번째 날짜의 첫 번째 장소 정보 가져오기
        const firstDayPlaces = tripData.days[0]?.places || [];
        const firstPlace = firstDayPlaces[0] || null;
        
        // Redux 액션을 디스패치하여 여행 정보 저장 (뷰 모드로 설정)
        dispatch(setTravelInfo({
            travelId: params.id as string,
            title: tripData.title,
            area: tripData.area,
            startDate: tripData.dateRange.split(' ~ ')[0],
            endDate: tripData.dateRange.split(' ~ ')[1],
            days: tripData.days,
            viewOnly: true, // 뷰 모드로 설정
            thumbnail: tripData.thumbnail,
            initialPlace: firstPlace ? {
                name: firstPlace.name,
                address: firstPlace.address
            } : undefined
        }));
        
        // 지도 페이지로 이동
        router.push('/map');
    };

    // 화살표 아이콘 클릭 핸들러 추가
    const handlePlaceView = (name: string, address: string) => {
        // 검색할 장소 정보 설정
        dispatch(setSearchPlace({
            name,
            address
        }));
        
        // 지도 페이지로 이동
        router.push('/map');
    };

    return (
        <Container>
            {isWritingJournal ? (
                <TravelJournal
                    onClose={() => setIsWritingJournal(false)}
                    travelInfo={{
                        area: tripData.area,
                        title: tripData.title,
                        startDate: tripData.dateRange.split(' ~ ')[0],
                        endDate: tripData.dateRange.split(' ~ ')[1],
                        travelId: params.id as string,
                    }}
                    days={tripData.days}
                />
            ) : (
                <>
                    <HeaderContainer>
                        <Header>
                            <div>
                                <Typography variant="h5" fontWeight={500}>{tripData.area}</Typography>
                                <DateRange>
                                    <CalendarIcon>📅</CalendarIcon>
                                    {tripData.dateRange}
                                </DateRange>
                                <MapButton onClick={handleViewOnMap}>지도에서 보기</MapButton>
                            </div>
                            <ButtonContainer>
                                <StyledButton 
                                  variant="outlined"
                                  onClick={handleEditPlaces}
                                >
                                  장소 수정하기
                                </StyledButton>
                                {tripData.isPost ? (
                                    null
                                ) : (
                                    <StyledButton
                                        variant="contained"
                                        onClick={() => setIsWritingJournal(true)}
                                    >
                                        여행일지 쓰기
                                    </StyledButton>
                                )}
                            </ButtonContainer>
                        </Header>
                    </HeaderContainer>
                    <TimelineSection>
                        <DaysContainer>
                            {currentDays.map((day, dayIndex) => (
                                <DaySection key={day.uniqueKey}>
                                    <DayTitle>{`${dayIndex + 1 + (currentPage * 3)}일차`}</DayTitle>
                                    <TimelineContainer>
                                        {day.places.map((place, placeIndex) => (
                                            <PlaceItem key={`${day.uniqueKey}-place-${place.id}`}>
                                                <PlaceContent>
                                                    <PlaceInfo>
                                                        <PlaceName>{place.name}</PlaceName>
                                                        <PlaceAddress>{place.address}</PlaceAddress>
                                                    </PlaceInfo>
                                                    <ArrowIcon onClick={() => handlePlaceView(place.name, place.address)} />
                                                    {!place.description && !editingMemo &&
                                                        <AddMemoButton onClick={() => handleAddMemo(place.id)}>
                                                            + 메모추가
                                                        </AddMemoButton>
                                                    }
                                                </PlaceContent>
                                                {(place.description || editingMemo === place.id) && (
                                                    <MemoBox>
                                                        {editingMemo === place.id ? (
                                                            <>
                                                                <MemoTextArea
                                                                    value={memoText}
                                                                    onChange={(e) => setMemoText(e.target.value)}
                                                                    placeholder="메모를 입력하세요..."
                                                                />
                                                                <MemoButtonContainer>
                                                                    <div onClick={() => setEditingMemo(null)}
                                                                        style={{ cursor: 'pointer', color: '#9A9A9A' }}
                                                                    >
                                                                        취소
                                                                    </div>
                                                                    <div style={{ color: '#D9D9D9', margin: '0 4px' }}>|</div>
                                                                    <div onClick={() => handleSaveMemo(dayIndex + (currentPage * 3), placeIndex)}
                                                                        style={{ cursor: 'pointer', color: '#90a4c8', fontWeight: 500 }}
                                                                    >
                                                                        저장
                                                                    </div>
                                                                </MemoButtonContainer>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {place.description}
                                                                <EditButton onClick={() => handleEditMemo(place.id, place.description)}>
                                                                    수정하기
                                                                </EditButton>
                                                            </>
                                                        )}
                                                    </MemoBox>
                                                )}
                                                {placeIndex < day.places.length - 1 && (
                                                    <TimelineWrapper>
                                                        <TimelineLine />
                                                        <TimelineDuration>
                                                            {day.places[placeIndex + 1].moveTime}분
                                                        </TimelineDuration>
                                                    </TimelineWrapper>
                                                )}
                                            </PlaceItem>
                                        ))}
                                    </TimelineContainer>
                                </DaySection>
                            ))}
                            {/* 3칸이 안되면 빈 칸 추가 */}
                            {Array.from({ length: 3 - currentDays.length }).map((_, idx) => (
                                <DaySection key={`empty-${idx}`} style={{ visibility: 'hidden' }} />
                            ))}
                        </DaysContainer>
                        <NavigationButtons>
                            <NavButton
                                onClick={handlePrevPage}
                                disabled={currentPage === 0}
                            >
                                <NavCircle>
                                    <LeftArrow />
                                </NavCircle>
                            </NavButton>
                            <NavButton
                                onClick={handleNextPage}
                                disabled={currentPage >= pagesCount - 1}
                            >
                                <NavCircle>
                                    <RightArrow />
                                </NavCircle>
                            </NavButton>
                        </NavigationButtons>
                    </TimelineSection>
                </>
            )}
        </Container>
    );
}

const Container = styled(Box)`
    padding: 48px 24px;
    max-width: 1200px;
    margin: 0 auto;
    justify-content: center;
`;

const Header = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
`;

const HeaderContainer = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 60px;
`;

const MapButton = styled(Button)`
    border: 1.5px solid #8EACCD;
    border-radius: 30px;
    padding: 2px;
    font-size: 12px;
    color: #8EACCD;
    white-space: nowrap;
    width: 90px;
    margin-top: 12px;
`;

const DateRange = styled(Typography)`
    font-size: 14px;
    color: #8C8C8C;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
`;

const CalendarIcon = styled.span`
    font-size: 16px;
`;

const TagContainer = styled(Box)`
    margin-top: 24px;
`;

const Tag = styled(Box)`
    display: inline-block;
    background: #000;
    color: white;
    padding: 4px 8px;
    border-radius: 15px;
    font-size: 12px;
`;

const ButtonContainer = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const StyledButton = styled(Button)`
    border-radius: 10px;
    padding: 6px 16px;
`;

const DaysContainer = styled(Box)`
    display: flex;
    gap: 120px;
    min-height: 500px;
    width: 1200px;
    margin: 0 auto;
    justify-content: center;
`;

const DaySection = styled(Box)`
    flex: 1;
`;

const DayTitle = styled(Typography)`
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 24px;
`;

const TimelineContainer = styled(Box)`
    
`;

const PlaceItem = styled(Box)`
   
`;

const PlaceContent = styled(Box)`
    border: 1px solid #D2E0FB;
    border-radius: 10px;
    padding: 16px;
    display: flex;
    align-items: center;
    background: white;
    width: 290px;
    position: relative;
    z-index: 2;
`;

const PlaceInfo = styled(Box)`
    flex: 1;
`;

const PlaceName = styled(Typography)`
    font-size: 14px;
    font-weight: 500;
`;

const PlaceAddress = styled(Typography)`
    font-size: 12px;
    color: #9A9A9A;
    margin-top: 4px;
`;

const ArrowIcon = styled(Box)`
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 10px solid #F0F0F0;
    margin-left: 8px;
    border-radius: 3px;
    transform: scale(1.2);
    cursor: pointer;
`;

const TimelineWrapper = styled(Box)`
    display: flex;
    align-items: center;
    padding-left: 20px;
`;

const TimelineLine = styled(Box)`
    width: 3px;
    height: 60px;
    background-color: #D2E0FB;
    margin-right: 12px;
`;

const TimelineDuration = styled(Box)`
    font-size: 14px;
`;

const MemoBox = styled(Box)`
    background-color: #FEF9D9;
    padding: 12px;
    padding-top: 20px;
    border-radius: 0px 0px 8px 8px;
    font-size: 12px;
    position: relative;
    width: 290px;
    margin-top: -10px;
    z-index: 1;
    white-space: pre-wrap;
`;

const EditButton = styled(Button)`
    position: absolute;
    right: 3px;
    bottom: -24px;
    color: #9A9A9A;
    font-size: 12px;
    text-decoration: underline;
    padding: 0;
    min-width: auto;
`;

const AddMemoButton = styled(Button)`
    position: absolute;
    right: 3px;
    bottom: -24px;
    color: #8EACCD;
    font-size: 12px;
    padding: 0;
    min-width: auto;
`;

const TimelineSection = styled(Box)`
    position: relative;
    width: 100%;
    min-height: 600px;
    display: flex;
    justify-content: center;
`;

const NavigationButtons = styled(Box)`
    position: fixed;
    top: 55%;
    width: 1330px;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    z-index: 10;
`;

const NavButton = styled(IconButton)`
    padding: 0;
    pointer-events: auto;
    opacity: ${props => props.disabled ? 0.3 : 1};
    cursor: ${props => props.disabled ? 'default' : 'pointer'};
    margin: 0 5px;
    &:hover {
        background: none;
    }
    transition: opacity 0.2s ease;
    position: relative;
    z-index: 20;
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

const LeftArrow = styled(Box)`    width: 0;
    height: 0;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-right: 10px solid #8EACCD;
    margin-right: 3px;
`;

// 새로운 스타일 컴포넌트 추가
const MemoTextArea = styled.textarea`
    width: 100%;
    border: none;
    background: transparent;
    resize: none;
    font-size: 12px;
    font-family: inherit;
    padding: 0;
    margin-bottom: 8px;
    &:focus {
        outline: none;
    }
`;

const MemoButtonContainer = styled(Box)`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`;

const MemoButton = styled.button<{ isPrimary?: boolean }>`
    font-size: 12px;
    padding: 4px 8px;
    min-width: 48px;
    color: ${props => props.isPrimary ? '#fff' : '#666'};
    background-color: ${props => props.isPrimary ? '#8EACCD' : 'transparent'};
    border: 1px solid ${props => props.isPrimary ? '#8EACCD' : '#D9D9D9'};
    cursor: pointer;
    border-radius: 4px;
    &:hover {
        background-color: ${props => props.isPrimary ? '#7d99b9' : '#f5f5f5'};
    }
`;
