'use client'
import React from 'react';
import { Box, Typography, Button, Avatar, Tabs, Tab, IconButton, Card, CardContent, CardMedia } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';

const dummyData = [
  {
    id: 1,
    title: '부산광역시',
    description: '즐거운 부산여행 ~~',
    dateRange: '2025-03-25 ~ 2025-03-27',
    dDay: 'D+2',
    image: 'https://cdn.pixabay.com/photo/2016/11/18/17/20/beach-1836335_1280.jpg'
  },
  {
    id: 2,
    title: '부산광역시',
    description: '여행 일지를 작성해보세요!',
    dateRange: '2025-03-25 ~ 2025-03-27',
    dDay: 'D-2',
    image: null
  },
  {
    id: 3,
    title: '부산광역시',
    description: '즐거운 부산여행 ~~',
    dateRange: '2025-03-25 ~ 2025-03-27',
    dDay: 'D+2',
    image: 'https://cdn.pixabay.com/photo/2016/11/18/17/20/beach-1836335_1280.jpg'
  },
  {
    id: 4,
    title: '부산광역시',
    description: '여행 일지를 작성해보세요!',
    dateRange: '2025-03-25 ~ 2025-03-27',
    dDay: 'D-2',
    image: null
  }
];

export default function MyPage() {
  const router = useRouter();

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
        <Typography fontSize={16} fontWeight="500">여행탐험가</Typography>
        <Typography fontSize={13} mt={0.5}>나의 지역: 수원시</Typography>
        <Button variant="outlined" sx={{ mt: 4, borderRadius: '20px' }}>회원정보 수정</Button>
        <Typography fontSize={12} color="#9A9A9A" mt={2} sx={{ cursor: 'pointer' }}>로그아웃</Typography>
      </Sidebar>
      <MainContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>마이 페이지</Typography>
        <Tabs value={0} sx={{ mb: 2 }}>
          <Tab label="나의 여행" />
          <Tab label="저장한 여행" />
        </Tabs>
        <CardContainer>
          {dummyData.map((trip) => (
            <StyledCard 
              key={trip.id} 
              onClick={() => router.push(`/my/${trip.id}`)}
              sx={{ cursor: 'pointer' }}
            >
              {trip.image && (
                <CardMedia
                  component="img"
                  image={trip.image}
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
                  paddingBottom: 0, // ✅ 이게 핵심!
                },
              }}>
                <DdayBadge>{trip.dDay}</DdayBadge>
                <Typography fontSize={18} fontWeight="600" mt={1}>{trip.title}</Typography>
                <Typography
                  fontSize={14}
                  sx={{
                    color: trip.image ? '#585858' : '#9A9A9A', // ✅ 조건에 따라 색상 변경
                  }}
                >
                  {trip.description}
                </Typography>
                <Typography fontSize={12} color="#8C8C8C" mt={1}>📅 {trip.dateRange}</Typography>
                <DeleteButton>
                  <img src="/icons/trash.svg"/>
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
