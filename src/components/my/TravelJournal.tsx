import React, { useState, useRef, useEffect } from 'react';
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
import CustomDialog from '@/components/common/CustomDialog';
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
    area: string;
  };
  days: Day[];
}

export default function TravelJournal({ onClose, travelInfo, days }: TravelJournalProps) {
  const [title, setTitle] = useState('');
  const editorRef = useRef<Editor>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // Dialog 상태 관리
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [openTitleDialog, setOpenTitleDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File, callback: (url: string, altText: string) => void) => {
    try {
      const formData = new FormData();
      formData.append('images', file);
      
      const response = await api.post('/v1/bucket/image', formData);
    
      console.log('이미지 업로드 응답:', response.data);
      
      // 타입 안전성을 위한 응답 구조 확인
      const responseData = response.data as { message?: string; data?: { imageUrl?: string } };
      
      if (response.status === 200 && responseData.data && responseData.data.imageUrl) {
        const imageUrl = responseData.data.imageUrl;
        
        // 업로드된 이미지 URL 배열에 추가
        setUploadedImages(prev => [...prev, imageUrl]);
        
        // 에디터에 이미지 삽입
        callback(imageUrl, file.name);
      } else {
        console.error('이미지 업로드 응답 형식 오류:', response);
        setDialogMessage('이미지 업로드에 실패했습니다.');
        setOpenErrorDialog(true);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      setDialogMessage('이미지 업로드 중 오류가 발생했습니다.');
      setOpenErrorDialog(true);
    }
  };

  const handleSave = async () => {
    console.log("travelId:", travelInfo.travelId);
    const editorInstance = editorRef.current?.getInstance();
    const html = editorInstance?.getHTML();
    
    // 제목 유효성 검사
    if (!title.trim()) {
      setOpenTitleDialog(true);
      return;
    }
    
    try {
      // 게시글 내용은 별도의 API로 저장
      const postRes = await api.post(`/v1/travel/${travelInfo.travelId}/post`, {
        title,
        description: html,
        imgUrls: uploadedImages.length > 0 ? uploadedImages.join(',') : "" // 콤마로 구분된 문자열로 변환
      });

      console.log("게시글 저장 응답:", postRes);

      console.log("게시글 저장 응답:", );
      
      // 여행 정보 업데이트를 위한 데이터 구성
      // courseUpdateDto: days 배열의 장소 정보를 API 형식에 맞게 변환
      const courseUpdateDto = [];
      for (const day of days) {
        for (const place of day.places) {
          courseUpdateDto.push({
            name: place.name,
            address: place.address,
            description: place.description || "",
            courseDate: day.date,
            moveTime: 0 // 기본값 설정
          });
        }
      }
      
      // 첫 번째 업로드된 이미지를 썸네일로 사용
      const thumbnailUrl = uploadedImages.length > 0 ? uploadedImages[0] : "";
      console.log("사용할 썸네일 URL:", thumbnailUrl);
      console.log("업로드된 이미지들:", uploadedImages);
      
      // 여행 정보 업데이트 요청 데이터
      const updateData = {
        travelUpdateDto: {
          title: title,
          area: travelInfo.area,
          thumbnail: uploadedImages.length > 0 ? String(uploadedImages[0]) : "", // 명시적으로 문자열로 변환
          startDate: travelInfo.startDate,
          endDate: travelInfo.endDate
        },
        courseUpdateDto: courseUpdateDto
      };
      
      // 요청 데이터 로깅
      console.log("여행 정보 업데이트 요청 데이터:", JSON.stringify(updateData));
      
      // 여행 정보 업데이트 API 호출
      const updateRes = await api.put(`/v1/travel/${travelInfo.travelId}`, updateData);
      
      // 응답 로깅
      console.log("게시글 저장 응답:", postRes);
      console.log("여행 정보 업데이트 응답:", updateRes);
      
      setOpenSuccessDialog(true);
    } catch (e: any) {
      console.error('게시글 전환 오류:', e);
      console.error('오류 응답 데이터:', e.response?.data);
      setDialogMessage('게시글 전환 실패: ' + (e.response?.data?.message || e.message));
      setOpenErrorDialog(true);
    }
  };

  // 성공 다이얼로그 닫기 핸들러
  const handleSuccessClose = () => {
    setOpenSuccessDialog(false);
    onClose(); // 성공 후 닫기
  };

  useEffect(() => {
    console.log("travelInfo", travelInfo);
  }, [travelInfo]);

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
              {travelInfo.area}
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
          hooks={{
            addImageBlobHook: handleImageUpload
          }}
        />
      </EditorContainer>
      <Box mt={6}>
        <Typography fontSize={16} fontWeight={500} mb={3}>여행 계획 보기</Typography>
        <TravelPlanViewer days={days} />
      </Box>

      {/* 오류 다이얼로그 */}
      <CustomDialog
        open={openErrorDialog}
        onClose={() => setOpenErrorDialog(false)}
        title="오류"
      >
        <Typography>{dialogMessage}</Typography>
      </CustomDialog>

      {/* 성공 다이얼로그 */}
      <CustomDialog
        open={openSuccessDialog}
        onClose={handleSuccessClose}
        title="성공"
      >
        <Typography>게시글로 작성 완료!</Typography>
      </CustomDialog>

      {/* 제목 입력 알림 다이얼로그 */}
      <CustomDialog
        open={openTitleDialog}
        onClose={() => setOpenTitleDialog(false)}
        title="알림"
      >
        <Typography >제목을 입력해주세요.</Typography>
      </CustomDialog>
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



