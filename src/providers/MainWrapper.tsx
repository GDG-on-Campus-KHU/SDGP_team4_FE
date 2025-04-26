'use client';
import styled from '@emotion/styled';

const Main = styled.main`
  padding-top: 70px;
  min-height: calc(100dvh - 70px);
`;

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  return <Main>{children}</Main>;
}