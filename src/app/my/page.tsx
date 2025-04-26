'use client'
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Avatar, Tabs, Tab, IconButton, Card, CardContent, CardMedia } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/my/EditProfileModal';

// 인터페이스 정의 수정
interface TravelContent {
  travelId: number;
  title: string;
  thumbnail: string | null;
  startDate: string;
  endDate: string;
  isPost: boolean;
}

interface PageableSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

interface Pageable {
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
  sort: PageableSort;
}

interface TravelData {
  content: TravelContent[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: PageableSort;
  pageable: Pageable;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

interface TravelResponse {
  message: string;
  data: TravelData;
}

// 인터페이스 추가
interface UserInfo {
  nickname: string;
  region: string;
}

export default function MyPage() {
  const router = useRouter();
  const [travels, setTravels] = useState<TravelContent[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: '', region: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 사용자 정보 fetch 함수 추가
  const fetchUserInfo = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        console.error('No access token found');
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/proxy/v1/member', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('사용자 정보를 불러오는데 실패했습니다.');
      }

      const responseData = await response.json();
      
      if (responseData?.data) {
        setUserInfo({
          nickname: responseData.data.nickname,
          region: responseData.data.region,
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // 여행 일정 데이터 fetch
  const fetchTravels = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        console.error('No access token found');
        router.push('/signin'); // 토큰이 없으면 로그인 페이지로 리다이렉트
        return;
      }
      console.log(accessToken);

      const response = await fetch('/api/proxy/v1/member/travel', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('여행 일정을 불러오는데 실패했습니다.');
      }

      const responseData: TravelResponse = await response.json();

      if (responseData?.data?.content) {
        setTravels(responseData.data.content);
      } else {
        console.error('Unexpected API response structure:', responseData);
        setTravels([]);
      }
    } catch (error) {
      console.error('Error fetching travels:', error);
      setTravels([]);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchTravels();
  }, []);

  // D-day 계산 함수
  const calculateDday = (startDate: string) => {
    const today = new Date();
    const travelDate = new Date(startDate);
    const diffTime = travelDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `D-${diffDays}`;
    if (diffDays < 0) return `D+${Math.abs(diffDays)}`;
    return 'D-Day';
  };

  // 날짜 범위 포맷팅 함수
  const formatDateRange = (startDate: string, endDate: string) => {
    return `${startDate} ~ ${endDate}`;
  };

  const handleProfileUpdate = (newNickname: string, newRegion: string) => {
    setUserInfo({
      nickname: newNickname,
      region: newRegion,
    });
  };

  return (
    <Container>
      <Sidebar>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#D2E0FB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
          }}
        >
          <PersonIcon sx={{ fontSize: 55, color: 'white' }} />
        </Box>
        <Typography fontSize={16} fontWeight="500">{userInfo.nickname || '여행탐험가'}</Typography>
        <Typography fontSize={13} mt={0.5}>나의 지역: {userInfo.region || '정보 없음'}</Typography>
        <Button 
          variant="outlined" 
          sx={{ mt: 4, borderRadius: '20px' }}
          onClick={() => setIsEditModalOpen(true)}
        >
          회원정보 수정
        </Button>
        <Typography fontSize={12} color="#9A9A9A" mt={2} sx={{ cursor: 'pointer' }}>로그아웃</Typography>
      </Sidebar>
      
      <EditProfileModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentNickname={userInfo.nickname}
        currentRegion={userInfo.region}
        onSave={handleProfileUpdate}
      />

      <MainContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>마이 페이지</Typography>
        <Tabs value={0} sx={{ mb: 2 }}>
          <Tab label="나의 여행" />
          <Tab label="저장한 여행" />
        </Tabs>
        <CardContainer>
          {travels.map((trip) => (
            <StyledCard
              key={trip.travelId}
              onClick={() => router.push(`/my/${trip.travelId}`)}
              sx={{ cursor: 'pointer' }}
            >
              {trip.isPost && trip.thumbnail && (
                <CardMedia
                  component="img"
                  image={trip.thumbnail}
                  alt={trip.title}
                  sx={{
                    width: "120px",
                    borderRadius: "5px",
                    backgroundColor: '#f5f5f5',
                    objectFit: 'cover',
                    marginRight: "16px"
                  }}
                />
              )}
              <CardContent sx={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                '&:last-child': {
                  paddingBottom: 0,
                },
              }}>
                <DdayBadge>{calculateDday(trip.startDate)}</DdayBadge>
                <Typography
                  fontSize={18}
                  fontWeight="500"
                  color="black"
                >
                  {trip.title}
                </Typography>
                <Typography
                  fontSize={14}
                  sx={{
                    color: trip.isPost ? '#585858' : '#9A9A9A',
                  }}
                >
                  {trip.isPost ? trip.title : '여행 일지를 작성해보세요!'}
                </Typography>
                <Typography fontSize={12} color="#8C8C8C" mt={1}>
                  📅 {formatDateRange(trip.startDate, trip.endDate)}
                </Typography>
                <DeleteButton>
                  <img src="/icons/trash.svg" alt="delete" />
                </DeleteButton>
              </CardContent>
            </StyledCard>
          ))}
        </CardContainer>
      </MainContent>
    </Container>
  );
}

const Container = styled(Box)`
  display: flex;
  padding: 48px 24px;
  min-height: calc(100dvh - 70px);
`;

const Sidebar = styled(Box)`
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid #e0e0e0;
  padding-right: 24px;
`;

const MainContent = styled(Box)`
  flex: 1;
  padding-left: 40px;
`;

const CardContainer = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
`;

const StyledCard = styled(Card)`
  width: 330px;
  position: relative;
  border-radius: 10px;
  display: flex;
  padding: 16px;
  border: 1px solid #e0e0e0;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
`;

const DdayBadge = styled(Box)`
  display: inline-block;
  background: black;
  color: white;
  font-size: 12px;
  padding: 3px 7px;
  border-radius: 10px;
  margin-bottom: 6px;
`;

const DeleteButton = styled(IconButton)`
  position: absolute;
  top: 10px;
  right: 10px;
  color: #ccc;
`;
