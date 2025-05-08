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
import PersonIcon from '@mui/icons-material/Person';

const TravelPage = () => {
    const itemsPerPage = 9;
    const [page, setPage] = useState(1);
    const router = useRouter();
    const [bookmarked, setBookmarked] = useState<boolean[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState<'latest' | 'popular' | null>(null);


    // description에서 첫 번째 이미지 URL 추출하는 함수
    const extractImageUrl = (description: string) => {
        if (!description) return null;

        // img 태그에서 src 속성 추출을 위한 정규식
        const imgRegex = /<img[^>]+src="([^">]+)"/i;
        const match = description.match(imgRegex);

        return match ? match[1] : null;
    };

    // HTML 태그 제거하는 함수
    const stripHtmlTags = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '');
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // 정렬 함수
    const sortPosts = (posts: any[]) => {
        const sorted = [...posts];

        if (sortType === 'latest') {
            // 날짜 기준 정렬 (최신순)
            return sorted.sort((a, b) => {
                const dateA = new Date(a.date || '').getTime();
                const dateB = new Date(b.date || '').getTime();
                return dateB - dateA; // 내림차순
            });
        } else if (sortType === 'popular') {
            // 좋아요 수 기준 정렬 (인기순)
            return sorted.sort((a, b) => {
                const likesA = a.likeCount || 0;
                const likesB = b.likeCount || 0;
                return likesB - likesA; // 내림차순
            });
        }

        return sorted;
    };

    // 정렬 변경 핸들러
    const handleSortChange = (type: 'latest' | 'popular') => {
        // 이미 선택된 정렬 방식을 다시 클릭하면 정렬 해제
        setSortType(prev => prev === type ? null : type);
    };

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            // 검색어가 없으면 모든 게시물 표시 (정렬 적용)
            setFilteredPosts(sortPosts(posts));
            return;
        }

        // 검색어를 포함하는 게시물만 필터링
        const filtered = posts.filter(post => {
            // title에서 검색
            if (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }

            // description에서 검색 (HTML 태그 제거 후)
            if (post.description) {
                const plainText = stripHtmlTags(post.description).toLowerCase();
                return plainText.includes(searchTerm.toLowerCase());
            }

            return false;
        });

        // 필터링 후 정렬 적용
        setFilteredPosts(sortPosts(filtered));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
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
                const content = data.data?.content || data.content || [];
                setPosts(content);
                setFilteredPosts(sortPosts(content)); // 정렬 적용
                setTotalCount(data.data?.totalElements || data.totalElements || 0);
                setBookmarked(content.map((p: any) => p.isMyLike));
            } catch (e: any) {
                setError(e.response?.data?.message || e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [page]); // sortType은 의존성에서 제외

    // 검색어나 정렬 타입이 변경될 때 결과 업데이트
    useEffect(() => {
        if (searchTerm === '') {
            setFilteredPosts(sortPosts(posts)); // 정렬만 적용
        } else {
            handleSearch(); // 검색 및 정렬 적용
        }
    }, [sortType, posts]);

    useEffect(() => {
        console.log("posts:", posts);
    }, [posts]);

    return (
        <Wrapper>
            <ContentWrapper>
                <SearchSection>
                    <SearchInput
                        placeholder="검색어를 입력하세요."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                    />
                    <SearchIconWrapper onClick={handleSearch}>
                        <SearchIcon sx={{ fontSize: '28px' }} />
                    </SearchIconWrapper>
                </SearchSection>
                <SortTabs>
                    <SortButton
                        active={sortType === 'latest'}
                        onClick={() => handleSortChange('latest')}
                    >
                        최신순
                    </SortButton>
                    <Divider>|</Divider>
                    <SortButton
                        active={sortType === 'popular'}
                        onClick={() => handleSortChange('popular')}
                    >
                        인기순
                    </SortButton>
                </SortTabs>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', width: '100%' }}>
                        <CircularProgress />
                    </div>
                ) : (
                    <>
                        <div style={{ marginTop: '50px' }}>
                            {error ? (
                                <div style={{ textAlign: 'center', margin: '50px 0', color: '#666' }}>
                                    여행 게시글을 불러오는데 실패했습니다.
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div style={{ textAlign: 'center', margin: '50px 0', color: '#666' }}>
                                    검색 결과가 없습니다.
                                </div>
                            ) : (
                                <CardContainer>
                                    {filteredPosts.map((card, idx) => {
                                        // description에서 이미지 URL 추출 - 기본 이미지 폴백 제거
                                        const thumbnailUrl = extractImageUrl(card.description) || card.thumbnail || null;

                                        return (
                                            <StyledCard key={card.postId} onClick={() => router.push(`/travel/${card.postId}`)}>
                                                {thumbnailUrl && (
                                                    <CardMedia
                                                        component="img"
                                                        image={thumbnailUrl}
                                                        alt={card.title}
                                                        sx={{
                                                            width: "90px",
                                                            height: "90px",
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
                                                        <Typography fontSize={12} ml={0.5}>{card.nickname || '익명'}</Typography>
                                                    </AuthorInfo>
                                                    <Typography fontSize={20} fontWeight="500" color="black" mt={2}>{card.title || '부산광역시'}</Typography>
                                                    <Typography fontSize={12} color="#8C8C8C" mt={0.5} >
                                                        📅 작성일: {card.date}
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
  height: 134px;
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

// 정렬 버튼 스타일 컴포넌트
const SortButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  cursor: pointer;
  font-weight: ${props => props.active ? 600 : 400};
  color: ${props => props.active ? '#000' : '#666'};
  
  &:hover {
    opacity: 0.8;
  }
`;