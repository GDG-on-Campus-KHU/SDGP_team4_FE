'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';

const HeaderWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  height: 70px;
  padding-right: 100px;
  padding-left: 68px;

  @media (max-width: 600px) {
    padding-left: 10px;
    padding-right: 20px;
  }
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 20px;
  color: #90a4c8;
`;

const NavMenu = styled.nav`
  display: flex;
  align-items: center;
  gap: 50px;
`;

interface StyledLinkProps {
  active: boolean;
}

const NavLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== 'active'
})<StyledLinkProps>`
  font-size: 14px;
  color: ${props => props.active ? '#90a4c8' : '#9A9A9A'};
  text-decoration: none;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  &:hover {
    color: #90a4c8;
  }
`;

// 스타일이 같은 커스텀 버튼 링크 컴포넌트 추가
const NavButton = styled.button<StyledLinkProps>`
  font-size: 14px;
  color: ${props => props.active ? '#90a4c8' : '#9A9A9A'};
  text-decoration: none;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  &:hover {
    color: #90a4c8;
  }
`;

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      // 로그아웃 처리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('nickname');
      localStorage.removeItem('region');
      setIsLoggedIn(false);
      window.location.href = '/';  // 홈으로 이동
    } else {
      // 로그인 페이지로 이동
      window.location.href = '/signin';
    }
  };

  // 보호된 경로를 처리하는 함수
  const handleProtectedRoute = (e: React.MouseEvent, path: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/signin');
    } else {
      router.push(path);
    }
  };

  return (
    <HeaderWrapper>
      <NavLink href="/" active={pathname === '/'}>
        <LogoSection>
          <WhereToVoteIcon fontSize='large'/>
          MAPORY
        </LogoSection>
      </NavLink>
      <NavMenu>
        <NavButton 
          active={pathname === '/map'} 
          onClick={(e) => handleProtectedRoute(e, '/map')}
        >
          지도
        </NavButton>
        <NavButton 
          active={pathname.startsWith('/travel')} 
          onClick={(e) => handleProtectedRoute(e, '/travel')}
        >
          여행일지
        </NavButton>
        <NavButton 
          active={pathname.startsWith('/my')} 
          onClick={(e) => handleProtectedRoute(e, '/my')}
        >
          MY
        </NavButton>
        <Button
          onClick={handleAuthClick}
          variant={isLoggedIn ? "outlined" : "contained"}
          color="primary" 
          sx={{
            whiteSpace: "nowrap", 
            width: "90px",
            height: "32px",
            borderRadius: '20px', 
          }}
        >
          {isLoggedIn ? '로그아웃' : '로그인'}
        </Button>
      </NavMenu>
    </HeaderWrapper>
  );
}