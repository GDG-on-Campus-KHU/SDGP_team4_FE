import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import SearchComponent from './SearchComponent';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import CommentSection from './CommentSection';
import api from '@/utils/axios';

interface SidebarProps {
  open: boolean;
  onLoad: (ref: google.maps.places.Autocomplete) => void;
  onPlaceChanged: () => void;
  placeName: string;
  setPlaceName: React.Dispatch<React.SetStateAction<string>>;
  selectedPlace: {
    name: string;
    address: string;
    location?: { lat: number | (() => number); lng: number | (() => number) };
    photos?: google.maps.places.PlacePhoto[];
    imgUrls?: string[];
  } | null;
  onAddPlace: () => void;
  selectedPlaceId?: number | null;
  setSelectedPlaceId?: React.Dispatch<React.SetStateAction<number | null>>;
  isLoading?: boolean;
}

const Sidebar = ({
  open,
  onLoad,
  onPlaceChanged,
  placeName,
  setPlaceName,
  selectedPlace,
  onAddPlace,
  selectedPlaceId,
  setSelectedPlaceId,
  isLoading = false,
}: SidebarProps) => {
  // 상태 추가
  const [isPlaceRegistered, setIsPlaceRegistered] = useState(false);
  const [planId, setPlanId] = useState<number | null>(null);
  const [emotions, setEmotions] = useState({ best: 0, good: 0, soso: 0, bad: 0 });
  const [comments, setComments] = useState<{ nickname: string; date: string; text: string }[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeInfo, setPlaceInfo] = useState<{ 
    commentsCnt: number; 
    best: number; 
    good: number; 
    soso: number; 
    bad: number;
    imgUrls?: string[];
  } | null>(null);

  // selectedPlaceId가 변경될 때 해당 장소 정보 가져오기
  useEffect(() => {
    // 마커에서 선택된 장소가 있으면 해당 ID를 planId로 설정
    if (selectedPlaceId) {
      setPlanId(selectedPlaceId);
      setIsPlaceRegistered(true);

      // // 감정 상태 초기화
      // setEmotions({ best: 0, good: 0, soso: 0, bad: 0 });
      // setComments([]);
    }
  }, [selectedPlaceId]);

  // 장소 등록 및 planId 반환
  const registerPlaceIfNeeded = async (afterRegister?: (newPlanId: number) => Promise<void>) => {
    if (isPlaceRegistered && planId && !needsRegister()) return planId;

    setLoading(true);
    try {
      let latitude = 0;
      let longitude = 0;
      if (selectedPlace?.location) {
        const latVal = selectedPlace.location.lat;
        const lngVal = selectedPlace.location.lng;
        latitude = typeof latVal === 'function' ? latVal() : latVal;
        longitude = typeof lngVal === 'function' ? lngVal() : lngVal;
      }

      // 이미지 URL을 8등분으로 쪼개서 배열로 저장
      const imgUrls: string[] = [];
      if (selectedPlace?.photos && selectedPlace.photos[0]) {
        try {
          const fullUrl = selectedPlace.photos[0].getUrl();
          console.log('원본 URL 길이:', fullUrl.length);

          // URL을 8등분으로 쪼개기
          const chunkSize = Math.ceil(fullUrl.length / 8);
          for (let i = 0; i < 8; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, fullUrl.length);
            const chunk = fullUrl.substring(start, end);
            imgUrls.push(chunk);
          }

          console.log('URL 분할 결과:', {
            totalChunks: imgUrls.length,
            chunkSizes: imgUrls.map(chunk => chunk.length)
          });
        } catch (e) {
          console.error('이미지 URL 추출 및 분할 오류:', e);
          // 오류 발생 시 빈 배열 사용
          imgUrls.length = 0;
        }
      }

      console.log('장소 등록 요청:', {
        name: selectedPlace?.name,
        address: selectedPlace?.address,
        latitude,
        longitude,
        imgUrlsCount: imgUrls.length
      });

      const res = await api.post('/v1/places', {
        name: selectedPlace?.name,
        address: selectedPlace?.address,
        latitude,
        longitude,
        imgUrls // 쪼개진 URL 조각들이 담긴 배열 전송
      });

      if (res.status === 200) {
        const data = res.data as { placeId: number, commentsCnt: number };
        console.log('장소 등록 성공:', data);

        setIsPlaceRegistered(true);
        setPlanId(data.placeId);

        if (afterRegister) {
          await afterRegister(data.placeId);
        }

        return data.placeId;
      } else {
        console.error('장소 등록 실패:', res);
        alert('장소 등록에 실패했습니다.');
        return null;
      }
    } catch (e) {
      console.error('장소 등록 오류:', e);
      alert('장소 등록 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const actuallyAddComment = async (id: number) => {
    try {
      const memberId = localStorage.getItem('nickname') || '';
      const region = localStorage.getItem('region') || '';
      const address = selectedPlace?.address || '';
      const isLocal = region && address.includes(region);

      console.log('댓글 등록 시작:', {
        placeId: id,
        isLocal,
        comment: commentInput
      });

      const res = await api.post('/v1/comments', {
        placeId: id,
        isLocal,
        comment: commentInput,
      });

      // 응답 상태가 200인 경우에만 성공 처리
      if (res.status === 200) {
        console.log('댓글 등록 성공:', res.data);

        // 댓글 등록 후 UI 업데이트
        setComments(prev => [...prev, {
          nickname: memberId,
          date: new Date().toISOString(),
          text: commentInput
        }]);

        // 장소 정보 업데이트 (댓글 수 증가)
        if (placeInfo) {
          setPlaceInfo({
            ...placeInfo,
            commentsCnt: placeInfo.commentsCnt + 1
          });
        }

        setCommentInput('');
        return true;
      } else {
        console.error('댓글 등록 실패:', res);
        alert('댓글 등록에 실패했습니다.');
        return false;
      }
    } catch (e) {
      console.error('댓글 등록 오류:', e);
      alert('댓글 등록 중 오류가 발생했습니다.');
      return false;
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || loading) return;

    setLoading(true);
    try {
      // 장소 등록이 필요한지 확인
      const needRegister = !isPlaceRegistered || !planId || needsRegister();

      if (needRegister) {
        console.log('장소 등록이 필요합니다');
        // 콜백 방식으로 변경하여 실행 순서 보장
        await registerPlaceIfNeeded(async (newPlanId) => {
          console.log('장소 등록 후 댓글 등록 시작, planId:', newPlanId);
          await actuallyAddComment(newPlanId);
        });
      } else if (planId) {
        console.log('장소가 이미 등록되어 있습니다, planId:', planId);
        await actuallyAddComment(planId);
      }
    } catch (error) {
      console.error('댓글 등록 프로세스 오류:', error);
      alert('댓글을 등록하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const actuallyAddEmotion = async (id: number, type: 'best' | 'good' | 'soso' | 'bad') => {
    try {
      const feedbackType = type.toUpperCase(); // BEST, GOOD, SOSO, BAD
      
      console.log('감정 등록 시작:', {
        placeId: id,
        feedbackType
      });
      
      setEmotions(prev => ({ ...prev, [type]: prev[type] + 1 }));
      
      // 장소 정보 업데이트
      if (placeInfo) {
        setPlaceInfo({
          ...placeInfo,
          [type]: placeInfo[type] + 1
        });
      }
      
      // API 요청
      const res = await api.post(`/v1/places/${id}/feedbacks?feedbackType=${feedbackType}`);
      //console.log("res:", res);
      
      return true;
    } catch (e: any) {
      //console.error('감정 등록 오류:', e);
    }
  };

  const handleEmotion = async (type: 'best' | 'good' | 'soso' | 'bad') => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('감정 표현 요청 시작:', { type, planId, isPlaceRegistered });
      
      // 장소가 등록되어 있는지 확인
      if (isPlaceRegistered && planId) {
        console.log('장소가 이미 등록되어 있습니다, planId:', planId);
        await actuallyAddEmotion(planId, type);
      } else {
        console.log('장소 등록이 필요합니다');
        // 콜백 방식으로 변경하여 실행 순서 보장
        await registerPlaceIfNeeded(async (newPlanId) => {
          console.log('장소 등록 후 감정 등록 시작, planId:', newPlanId);
          await actuallyAddEmotion(newPlanId, type);
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("selectedPlace:", selectedPlace);
    // 장소가 변경되면 등록 여부와 planId를 초기화
    if (selectedPlace) {
      setIsPlaceRegistered(false);
      setPlanId(null);
      setEmotions({ best: 0, good: 0, soso: 0, bad: 0 });
      setComments([]);
      setPlaceInfo(null);
    }
  }, [selectedPlace?.name, selectedPlace?.address]); // 장소 이름이나 주소가 변경될 때만 실행


  // useEffect(() => {
  //   console.log('planId:', planId);
  //   if (planId) {
  //     (async () => {
  //       try {
  //         const res = await api.get(`/v1/places/${planId}`);
  //         const data = res.data as { 
  //           commentsCnt?: number; 
  //           best?: number; 
  //           good?: number; 
  //           soso?: number; 
  //           bad?: number;
  //           imgUrls?: string[];
  //         };
  //         setPlaceInfo({
  //           commentsCnt: data.commentsCnt ?? 0,
  //           best: data.best ?? 0,
  //           good: data.good ?? 0,
  //           soso: data.soso ?? 0,
  //           bad: data.bad ?? 0,
  //           imgUrls: data.imgUrls ?? [],
  //         });
  //         console.log('장소 상세 정보:', data);
  //       } catch (e) {
  //         setPlaceInfo(null);
  //       }
  //     })();
  //   }
  // }, [planId]);

  const needsRegister = () => {
    // placeInfo가 없거나 planId가 없는 경우에만 등록 필요
    return !placeInfo || !planId;
  };

  // 이미지 URL 조각을 합치는 함수
  const getCombinedImageUrl = () => {
    if (placeInfo?.imgUrls && placeInfo.imgUrls.length > 0) {
      console.log("placeInfo.imgUrls:", placeInfo.imgUrls.join(''));

      return placeInfo.imgUrls.join('');
    }
    return null;
  };

  return (
    <SidebarWrapper open={open}>
      <ContentContainer>
        <SearchComponent
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          placeName={placeName}
          setPlaceName={setPlaceName}
        />
        {(selectedPlace) ? (
          <PlaceInfo>
            {isLoading || loading ? (
              <LoadingContainer>
                <div className="loading-spinner"></div>
                <div>장소 정보를 불러오는 중...</div>
              </LoadingContainer>
            ) : (
              <>
                <PlaceHeader>
                  <div>
                    <PlaceName>{selectedPlace.name}</PlaceName>
                    <PlaceAddress>{selectedPlace.address}</PlaceAddress>
                  </div>
                  <AddPlaceButton onClick={onAddPlace}>
                    <AddIcon sx={{ fontSize: 26, color: '#9A9A9A' }} />
                  </AddPlaceButton>
                </PlaceHeader>
                {selectedPlace?.photos && selectedPlace.photos[0] ? (
                  <PlaceImage
                    src={selectedPlace.photos[0].getUrl()}
                    alt={selectedPlace.name}
                  />
                ) : selectedPlace.imgUrls && selectedPlace.imgUrls.length > 0 ? (
                  <PlaceImage
                    src={selectedPlace.imgUrls.join('') || ''}
                    alt={selectedPlace.name || '장소 이미지'}
                  />
                ) : null}
                <EmotionContainer>
                  <EmotionButton disabled={loading} onClick={() => handleEmotion('best')}>
                    <img src="/icons/emotion/best.svg" alt="최고예요" />
                    <span className="emotion-text">최고예요</span>
                    <span className="emotion-count">{emotions.best}</span>
                  </EmotionButton>
                  <EmotionButton disabled={loading} onClick={() => handleEmotion('good')}>
                    <img src="/icons/emotion/good.svg" alt="좋아요" />
                    <span className="emotion-text">좋아요</span>
                    <span className="emotion-count">{emotions.good}</span>
                  </EmotionButton>
                  <EmotionButton disabled={loading} onClick={() => handleEmotion('soso')}>
                    <img src="/icons/emotion/soso.svg" alt="그저 그래요" />
                    <span className="emotion-text">그저 그래요</span>
                    <span className="emotion-count">{emotions.soso}</span>
                  </EmotionButton>
                  <EmotionButton disabled={loading} onClick={() => handleEmotion('bad')}>
                    <img src="/icons/emotion/bad.svg" alt="별로예요" />
                    <span className="emotion-text">별로예요</span>
                    <span className="emotion-count">{emotions.bad}</span>
                  </EmotionButton>
                </EmotionContainer>
                <Divider />
                {/* 댓글 리스트 */}
                <CommentSection comments={comments} />
              </>
            )}
          </PlaceInfo>
        ) : (
          <GuideBox>
            <img src="/icons/search-img.svg" width={80} height={80} />
            <GuideText>장소를 검색하거나,<br />지도에서 선택해보세요!</GuideText>
          </GuideBox>
        )}
      </ContentContainer>
      {/* 댓글 입력 */}
      {(selectedPlace && !isLoading) ? (
        <CommentInput>
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            disabled={loading}
          />
          <button onClick={handleAddComment} disabled={loading}>등록</button>
        </CommentInput>
      ) : null}
    </SidebarWrapper>
  );
};

const SidebarWrapper = styled(Box) <{ open: boolean }>`  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => (props.open ? '320px' : '0')};
  height: 100%;
  background-color: #fff;
  border-right: ${(props) => (props.open ? '1px solid #ddd' : 'none')};
  transition: width 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 10;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const GuideBox = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 180px;
  gap: 16px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #DDDDDD;
`;

const GuideText = styled('div')`
  font-size: 14px;
  color: #9A9A9A;
  text-align: center;
  line-height: 150%;
`;

const PlaceHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
`;

const PlaceInfo = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PlaceImage = styled('img')`
  width: 100%;
  height: 180px;
  object-fit: cover;
`;

const PlaceName = styled(Typography)`
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  text-align: left;
`;

const PlaceAddress = styled(Typography)`
  font-size: 12px;
  color: #9A9A9A;
  text-align: left;
`;

const AddPlaceButton = styled(Box)`
  background-color: #EEEEEE;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #E0E0E0;
  }
`;

const EmotionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 25px;
`;

const EmotionButton = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  .emotion-text {
    font-size: 10px;
    color: #000000;
  }
  .emotion-count {
    font-size: 10px;
    color: #666666;
  }
`;

const CommentInput = styled.div`
  box-shadow: 0px -4px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #EEEEEE;
  background-color: #fff;

  input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #EEEEEE;
    border-radius: 4px;
    font-size: 12px;
    &::placeholder {
      color: #9A9A9A;
    }
  }
  button {
    padding: 8px 10px;
    border: none;
    border-radius: 4px;
    background-color: #D2E0FB;
    color: #ffffff;
    font-size: 12px;
    cursor: pointer;
    &:hover {
      background-color: #90a4c8;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  gap: 16px;
  color: #9A9A9A;
  font-size: 14px;
  
  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #90a4c8;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default Sidebar;
