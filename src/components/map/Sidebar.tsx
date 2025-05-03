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
  } | null;
  onAddPlace: () => void;
}

const Sidebar = ({
  open,
  onLoad,
  onPlaceChanged,
  placeName,
  setPlaceName,
  selectedPlace,
  onAddPlace,
}: SidebarProps) => {
  // 상태 추가
  const [isPlaceRegistered, setIsPlaceRegistered] = useState(false);
  const [planId, setPlanId] = useState<number | null>(null);
  const [emotions, setEmotions] = useState({ best: 0, good: 0, soso: 0, bad: 0 });
  const [comments, setComments] = useState<{ nickname: string; date: string; text: string }[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeInfo, setPlaceInfo] = useState<{ commentsCnt: number; best: number; good: number; soso: number; bad: number } | null>(null);

  // 장소 등록 및 planId 반환
  const registerPlaceIfNeeded = async (afterRegister?: (newPlanId: number) => Promise<void>) => {
    if (isPlaceRegistered && planId) return planId;
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
      const res = await api.post('/places', {
        name: selectedPlace?.name,
        address: selectedPlace?.address,
        latitude,
        longitude,
      });
      if (res.status === 200) {
        const data = res.data as { planId: number, commentsCnt: number };
        setIsPlaceRegistered(true);
        setPlanId(data.planId);
        if (afterRegister) {
          await afterRegister(data.planId);
        }
        return data.planId;
      } else {
        alert('장소 등록에 실패했습니다.');
        return null;
      }
    } catch (e) {
      alert('장소 등록 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const actuallyAddComment = async (id: number) => {
    const memberId = localStorage.getItem('nickname') || '';
    const region = localStorage.getItem('region') || '';
    const address = selectedPlace?.address || '';
    const isLocal = region && address.includes(region);
    const res = await api.post('/comments', {
      placeId: id,
      memberId,
      isLocal,
      comment: commentInput,
    });
    console.log('댓글 등록 응답:', res);
    setComments(prev => [...prev, { nickname: memberId, date: new Date().toISOString(), text: commentInput }]);
    setCommentInput('');
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    let id = planId;
    let needRegister = !isPlaceRegistered || !planId || needsRegister();
    if (needRegister) {
      await registerPlaceIfNeeded(async (newPlanId) => {
        await actuallyAddComment(newPlanId);
      });
      return;
    }
    await actuallyAddComment(id!);
  };

  const actuallyAddEmotion = async (id: number, type: 'best' | 'good' | 'soso' | 'bad') => {
    const memberId = localStorage.getItem('nickname') || '';
    const feedbackType = type.toUpperCase(); // BEST, GOOD, SOSO, BAD
    const res = await api.post(`/places/${id}/feedbacks?memberId=${memberId}&feedbackType=${feedbackType}`);
    console.log('감정 등록 응답:', res);
    setEmotions(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleEmotion = async (type: 'best' | 'good' | 'soso' | 'bad') => {
    let id = planId;
    console.log('planId:', planId);
    let needRegister = !isPlaceRegistered || !planId || needsRegister();
    if (needRegister) {
      await registerPlaceIfNeeded(async (newPlanId) => {
        await actuallyAddEmotion(newPlanId, type);
      });
      return;
    }
    await actuallyAddEmotion(id!, type);
  };

  useEffect(() => {
    console.log("selectedPlace:", selectedPlace);
  }, [selectedPlace]);
          

  useEffect(() => {
    console.log('planId:', planId);
    if (planId) {
      (async () => {
        try {
          const res = await api.get(`/places/${planId}`);
          const data = res.data as { commentsCnt?: number; best?: number; good?: number; soso?: number; bad?: number };
          setPlaceInfo({
            commentsCnt: data.commentsCnt ?? 0,
            best: data.best ?? 0,
            good: data.good ?? 0,
            soso: data.soso ?? 0,
            bad: data.bad ?? 0,
          });
          console.log('장소 상세 정보:', data);
        } catch (e) {
          setPlaceInfo(null);
        }
      })();
    }
  }, [planId]);

  const needsRegister = () => {
    if (!placeInfo) return true;
    const { commentsCnt, best, good, soso, bad } = placeInfo;
    return commentsCnt === 0 && best === 0 && good === 0 && soso === 0 && bad === 0;
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
            <PlaceHeader>
              <div>
                <PlaceName>{selectedPlace.name}</PlaceName>
                <PlaceAddress>{selectedPlace.address}</PlaceAddress>
              </div>
              <AddPlaceButton onClick={onAddPlace}>
                <AddIcon sx={{ fontSize: 26, color: '#9A9A9A' }} />
              </AddPlaceButton>
            </PlaceHeader>
            {selectedPlace.photos && selectedPlace.photos[0] && (
              <PlaceImage
                src={selectedPlace.photos[0].getUrl()}
                alt={selectedPlace.name}
              />
            )}
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
          </PlaceInfo>
        ) : (
          <GuideBox>
            <img src="/icons/search-img.svg" width={80} height={80} />
            <GuideText>장소를 검색하거나,<br />지도에서 선택해보세요!</GuideText>
          </GuideBox>
        )}
      </ContentContainer>
      {/* 댓글 입력 */}
      {(selectedPlace) ? (
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

const SidebarWrapper = styled(Box) <{ open: boolean }>`
  position: absolute;
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

export default Sidebar;