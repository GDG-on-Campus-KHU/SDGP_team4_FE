import React, { useState } from 'react';
import styled from '@emotion/styled';
import ChatIcon from '@mui/icons-material/Chat';

interface CommentSectionProps {
    comments: { nickname: string; date: string; text: string; local: boolean }[];
    // 필요한 props 추가 가능
}

type TabType = 'all' | 'traveler' | 'local';

const CommentSection = ({ comments }: CommentSectionProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    
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
                    <AiSummaryContainer>
                        <img src="/icons/robot.svg" alt="AI 후기요약" />
                        <AiSummaryText>AI 후기요약</AiSummaryText>
                    </AiSummaryContainer>
                </TabContainer>
            </CommentHeader>
            <CommentList>
                {filteredComments.length > 0 ? (
                    filteredComments.map((comment, i) => (
                        <CommentItem key={i}>
                            <CommentAvatar />
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

const AiSummaryContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: flex-end;
  cursor: pointer;
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

export default CommentSection;