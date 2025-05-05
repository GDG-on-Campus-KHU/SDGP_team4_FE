'use client'
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Avatar, Tabs, Tab, IconButton, Card, CardContent, CardMedia } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/my/EditProfileModal';
import api from '@/utils/axios';
import BookmarkIcon from '@mui/icons-material/Bookmark';

// 인터페이스 정의 수정
interface TravelContent {
  travelId: number;
  title: string;
  thumbnail: string | null;
  startDate: string;
  endDate: string;
  isPost: boolean;
  area: string;
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

// 응답 타입 정의
interface MemberResponse {
  message: string;
  data: {
    nickname: string;
    region: string;
  };
}

// 여행 일지와 저장한 여행 인터페이스 추가
interface PostContent {
  postId: number;
  title: string;
  nickname: string;
  date: string;
  description: string;
  likeCount: number;
  isMyLike: boolean;
  thumbnail?: string;
}

interface PostData {
  content: PostContent[];
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

interface PostResponse {
  message: string;
  data: PostData;
}

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [travels, setTravels] = useState<TravelContent[]>([]);
  const [myPosts, setMyPosts] = useState<PostContent[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostContent[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({ nickname: '', region: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 사용자 정보 fetch 함수
  const fetchUserInfo = async () => {
    try {
      const { data } = await api.get<MemberResponse>('/v1/member');

      if (data?.data) {
        setUserInfo({
          nickname: data.data.nickname,
          region: data.data.region,
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // 여행 일정 데이터 fetch
  const fetchTravels = async () => {
    try {
      const { data } = await api.get<TravelResponse>('/v1/member/travel');

      if (data?.data?.content) {
        console.log("여행 계획:", data.data.content);
        setTravels(data.data.content);
      } else {
        console.error('Unexpected API response structure:', data);
        setTravels([]);
      }
    } catch (error) {
      console.error('Error fetching travels:', error);
      setTravels([]);
    }
  };

  // 내가 작성한 여행 일지 fetch
  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PostResponse>('/v1/member/post');

      if (data?.data?.content) {
        console.log("내 여행 일지:", data.data.content);
        setMyPosts(data.data.content);
      } else {
        setMyPosts([]);
      }
    } catch (error) {
      console.error('Error fetching my posts:', error);
      setMyPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // 내가 저장한 여행 일지 fetch
  const fetchSavedPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PostResponse>('/v1/member/post?isLike=true');

      if (data?.data?.content) {
        console.log("저장한 여행:", data.data.content);
        setSavedPosts(data.data.content);
      } else {
        setSavedPosts([]);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setSavedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 데이터 로드
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0 && travels.length === 0) {
      fetchTravels();
    } else if (newValue === 1 && myPosts.length === 0) {
      fetchMyPosts();
    } else if (newValue === 2 && savedPosts.length === 0) {
      fetchSavedPosts();
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchTravels(); // 기본 탭은 여행 계획이므로 여행 계획 데이터를 로드
  }, []);

  // HTML 태그 제거하는 함수
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  // description에서 첫 번째 이미지 URL 추출하는 함수
  const extractImageUrl = (description: string) => {
    if (!description) return null;

    // img 태그에서 src 속성 추출을 위한 정규식
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = description.match(imgRegex);

    return match ? match[1] : null;
  };

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

  // 여행 삭제 함수
  const handleDeleteTravel = async (travelId: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/v1/travel/${travelId}`);
      setTravels((prev) => prev.filter((t) => t.travelId !== travelId));
    } catch (error) {
      alert('삭제에 실패했습니다.');
      console.error('Error deleting travel:', error);
    }
  };

  // 저장 취소 함수
  const handleUnsavePost = async (postId: number) => {
    if (!window.confirm('저장을 취소하시겠습니까?')) return;
    try {
      await api.post(`/v1/post/${postId}`);
      setSavedPosts((prev) => prev.filter((p) => p.postId !== postId));
    } catch (error) {
      alert('저장 취소에 실패했습니다.');
      console.error('Error unsaving post:', error);
    }
  };

  // 게시물 카드 렌더링 함수
  const renderPostCard = (post: PostContent, isSaved: boolean = false) => {
    const thumbnailUrl = post.thumbnail || extractImageUrl(post.description) || null;

    return (
      <StyledCard
        key={post.postId}
        onClick={() => router.push(`/travel/${post.postId}`)}
        sx={{ cursor: 'pointer' }}
      >
        {thumbnailUrl && (
          <CardMedia
            component="img"
            image={thumbnailUrl}
            alt={post.title}
            sx={{
              width: "100px",
              height: "100px",
              borderRadius: "5px",
              backgroundColor: '#f5f5f5',
              objectFit: 'cover',
              marginRight: "16px"
            }}
          />
        )}
        <CardContent
          sx={{
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            '&:last-child': {
              paddingBottom: 0,
            },
          }}
        >
          <AuthorInfo>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#DDD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '4px',
              }}
            >
              <PersonIcon sx={{ fontSize: 20, color: 'white' }} />
            </div>
            <Typography fontSize={12} ml={0.5}>{post.nickname || '익명'}</Typography>
          </AuthorInfo>
          <Typography fontSize={18} fontWeight="500" color="black" mt={1.5} mb={0.5}>{post.title || '부산광역시'}</Typography>
          <Typography fontSize={12} color="#8C8C8C" mt={0.5} >
            📅 작성일: {post.date}
          </Typography>
        </CardContent>
      </StyledCard>
    );
  };

  // 활성 탭에 따른 콘텐츠 렌더링
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
          <Typography>로딩 중...</Typography>
        </Box>
      );
    }

    if (activeTab === 0) {
      if (travels.length === 0) {
        return (
          <EmptyMessage>여행 계획이 없습니다.</EmptyMessage>
        );
      }
      return (
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
                    width: "100px",
                    height: "100px",
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
                  {trip.area}
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
                <DeleteButton
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteTravel(trip.travelId);
                  }}
                >
                  <img src="/icons/trash.svg" alt="delete" />
                </DeleteButton>
              </CardContent>
            </StyledCard>
          ))}
        </CardContainer>
      );
    }

    if (activeTab === 1) {
      if (myPosts.length === 0) {
        return (
          <EmptyMessage>작성한 여행 일지가 없습니다.</EmptyMessage>
        );
      }
      return (
        <CardContainer>
          {myPosts.map(post => renderPostCard(post))}
        </CardContainer>
      );
    }

    if (activeTab === 2) {
      if (savedPosts.length === 0) {
        return (
          <EmptyMessage>저장한 여행 일지가 없습니다.</EmptyMessage>
        );
      }
      return (
        <CardContainer>
          {savedPosts.map(post => renderPostCard(post, true))}
        </CardContainer>
      );
    }
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
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="나의 여행" />
          <Tab label="나의 여행일지" />
          <Tab label="저장한 여행" />
        </Tabs>

        {renderContent()}
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

const EmptyMessage = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
  color: #9A9A9A;
  border: 1px dashed #E0E0E0;
  border-radius: 10px;
  margin-top: 20px;
`;

const AuthorInfo = styled(Box)`
  display: flex;
  align-items: center;
`;