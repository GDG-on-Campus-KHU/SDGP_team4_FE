import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import ChatIcon from '@mui/icons-material/Chat';
import api from '@/utils/axios';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

interface CommentSectionProps {
  comments: { nickname: string; date: string; text: string; local: boolean }[];
  placeId: number | null;
}

type TabType = 'all' | 'traveler' | 'local';

interface SummaryData {
  summary: string;
}

const CommentSection = ({ comments, placeId }: CommentSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // 장소 ID가 변경되면 모달 닫기
  useEffect(() => {
    setShowSummaryModal(false);
    setSummaryData(null);
  }, [placeId]);

  // AI 요약 가져오기
  const fetchSummary = async () => {
    if (!placeId) return;

    setIsLoadingSummary(true);
    try {
      const res = await api.get(`/v1/comments/${placeId}/summary`);

      if (res.status === 200 && res.data) {
        // 타입 단언을 통해 res.data의 구조를 명시
        const data = res.data as { data: { summary?: string; localSummary?: string } };
        console.log(data);

        setSummaryData({
          summary: data.data.summary || '요약된 내용이 없습니다.',
        });
      }
    } catch (error) {
      console.error('후기 요약 로드 실패:', error);
      setSummaryData({
        summary: '요약을 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // AI 요약 모달 열기
  const handleOpenSummary = () => {
    setShowSummaryModal(true);
    fetchSummary();
  };

  // 현재 탭에 따라 댓글 필터링
  const filteredComments = comments.filter(comment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'traveler') return !comment.local;
    if (activeTab === 'local') return comment.local;
    return true;
  });

  return (
    <CommentContainer>
      <CommentHeader>
        <CommentCount>
          <ChatIcon fontSize="small" />
          {comments.length}
        </CommentCount>
        <TabContainer>
          <CommentTabs>
            <CommentTab
              active={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            >
              전체
            </CommentTab>
            <CommentTab
              active={activeTab === 'traveler'}
              onClick={() => setActiveTab('traveler')}
            >
              여행객
            </CommentTab>
            <CommentTab
              active={activeTab === 'local'}
              onClick={() => setActiveTab('local')}
            >
              현지인
            </CommentTab>
          </CommentTabs>
          <AiSummaryContainer
            onClick={comments.length > 0 ? handleOpenSummary : undefined}
            disabled={comments.length === 0}
          >
            <img src="/icons/robot.svg" alt="AI 후기요약" />
            <AiSummaryText>AI 후기요약</AiSummaryText>
          </AiSummaryContainer>
        </TabContainer>
      </CommentHeader>

      {/* AI 요약 모달 - 인라인으로 표시 */}
      {showSummaryModal && (
        <SummarySection>
          <SummaryHeader>
            <SummaryTitle>
              <img src="/icons/robot.svg" alt="AI" />
              AI가 전체적인 후기를 요약했어요!
            </SummaryTitle>
            <CloseButton onClick={() => setShowSummaryModal(false)}>
              <CloseIcon fontSize="small" />
            </CloseButton>
          </SummaryHeader>
          <SummaryContent>
            {isLoadingSummary ? (
              <LoadingText>요약 내용을 불러오는 중입니다...</LoadingText>
            ) : (
              summaryData ? summaryData.summary : '요약 정보가 없습니다.'
            )}
          </SummaryContent>
        </SummarySection>
      )}

      <CommentList>
        {filteredComments.length > 0 ? (
          filteredComments.map((comment, i) => (
            <CommentItem key={i}>
              <AuthorInfo>
                <div
                  style={{
                    width: 25,
                    height: 25,
                    borderRadius: '50%',
                    backgroundColor: '#D2E0FB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonIcon sx={{ fontSize: 20, color: 'white' }} />
                </div>
              </AuthorInfo>
              <CommentContent>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <CommentAuthor>{comment.nickname}</CommentAuthor>
                  {comment.local && <CommentDate>현지인</CommentDate>}
                </div>
                <CommentText>{comment.text}</CommentText>
              </CommentContent>
            </CommentItem>
          ))
        ) : (
          <EmptyCommentsMessage>
            {activeTab === 'traveler' ? '여행객 댓글이 없습니다.' :
              activeTab === 'local' ? '현지인 댓글이 없습니다.' :
                '댓글이 없습니다.'}
          </EmptyCommentsMessage>
        )}
      </CommentList>
    </CommentContainer>
  );
};

const CommentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow: hidden;
`;

const CommentHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CommentCount = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #000000;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AiSummaryContainer = styled.div<{ disabled: boolean }>`
  display: flex;
  gap: 4px;
  align-items: flex-end;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const AiSummaryText = styled.div`
  font-size: 10px;
  color: #9A9A9A;
  text-decoration: underline;
`;

const CommentTabs = styled.div`
  display: flex;
  gap: 4px;
`;

const CommentTab = styled.button<{ active: boolean }>`
  padding: 4px 8px;
  width: 44px;
  border-radius: 15px;
  border: none;
  background-color: ${props => props.active ? '#000000' : 'transparent'};
  color: ${props => props.active ? '#FFFFFF' : '#000000'};
  font-size: 10px;
  cursor: pointer;
  border: 1px solid #000000;
`;

const CommentList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #DDDDDD;
  padding-bottom: 10px;
`;

const CommentAvatar = styled.div`
  display: flex;
  width: 38px;
  height: 32px;
  border-radius: 50%;
  background-color: #EEEEEE;
`;

const CommentContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 4px;
`;

const CommentText = styled.p`
  font-size: 11px;
  color: #000000;
  margin: 0;
`;

const CommentAuthor = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: #000000;
`;

const CommentDate = styled.span`
  display: flex;
  align-items: center;
  text-align: center;
  font-size: 10px;
  color: #B4643A;
  background-color: #FFEAA9;
  padding: 3px 6px;
  border-radius: 10px;
  font-size: 8px;
`;

const EmptyCommentsMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #9A9A9A;
  font-size: 12px;
`;

// 인라인 요약 섹션 스타일
const SummarySection = styled.div`
  background: #F9F9F9;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #EEEEEE;
`;

const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const SummaryTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #90a4c8;
  font-weight: 600;
  img {
    width: 20px;
    height: 20px;
    margin-bottom: 4px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #9A9A9A;
  padding: 0;
`;

const SummaryContent = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #EEEEEE;
`;

const LoadingText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  color: #9A9A9A;
`;

const AuthorInfo = styled(Box)`
  display: flex;
  align-items: center;
`;

export default CommentSection;