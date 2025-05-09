'use client'
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Avatar, Tabs, Tab, IconButton, Card, CardContent, CardMedia, CircularProgress, Pagination, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import styled from '@emotion/styled';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/my/EditProfileModal';
import CustomDialog from '@/components/common/CustomDialog';
import api from '@/utils/axios';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

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

  // 페이지네이션 상태 추가
  const [travelPage, setTravelPage] = useState(1);
  const [myPostPage, setMyPostPage] = useState(1);
  const [savedPostPage, setSavedPostPage] = useState(1);
  const [travelTotalPages, setTravelTotalPages] = useState(1);
  const [myPostTotalPages, setMyPostTotalPages] = useState(1);
  const [savedPostTotalPages, setSavedPostTotalPages] = useState(1);
  const itemsPerPage = 9;

  // Dialog 상태 관리
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUnsaveDialog, setOpenUnsaveDialog] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTravelId, setSelectedTravelId] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

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

  // 여행 일정 데이터 fetch - 페이지네이션 적용
  const fetchTravels = async (page = 0) => {
    setLoading(true);
    try {
      const { data } = await api.get<TravelResponse>(`/v1/member/travel?page=${page}&size=${itemsPerPage}`);

      if (data?.data) {
        console.log("여행 계획:", data.data.content);
        setTravels(data.data.content);
        setTravelTotalPages(data.data.totalPages || 1);
      } else {
        console.error('Unexpected API response structure:', data);
        setTravels([]);
        setTravelTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching travels:', error);
      setTravels([]);
      setTravelTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // 내가 작성한 여행 일지 fetch - 페이지네이션 적용
  const fetchMyPosts = async (page = 0) => {
    setLoading(true);
    try {
      const { data } = await api.get<PostResponse>(`/v1/member/post?page=${page}&size=${itemsPerPage}`);

      if (data?.data) {
        console.log("내 여행 일지:", data.data.content);
        setMyPosts(data.data.content);
        setMyPostTotalPages(data.data.totalPages || 1);
      } else {
        setMyPosts([]);
        setMyPostTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching my posts:', error);
      setMyPosts([]);
      setMyPostTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // 내가 저장한 여행 일지 fetch - 페이지네이션 적용
  const fetchSavedPosts = async (page = 0) => {
    setLoading(true);
    try {
      const { data } = await api.get<PostResponse>(`/v1/member/post?isLike=true&page=${page}&size=${itemsPerPage}`);

      if (data?.data) {
        console.log("저장한 여행:", data.data.content);
        setSavedPosts(data.data.content);
        setSavedPostTotalPages(data.data.totalPages || 1);
      } else {
        setSavedPosts([]);
        setSavedPostTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setSavedPosts([]);
      setSavedPostTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // 페이지네이션 핸들러 추가
  const handleTravelPageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setTravelPage(page);
    fetchTravels(page - 1); // API는 0-based, UI는 1-based
  };

  const handleMyPostPageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setMyPostPage(page);
    fetchMyPosts(page - 1);
  };

  const handleSavedPostPageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setSavedPostPage(page);
    fetchSavedPosts(page - 1);
  };

  // 탭 변경 시 데이터 로드
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0 && travels.length === 0) {
      fetchTravels(travelPage - 1);
    } else if (newValue === 1 && myPosts.length === 0) {
      fetchMyPosts(myPostPage - 1);
    } else if (newValue === 2 && savedPosts.length === 0) {
      fetchSavedPosts(savedPostPage - 1);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    fetchTravels(0); // 기본 탭은 여행 계획이므로 여행 계획 데이터를 로드
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
  const handleDeleteTravel = (travelId: number) => {
    setSelectedTravelId(travelId);
    setOpenDeleteDialog(true);
  };

  // 확인 후 삭제 처리
  const confirmDeleteTravel = async () => {
    if (selectedTravelId === null) return;

    try {
      await api.delete(`/v1/travel/${selectedTravelId}`);
      setTravels((prev) => prev.filter((t) => t.travelId !== selectedTravelId));
      setOpenDeleteDialog(false);

      // 현재 페이지의 항목이 모두 삭제되었을 경우, 이전 페이지로 이동
      if (travels.length === 1 && travelPage > 1) {
        setTravelPage(prev => prev - 1);
        fetchTravels(travelPage - 2);
      } else {
        fetchTravels(travelPage - 1);
      }
    } catch (error) {
      setErrorMessage('삭제에 실패했습니다.');
      setOpenErrorDialog(true);
      console.error('Error deleting travel:', error);
    }
  };

  // 저장 취소 함수
  const handleUnsavePost = (postId: number) => {
    setSelectedPostId(postId);
    setOpenUnsaveDialog(true);
  };

  // 확인 후 저장 취소 처리
  const confirmUnsavePost = async () => {
    if (selectedPostId === null) return;

    try {
      await api.post(`/v1/post/${selectedPostId}`);
      setOpenUnsaveDialog(false);
      
      // 북마크 해제 후 저장한 여행 목록 다시 불러오기
      fetchSavedPosts(savedPostPage - 1);
    } catch (error) {
      setErrorMessage('저장 취소에 실패했습니다.');
      setOpenErrorDialog(true);
      console.error('Error unsaving post:', error);
    }
  };

  const handleBookmarkClick = async (postId: number) => {
    try {
      await api.post(`/v1/post/${postId}`);
      
      // activeTab에 따라 적절한 데이터 다시 불러오기
      if (activeTab === 1) {
        // 내 여행일지 탭에서는 좋아요 상태만 업데이트
        fetchMyPosts(myPostPage - 1);
      } else if (activeTab === 2) {
        // 저장한 여행 탭에서는 목록 전체 다시 불러오기
        fetchSavedPosts(savedPostPage - 1);
      }
    } catch (e: any) {
      setErrorMessage('좋아요 처리 실패: ' + (e.response?.data?.message || e.message));
      setOpenErrorDialog(true);
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
            justifyContent: 'space-between',
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
          <Typography fontSize={20} fontWeight="500" color="black" mt={2}>{post.title || '부산광역시'}</Typography>
          <Typography fontSize={12} color="#8C8C8C" mt={0.5} >
            📅 작성일: {post.date}
          </Typography>
        </CardContent>
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          onClick={e => {
            e.stopPropagation();
            handleBookmarkClick(post.postId);
          }}
        >
          <div style={{
            fontSize: '12px',
            color: '#333'
          }}>{post.likeCount ?? 0}</div>
          {post.isMyLike ? (
            <BookmarkIcon sx={{ color: 'black' }} />
          ) : (
            <BookmarkBorderIcon sx={{ color: 'black' }} />
          )}
        </div>
      </StyledCard>
    );
  };

  // 현재 활성 탭에 대한 페이지네이션 렌더링
  const renderPagination = () => {
    if (loading) return null;

    if (activeTab === 0) {
      return (
        <PaginationContainer>
          <Pagination
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#C1C1C1',
                borderColor: '#C1C1C1',
              },
            }}
            count={travelTotalPages}
            page={travelPage}
            onChange={handleTravelPageChange}
          />
        </PaginationContainer>

      );
    } else if (activeTab === 1) {
      return (
        <PaginationContainer>
          <Pagination
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#C1C1C1',
                borderColor: '#C1C1C1',
              },
            }}
            count={myPostTotalPages}
            page={myPostPage}
            onChange={handleMyPostPageChange}

          />
        </PaginationContainer>
      );
    } else if (activeTab === 2) {
      return (
        <PaginationContainer>
          <Pagination
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#C1C1C1',
                borderColor: '#C1C1C1',
              },
            }}
            count={savedPostTotalPages}
            page={savedPostPage}
            onChange={handleSavedPostPageChange}
          />
        </PaginationContainer>
      );
    }
  };

  // 활성 탭에 따른 콘텐츠 렌더링
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px 0' }}>
          <CircularProgress />
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
        <>
          <CardContainer>
            {travels.map((trip) => (
              <StyledCard
                key={trip.travelId}
                onClick={() => router.push(`/my/${trip.travelId}`)}
                sx={{ cursor: 'pointer' }}
              >
                {trip.thumbnail && (
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
                      color: trip.title ? '#585858' : '#9A9A9A',
                    }}
                  >
                    {trip.title ? trip.title : '여행 일지를 작성해보세요!'}
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
          {renderPagination()}
        </>
      );
    }

    if (activeTab === 1) {
      if (myPosts.length === 0) {
        return (
          <EmptyMessage>작성한 여행 일지가 없습니다.</EmptyMessage>
        );
      }
      return (
        <>
          <CardContainer>
            {myPosts.map(post => renderPostCard(post))}
          </CardContainer>
          {renderPagination()}
        </>
      );
    }

    if (activeTab === 2) {
      if (savedPosts.length === 0) {
        return (
          <EmptyMessage>저장한 여행 일지가 없습니다.</EmptyMessage>
        );
      }
      return (
        <>
          <CardContainer>
            {savedPosts.map(post => renderPostCard(post, true))}
          </CardContainer>
          {renderPagination()}
        </>
      );
    }
  };

  return (
    <>
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

      {/* 삭제 확인 다이얼로그 */}
      <CustomDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        title="확인"
        confirmButtonText="삭제"
        cancelButtonText="취소"
        onConfirm={confirmDeleteTravel}
        showCancelButton={true}
      >
        <Typography>정말 삭제하시겠습니까?</Typography>
      </CustomDialog>

      {/* 저장 취소 확인 다이얼로그 */}
      <CustomDialog
        open={openUnsaveDialog}
        onClose={() => setOpenUnsaveDialog(false)}
        title="확인"
        confirmButtonText="확인"
        cancelButtonText="취소"
        onConfirm={confirmUnsavePost}
        showCancelButton={true}
      >
        <Typography>저장을 취소하시겠습니까?</Typography>
      </CustomDialog>

      {/* 오류 다이얼로그 */}
      <CustomDialog
        open={openErrorDialog}
        onClose={() => setOpenErrorDialog(false)}
        title="알림"
        confirmButtonText="확인"
      >
        <Typography>{errorMessage}</Typography>
      </CustomDialog>
    </>
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
  height: 134px;
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

const PaginationContainer = styled(Box)`
  display: flex;
  justify-content: center;
  margin-top: 40px;
  margin-bottom: 20px;
`;