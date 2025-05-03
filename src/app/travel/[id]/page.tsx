'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, CardMedia, IconButton } from '@mui/material';
import api from '@/utils/axios';
import TravelPlanViewer from '@/components/common/TravelPlanViewer';
import styled from '@emotion/styled';
import { useParams } from 'next/navigation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CircularProgress from '@mui/material/CircularProgress';

const TravelDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/v1/post/${id}`);
        const data: any = (res as any).data?.data || (res as any).data;
        console.log("data:ghkrdls", res);
        setPost(data.postSimpleDto || null);
        setCourses(data.courseInfoDtos || []);
      } catch (e: any) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  // post 상태 변경 시 콘솔 출력
  useEffect(() => {
    console.log('post:', post);
  }, [post]);

  const handleBookmarkClick = async () => {
    if (!post) return;
    try {
      const res = await api.post(`/v1/post/${post.postId}`);
      const { likeCount, isMyLike } = (res.data as any).data || (res.data as any);
      setPost((prev: any) => ({ ...prev, likeCount, isMyLike }));
    } catch (e: any) {
      alert('좋아요 처리 실패: ' + (e.response?.data?.message || e.message));
    }
  };


  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', width: '100%' }}>
      <CircularProgress />
    </div>
  );
  if (error) return <Wrapper><ContentWrapper style={{ color: 'red' }}>에러: {error}</ContentWrapper></Wrapper>;
  if (!post) return null;


  return (
    <Wrapper>
      <ContentWrapper>
        {/* 작성자 정보 */}
        <UserInfo>
          <Avatar src={post.avatar || '/sample-avatar.jpg'} />
          <Typography ml={1} fontWeight={500}>{post.author || '익명'}</Typography>
        </UserInfo>
        {/* 제목 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={500} mt={4}>{post.title}</Typography>
          <BookmarkWrapper>
            <Typography fontSize={14}>{post.likeCount ?? 0}</Typography>
            <IconButton onClick={handleBookmarkClick}>
              {post.isMyLike ? (
                <BookmarkIcon sx={{ fontSize: 24, color: 'black' }} />
              ) : (
                <BookmarkBorderIcon sx={{ fontSize: 24, color: 'black' }} />
              )}
            </IconButton>
          </BookmarkWrapper>
        </div>
        {/* 지역, 날짜 */}
        <LocationDateContainer>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LocationOnIcon color="secondary" sx={{ fontSize: '24px', marginLeft: '-3px' }} />
            <Typography fontSize={14}>
              {post.region || '부산광역시'}
            </Typography>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarTodayIcon color="secondary" sx={{ fontSize: '18px' }} />
            <Typography fontSize={14}>
              {post.dateRange || '2025-03-25 ~ 2025-03-27'}
            </Typography>
          </div>
        </LocationDateContainer>
        <TravelContent>
          <Typography mb={3} component="div" dangerouslySetInnerHTML={{ __html: post.description }} />
        </TravelContent>
        {/* 여행 계획 보기 */}
        <Box mt={10}>
          <Typography fontSize={16} fontWeight={500} mb={3}>여행 계획 보기</Typography>
          <TravelPlanViewer days={(() => {
            // courses를 days 형태로 변환
            if (!courses || courses.length === 0) return [];
            // courseDate별로 그룹핑
            const grouped: { [date: string]: any[] } = {};
            courses.forEach((c) => {
              if (!grouped[c.courseDate]) grouped[c.courseDate] = [];
              grouped[c.courseDate].push(c);
            });
            console.log("grouped:", grouped);
            return Object.entries(grouped).map(([date, places]) => ({
              date,
              places: places.map((p: any) => ({
                name: p.name,
                address: p.address,
                description: p.description,
              }))
            }));
          })()} />
        </Box>
      </ContentWrapper>
    </Wrapper>
  );
};

export default TravelDetailPage;

const LocationDateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 30px;
`;

const Wrapper = styled(Box)`
  display: flex;
  justify-content: center;
  padding: 60px 24px;
`;

const ContentWrapper = styled(Box)`
  width: 800px;
`;

const UserInfo = styled(Box)`
  display: flex;
  align-items: center;
`;

const BookmarkWrapper = styled(Box)`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
`;

const TravelContent = styled(Box)`
  margin-top: 60px;
  white-space: pre-line;
  border-left: 1px solid #e0e0e0;
  padding-left: 20px;
`;
