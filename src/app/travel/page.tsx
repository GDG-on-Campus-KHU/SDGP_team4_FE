'use client';
import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, CardMedia, Avatar, Pagination } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';

interface TravelCardData {
    id: number;
    region: string;
    title: string;
    dateRange: string;
    thumbnail: string;
    author: string;
    avatar: string;
}

const dummyData: TravelCardData[] = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    region: '부산광역시',
    title: '부산여행 추천하는 명소들!',
    dateRange: '2025-03-25 ~ 2025-03-27',
    thumbnail: '/page.png',
    author: '뿌리',
    avatar: '/sample-avatar.jpg',
}));

const TravelPage = () => {
    const itemsPerPage = 8;
    const [page, setPage] = useState(1);
    const router = useRouter();
    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const paginatedData = dummyData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <Wrapper>
            <ContentWrapper>
                <SearchSection>
                    <SearchInput placeholder="지역을 검색해보세요!" />
                </SearchSection>
                <div style={{ marginTop: '50px' }}>
                    <SortTabs>
                        <Typography variant="body2" fontWeight={600}>최신순</Typography>
                        <Divider>|</Divider>
                        <Typography variant="body2">인기순</Typography>
                    </SortTabs>
                    <CardContainer>
                        {paginatedData.map((card) => (
                            <StyledCard key={card.id} onClick={() => router.push(`/travel/${card.id}`)}>
                                <CardMedia
                                    component="img"
                                    image={card.thumbnail}
                                    alt={card.title}
                                    sx={{
                                        width: "120px",
                                        borderRadius: "5px",
                                        backgroundColor: '#f5f5f5',
                                        objectFit: 'cover',
                                        marginRight: "16px"
                                    }}
                                />
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
                                        <Avatar src={card.avatar} sx={{ width: 24, height: 24 }} />
                                        <Typography fontSize={12} ml={0.5}>{card.author}</Typography>
                                    </AuthorInfo>
                                    <Typography fontSize={18} fontWeight="500" color="black" mt={1.5}>{card.region}</Typography>
                                    <Typography fontSize={14} color='#585858'>{card.title}</Typography>
                                    <Typography fontSize={12} color="#8C8C8C" mt={0.5} >
                                        📅 {card.dateRange}
                                    </Typography>
                                </CardContent>
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#333'
                                    }}>12</div>
                                    <BookmarkBorderIcon
                                        sx={{
                                            color: '#333',
                                        }}
                                    />
                                </div>
                            </StyledCard>
                        ))}
                    </CardContainer>
                </div>
                <PaginationWrapper>
                    <Pagination
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: '#C1C1C1',
                                borderColor: '#C1C1C1',
                            },
                        }}
                        count={Math.ceil(dummyData.length / itemsPerPage)}
                        page={page}
                        onChange={handlePageChange}
                    />
                </PaginationWrapper>
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
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const SearchInput = styled('input')`
  width: 700px; // 고정 너비로 설정
  padding: 12px 20px;
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