'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Avatar, Pagination } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import api from '@/utils/axios';
import CircularProgress from '@mui/material/CircularProgress';

const TravelPage = () => {
    const itemsPerPage = 9;
    const [page, setPage] = useState(1);
    const router = useRouter();
    const [bookmarked, setBookmarked] = useState<boolean[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleBookmarkClick = async (idx: number, postId: number) => {
        try {
            const res = await api.post(`/v1/post/${postId}`);
            const { likeCount } = (res.data as any).data || (res.data as any);
            setPosts(prev => prev.map((p, i) =>
                i === idx
                    ? { ...p, isMyLike: !p.isMyLike, likeCount }
                    : p
            ));
        } catch (e: any) {
            alert('좋아요 처리 실패: ' + (e.response?.data?.message || e.message));
        }
    };

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/v1/post?page=${page - 1}&size=${itemsPerPage}`);
                const data: any = res.data;
                // 서버 응답 구조에 맞게 변환 (필요시 매핑)
                const content = data.data?.content || data.content || [];
                setPosts(content);
                setTotalCount(data.data?.totalElements || data.totalElements || 0);
                setBookmarked(content.map((p: any) => p.isMyLike));
            } catch (e: any) {
                setError(e.response?.data?.message || e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [page]);

    useEffect(() => {
        console.log("posts:", posts);
    }, [posts]);

    return (
        <Wrapper>
            <ContentWrapper>
                <SearchSection>
                    <SearchInput placeholder="지역을 검색해보세요!" />
                    <SearchIconWrapper>
                        <SearchIcon sx={{fontSize: '28px'}}/>
                    </SearchIconWrapper>
                </SearchSection>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', width: '100%' }}>
                        <CircularProgress />
                    </div>
                ) : (
                <>
                <div style={{ marginTop: '50px' }}>
                    <SortTabs>
                        <Typography variant="body2" fontWeight={600}>최신순</Typography>
                        <Divider>|</Divider>
                        <Typography variant="body2">인기순</Typography>
                    </SortTabs>
                    {error ? (
                        <div style={{ color: 'red' }}>에러: {error}</div>
                    ) : (
                    <CardContainer>
                        {posts.map((card, idx) => {
                            return (
                                <StyledCard key={card.postId} onClick={() => router.push(`/travel/${card.postId}`)}>
                                    {/* <CardMedia
                                        component="img"
                                        image={card.thumbnail || '/page.png'}
                                        alt={card.title}
                                        sx={{
                                            width: "120px",
                                            borderRadius: "5px",
                                            backgroundColor: '#f5f5f5',
                                            objectFit: 'cover',
                                            marginRight: "16px"
                                        }}
                                    /> */}
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
                                            <Avatar src={card.avatar || '/sample-avatar.jpg'} sx={{ width: 24, height: 24 }} />
                                            <Typography fontSize={12} ml={0.5}>{card.author || '익명'}</Typography>
                                        </AuthorInfo>
                                        <Typography fontSize={18} fontWeight="500" color="black" mt={1.5}>{card.region || '부산광역시'}</Typography>
                                        <Typography fontSize={14} color='#585858'>{card.title}</Typography>
                                        <Typography fontSize={12} color="#8C8C8C" mt={0.5} >
                                            📅 {card.dateRange || '2025-03-25 ~ 2025-03-27'}
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
                                            handleBookmarkClick(idx, card.postId);
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#333'
                                        }}>{card.likeCount ?? 0}</div>
                                        {card.isMyLike ? (
                                            <BookmarkIcon sx={{ color: 'black' }} />
                                        ) : (
                                            <BookmarkBorderIcon sx={{ color: 'black' }} />
                                        )}
                                    </div>
                                </StyledCard>
                            );
                        })}
                    </CardContainer>
                    )}
                </div>
                <PaginationWrapper>
                    <Pagination
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: '#C1C1C1',
                                borderColor: '#C1C1C1',
                            },
                        }}
                        count={Math.ceil(totalCount / itemsPerPage)}
                        page={page}
                        onChange={handlePageChange}
                    />
                </PaginationWrapper>
                </>
                )}
            </ContentWrapper>
        </Wrapper>
    );
};

export default TravelPage;

const Wrapper = styled(Box)`
  width: 100%;
  display: flex;
  justify-content: center;  // 중앙 정렬
`;

const ContentWrapper = styled(Box)`
  margin-top: 60px;
  width: 700px;
  display: flex;
  flex-direction: column;
  align-items: center; // 내부 컨텐츠도 중앙 정렬
`;

const SearchSection = styled(Box)`
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const SearchInput = styled('input')`
  width: 700px;
  padding: 12px 44px 12px 20px;
  border: 3px solid #90a4c8;
  border-radius: 30px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #aaa;
  }
  &::placeholder {
    color: #898989;
  }
`;

const SearchIconWrapper = styled('div')`
  position: absolute;
  right: 16px;
  top: 52%;
  transform: translateY(-50%);
  color: #90a4c8;
  cursor: pointer;
`;

const CardContainer = styled(Box)`
  display: grid;
  grid-template-columns: repeat(3, 1fr); // 한 줄에 3개
  gap: 24px;
  justify-items: center; // 카드 중앙 정렬
  margin-top: 36px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr); // 태블릿 이하에서는 2개
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr; // 모바일에서는 1개
  }
`;

const SortTabs = styled(Box)`
  display: flex;
  justify-content: flex-end;
`;

const Divider = styled.span`
  margin: 0 10px;
  color: #aaa;
`;

const StyledCard = styled(Card)`
  width: 330px;
  position: relative;
  border-radius: 10px;
  display: flex;
  padding: 16px;
  border: 1px solid #e0e0e0;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
`;

const AuthorInfo = styled(Box)`
  display: flex;
  align-items: center;
`;

const PaginationWrapper = styled(Box)`
  margin-top: 40px;
  display: flex;
  justify-content: center;
`;