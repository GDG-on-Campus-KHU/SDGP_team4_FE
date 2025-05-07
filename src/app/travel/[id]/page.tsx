'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Avatar, CardMedia, IconButton, Button, TextField } from '@mui/material';
import api from '@/utils/axios';
import TravelPlanViewer from '@/components/common/TravelPlanViewer';
import styled from '@emotion/styled';
import { useParams, useRouter } from 'next/navigation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CircularProgress from '@mui/material/CircularProgress';
import PersonIcon from '@mui/icons-material/Person';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import '@toast-ui/editor/dist/i18n/ko-kr';
import CustomDialog from '@/components/common/CustomDialog';

const TravelDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const nickname = localStorage.getItem('nickname');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const editorRef = useRef<any>(null);
  
  // CustomDialog 관련 상태 추가
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    content: '',
    confirmButtonText: '확인',
    cancelButtonText: '취소',
    showCancel: false,
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  // 공통으로 사용할 다이얼로그 표시 함수
  const showDialog = (options: any) => {
    setDialog({
      open: true,
      title: options.title || '알림',
      content: options.content || '',
      confirmButtonText: options.confirmButtonText || '확인',
      cancelButtonText: options.cancelButtonText || '취소',
      showCancel: options.showCancel || false,
      onConfirm: options.onConfirm || (() => setDialog(prev => ({ ...prev, open: false }))),
      onCancel: options.onCancel || (() => setDialog(prev => ({ ...prev, open: false })))
    });
  };
  
  // 공통으로 사용할 확인 다이얼로그 닫기 함수
  const closeDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

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

        // 초기 제목 설정
        if (data.postSimpleDto) {
          setTitle(data.postSimpleDto.title || '');
        }
      } catch (e: any) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);




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
        showDialog({
          title: '오류',
          content: '이미지 업로드에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      showDialog({
        title: '오류',
        content: '이미지 업로드 중 오류가 발생했습니다.',
      });
    }
  };

  // 수정 취소
  const onClose = () => {
    showDialog({
      title: '수정 취소',
      content: '수정을 취소하시겠습니까?',
      showCancel: true,
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      onConfirm: () => {
        setIsEditing(false);
        closeDialog();
      }
    });
  };

  // 수정된 내용 저장
  const handleSave = async () => {
    if (!title.trim()) {
      showDialog({
        title: '알림',
        content: '제목을 입력해주세요.'
      });
      return;
    }

    try {
      setLoading(true);

      const editorContent = editorRef.current.getInstance().getHTML();

      const updatedPost = {
        title: title,
        description: editorContent,
      };

      const response = await api.put(`/v1/post/${id}`, updatedPost);

      if (response.status === 200) {
        console.log("수정내용확인", updatedPost);
        showDialog({
          title: '성공',
          content: '게시글이 성공적으로 수정되었습니다.',
          onConfirm: () => {
            setIsEditing(false);
            closeDialog();
            
            // 수정된 내용으로 post 업데이트
            setPost((prev: any) => ({
              ...prev,
              title: title,
              description: editorContent
            }));
          }
        });
      } else {
        showDialog({
          title: '오류',
          content: '게시글 수정에 실패했습니다.'
        });
      }
    } catch (error: any) {
      console.error('게시글 수정 오류:', error);
      showDialog({
        title: '오류',
        content: '게시글 수정 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  // 게시글 삭제
  const handleDelete = async () => {
    showDialog({
      title: '삭제 확인',
      content: '정말로 이 게시글을 삭제하시겠습니까?',
      showCancel: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      onConfirm: async () => {
        try {
          setLoading(true);
          closeDialog();
          const response = await api.delete(`/v1/post/${id}`);

          if (response.status === 200) {
            showDialog({
              title: '성공',
              content: '게시글이 성공적으로 삭제되었습니다.',
              onConfirm: () => {
                closeDialog();
                router.back(); // 이전 페이지로 돌아가기
              }
            });
          } else {
            showDialog({
              title: '오류',
              content: '게시글 삭제에 실패했습니다.'
            });
          }
        } catch (error: any) {
          console.error('게시글 삭제 오류:', error);
          showDialog({
            title: '오류',
            content: '게시글 삭제 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message)
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

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
      showDialog({
        title: '오류',
        content: '좋아요 처리 실패: ' + (e.response?.data?.message || e.message)
      });
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <UserInfo>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#DDD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '4px',
              }}
            >
              <PersonIcon sx={{ fontSize: 30, color: 'white' }} />
            </div>
            <Typography ml={1}>{post.nickname || '익명'}</Typography>
          </UserInfo>
          {nickname === post.nickname && !isEditing && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="contained" onClick={() => setIsEditing(true)}>
                수정
              </Button>
              <Button variant="outlined" onClick={handleDelete}>삭제</Button>
            </div>
          )}
          {nickname === post.nickname && isEditing && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="contained"
                onClick={handleSave}
              >
                저장
              </Button>
              <Button
                variant="outlined"
                onClick={onClose}
              >
                취소
              </Button>
            </div>
          )}
        </div>
        {isEditing ? (
          <>
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
                      marginTop: '24px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none', // 테두리 제거
                      },
                      '& input': {
                        fontSize: '24px',
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
              </HeaderRow>
            </Header>
            <EditorContainer>
              <Editor
                key={isEditing ? 'editing' : 'readonly'} // 강제로 리렌더링
                ref={editorRef}
                initialValue={post.description || ''} // 처음부터 내용을 전달
                previewStyle="vertical"
                height="400px"
                initialEditType="wysiwyg"
                useCommandShortcut={true}
                hideModeSwitch={true}
                plugins={[colorSyntax]}
                language="ko-KR"
                hooks={{
                  addImageBlobHook: handleImageUpload,
                }}
              />
            </EditorContainer>
          </>
        ) : (
          <>
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
              <Typography fontSize={14} color="#9A9A9A">
                작성일: {post.date || '2025-03-25 ~ 2025-03-27'}
              </Typography>
            </LocationDateContainer>
            <TravelContent>
              <Typography mb={3} component="div" dangerouslySetInnerHTML={{ __html: post.description }} />
            </TravelContent>
            {/* 여행 계획 보기 */}
          </>
        )}
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
      
      {/* CustomDialog 추가 */}
      <CustomDialog
        open={dialog.open}
        onClose={closeDialog}
        title={dialog.title}
        confirmButtonText={dialog.confirmButtonText}
        cancelButtonText={dialog.cancelButtonText}
        showCancelButton={dialog.showCancel}
        onConfirm={dialog.onConfirm}
      >
        {dialog.content}
      </CustomDialog>
    </Wrapper>
  );
};

export default TravelDetailPage;

const LocationDateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
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
  
  /* 편집하기, 미리보기 탭 강제 숨김 */
  .toastui-editor-mode-switch {
    display: none !important;
  }
  
  /* 플레이스홀더 텍스트 강제 숨김 */
  .toastui-editor-placeholder {
    display: none !important;
  }
`;

const ButtonContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;