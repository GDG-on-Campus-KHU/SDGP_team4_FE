'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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

const LogoSection = styled(Link)`
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 20px;
  color: #90a4c8;
  text-decoration: none;
  cursor: pointer;
`;

const NavMenu = styled.nav`
  display: flex;
  align-items: center;
  gap: 50px;
`;

const NavLink = styled(Link)<{ isActive: boolean }>`
  font-size: 14px;
  color: ${props => props.isActive ? '#90a4c8' : '#9A9A9A'};
  text-decoration: none;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  &:hover {
    color: #90a4c8;
  }
`;

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

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

  return (
    <HeaderWrapper>
      <LogoSection href="/">
        <WhereToVoteIcon fontSize='large'/>
        MAPORY
      </LogoSection>

      <NavMenu>
        <NavLink href="/map" isActive={pathname === '/map'}>지도</NavLink>
        <NavLink href="/diary" isActive={pathname === '/diary'}>여행일지</NavLink>
        <NavLink href="/my" isActive={pathname === '/my'}>MY</NavLink>
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