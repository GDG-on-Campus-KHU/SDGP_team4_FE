import React from 'react';
import { Box, Typography } from '@mui/material';
import styled from '@emotion/styled';
import SearchComponent from './SearchComponent';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import CommentSection from './CommentSection';

interface SidebarProps {
    open: boolean;
    onLoad: (ref: google.maps.places.Autocomplete) => void;
    onPlaceChanged: () => void;
    placeName: string;
    setPlaceName: React.Dispatch<React.SetStateAction<string>>;
    selectedPlace: {
        name: string;
        address: string;
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
                            <EmotionButton>
                                <img src="/icons/emotion/best.svg" alt="최고예요" />
                                <span className="emotion-text">최고예요</span>
                                <span className="emotion-count">5</span>
                            </EmotionButton>
                            <EmotionButton>
                                <img src="/icons/emotion/good.svg" alt="좋아요" />
                                <span className="emotion-text">좋아요</span>
                                <span className="emotion-count">5</span>
                            </EmotionButton>
                            <EmotionButton>
                                <img src="/icons/emotion/soso.svg" alt="그저 그래요" />
                                <span className="emotion-text">그저 그래요</span>
                                <span className="emotion-count">5</span>
                            </EmotionButton>
                            <EmotionButton>
                                <img src="/icons/emotion/bad.svg" alt="별로예요" />
                                <span className="emotion-text">별로예요</span>
                                <span className="emotion-count">5</span>
                            </EmotionButton>
                        </EmotionContainer>
                        <Divider />
                        <CommentSection />
                    </PlaceInfo>
                ) : (
                    <GuideBox>
                        <img src="/icons/search-img.svg" width={80} height={80} />
                        <GuideText>장소를 검색하거나,<br />지도에서 선택해보세요!</GuideText>
                    </GuideBox>
                )}
            </ContentContainer>
            {(selectedPlace) ? (
                <CommentInput>
                    <input type="text" placeholder="댓글을 입력하세요" />
                    <button>등록</button>
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

const EmotionButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
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