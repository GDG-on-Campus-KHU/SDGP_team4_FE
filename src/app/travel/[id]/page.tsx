'use client';
import React from 'react';
import { Box, Typography, Avatar, CardMedia, IconButton } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import styled from '@emotion/styled';

const TravelDetailPage = () => {
  return (
    <Wrapper>
      <ContentWrapper>
        {/* 작성자 정보 */}
        <UserInfo>
          <Avatar src="/sample-avatar.jpg" />
          <Typography ml={1} fontWeight={500}>뿌리</Typography>
        </UserInfo>

        {/* 제목 */}
        <Typography variant="h5" fontWeight="bold" mt={2}>부산여행 추천하는 명소들!</Typography>

        {/* 지역, 날짜 */}
        <SubInfo>
          <Typography fontSize={14} color="#757575">부산광역시</Typography>
          <Typography fontSize={14} color="#757575">2025-03-25 ~ 2025-03-27</Typography>
        </SubInfo>

        {/* 북마크 */}
        <BookmarkWrapper>
          <IconButton>
            <BookmarkBorderIcon sx={{ fontSize: 24 }} />
          </IconButton>
          <Typography fontSize={14}>67</Typography>
        </BookmarkWrapper>

        {/* 여행기 내용 */}
        <TravelContent>
          <Typography mb={3}>
            🏖 Day 1 - 도착과 첫 바다<br />
            부산역에 도착하자마자 따뜻한 바람이 반겨주었다. 해운대에 도착했을 땐, 이미 노을이 바다 위에 붉게 퍼지고 있었고...<br /><br />
            📚 Day 2 - 문화와 음식, 그리고 이야기<br />
            감천문화마을을 처음으로 방문했다...
          </Typography>

          {/* 이미지 갤러리 */}
          {/* <ImageGallery>
            {[1, 2, 3].map((_, i) => (
              <GalleryImage
                key={i}
                component="img"
                image="/sample-thumbnail.jpg"
                alt="부산 여행 이미지"
              />
            ))}
          </ImageGallery> */}
        </TravelContent>
      </ContentWrapper>
    </Wrapper>
  );
};

export default TravelDetailPage;

// Styled Components

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

const SubInfo = styled(Box)`
  display: flex;
  gap: 12px;
  margin-top: 6px;
`;

const BookmarkWrapper = styled(Box)`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
`;

const TravelContent = styled(Box)`
  margin-top: 30px;
  white-space: pre-line;
`;

const ImageGallery = styled(Box)`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const GalleryImage = styled(CardMedia)`
  width: 200px;
  height: 140px;
  border-radius: 10px;
  object-fit: cover;
  background-color: #f0f0f0;
`;