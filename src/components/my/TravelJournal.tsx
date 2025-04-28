import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import styled from '@emotion/styled';

interface TravelJournalProps {
  onClose: () => void;
  travelInfo: {
    title: string;
    startDate: string;
    endDate: string;
  };
}

export default function TravelJournal({ onClose, travelInfo }: TravelJournalProps) {
  const [journalContent, setJournalContent] = useState('');

  return (
    <Container>
      <Header>
        <Typography variant="h6" sx={{ fontWeight: 500, marginBottom: 3 }}>
          여행 일지 제목을 입력하세요.
        </Typography>
        <TextField
          fullWidth
          placeholder="여행 일지를 작성해보세요."
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: '4px',
            }
          }}
        />
        <LocationDateContainer>
          <LocationIcon>📍</LocationIcon>
          <Typography fontSize={14} color="#666">
            {travelInfo.title}
          </Typography>
          <DateDivider>|</DateDivider>
          <CalendarIcon>📅</CalendarIcon>
          <Typography fontSize={14} color="#666">
            {`${travelInfo.startDate} ~ ${travelInfo.endDate}`}
          </Typography>
        </LocationDateContainer>
      </Header>

      <EditorContainer>
        <TextField
          fullWidth
          multiline
          minRows={15}
          value={journalContent}
          onChange={(e) => setJournalContent(e.target.value)}
          placeholder="여행 일지를 작성해보세요!"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              borderRadius: '4px',
            }
          }}
        />
        <ImageAddButton>
          <AddIcon>+</AddIcon>
          이미지 추가
        </ImageAddButton>
      </EditorContainer>

      <ButtonContainer>
        <SaveButton variant="contained">
          저장하기
        </SaveButton>
      </ButtonContainer>
    </Container>
  );
}

const Container = styled(Box)`
  padding: 48px 24px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled(Box)`
  margin-bottom: 40px;
`;

const LocationDateContainer = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
`;

const LocationIcon = styled.span`
  font-size: 16px;
`;

const CalendarIcon = styled.span`
  font-size: 16px;
`;

const DateDivider = styled.span`
  color: #ddd;
`;

const EditorContainer = styled(Box)`
  width: 100%;
  position: relative;
  margin-bottom: 24px;
`;

const ImageAddButton = styled(Button)`
  position: absolute;
  right: 16px;
  bottom: 16px;
  background-color: black;
  color: white;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover {
    background-color: #333;
  }
`;

const AddIcon = styled.span`
  font-size: 18px;
  font-weight: bold;
`;

const ButtonContainer = styled(Box)`
  display: flex;
  justify-content: flex-end;
`;

const SaveButton = styled(Button)`
  background-color: #8EACCD;
  border-radius: 4px;
  padding: 6px 16px;
  &:hover {
    background-color: #7d99b9;
  }
`;