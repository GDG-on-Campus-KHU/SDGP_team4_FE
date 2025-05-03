import React, { useState, useRef } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import styled from '@emotion/styled';
import { Editor } from '@toast-ui/react-editor';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import '@toast-ui/editor/dist/i18n/ko-kr';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TravelPlanViewer from '@/components/common/TravelPlanViewer';
import api from '@/utils/axios';

interface Place {
  name: string;
  address: string;
  description?: string;
}

interface Day {
  date: string;
  places: Place[];
}

interface TravelJournalProps {
  onClose: () => void;
  travelInfo: {
    title: string;
    startDate: string;
    endDate: string;
    travelId: string;
  };
  days: Day[];
}

export default function TravelJournal({ onClose, travelInfo, days }: TravelJournalProps) {
  const [title, setTitle] = useState('');
  const editorRef = useRef<Editor>(null);

  const handleSave = async () => {
    console.log("dfdf", travelInfo.travelId);
    const editorInstance = editorRef.current?.getInstance();
    const html = editorInstance?.getHTML();
    try {
      const res = await api.post(`/v1/travel/${travelInfo.travelId}/post`, {
        title,
        description: html,
      });
      console.log("res:", res);
      alert('게시글로 전환 성공!');
    } catch (e: any) {
      alert('게시글 전환 실패: ' + (e.response?.data?.message || e.message));
    }
  };

  return (
    <Container>
      <Header>
        <HeaderRow>
          <TextField
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="여행 일지 제목을 입력하세요."
            variant="outlined"
            size="small"
            InputProps={{
              sx: {
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none', // 테두리 제거
                },
                '& input': {
                  fontSize: '20px',
                  color: '#000',
                  paddingLeft: 0, // 왼쪽 패딩 제거
                  '&::placeholder': {
                    color: '#BDBDBD',
                    opacity: 1,
                  },
                },
              },
            }}
          />
          <ButtonContainer>
            <Button 
              variant="contained" 
              onClick={handleSave}
              sx={{
                width: '85px',
              }}
              >
              저장하기
            </Button>
            <Button 
              variant="outlined" 
              onClick={onClose}
              sx={{
                width: '85px',
              }}
            >
              취소
            </Button>
          </ButtonContainer>
        </HeaderRow>
        <LocationDateContainer>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <LocationOnIcon color="secondary" sx={{ fontSize: '24px', marginLeft: '-3px' }} />
            <Typography fontSize={14}>
              {travelInfo.title}
            </Typography>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarTodayIcon color="secondary" sx={{ fontSize: '18px' }} />
            <Typography fontSize={14}>
              {`${travelInfo.startDate} ~ ${travelInfo.endDate}`}
            </Typography>
          </div>
        </LocationDateContainer>
      </Header>
      <EditorContainer>
        <Editor
          ref={editorRef}
          initialValue=""
          placeholder="여행 일지를 작성해보세요!"
          previewStyle="vertical"
          height="400px"
          initialEditType="wysiwyg"
          useCommandShortcut={true}
          hideModeSwitch={true}
          plugins={[colorSyntax]}
          language="ko-KR"
        />
      </EditorContainer>
      <Box mt={6}>
        <Typography fontSize={16} fontWeight={500} mb={3}>여행 계획 보기</Typography>
        <TravelPlanViewer days={days} />
      </Box>
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

const HeaderRow = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
`;

const LocationDateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: -20px;
`;

const EditorContainer = styled(Box)`
  width: 100%;
  position: relative;
  margin-bottom: 24px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #E0E0E0;

  .toastui-editor-defaultUI {
    border: none;
  }

  .toastui-editor-toolbar {
    border-bottom: 1px solid #E0E0E0;
  }

  .toastui-editor-popup-color {
    border: none !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08) !important;
  }
`;

const ButtonContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SaveButton = styled(Button)`
  width: 85px;
`;

const CancelButton = styled(Button)`
  width: 85px;
`;



