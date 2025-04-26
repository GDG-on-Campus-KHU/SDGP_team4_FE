'use client';
import { useState } from 'react';
import { Button, TextField, Typography, Box } from '@mui/material';
import styled from '@emotion/styled';
import WhereToVoteIcon from '@mui/icons-material/WhereToVote';

interface SignInForm {
    nickname: string;
    password: string;
}

interface SignInResponse {
    message: string;
    data: {
        memberInfoDto: {
            nickname: string;
            region: string;
        };
        jwtDto: {
            accessToken: string;
            refreshToken: string;
        };
    };
}

export default function SignInPage() {
    const [formData, setFormData] = useState<SignInForm>({
        nickname: '',
        password: '',
    });
    const [error, setError] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.nickname || !formData.password) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('/api/proxy/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nickname: formData.nickname,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '로그인에 실패했습니다.');
            }

            const responseData: SignInResponse = await response.json();

            // 로컬 스토리지에 데이터 저장
            localStorage.setItem('accessToken', responseData.data.jwtDto.accessToken);
            localStorage.setItem('refreshToken', responseData.data.jwtDto.refreshToken);
            localStorage.setItem('nickname', responseData.data.memberInfoDto.nickname);
            localStorage.setItem('region', responseData.data.memberInfoDto.region);

            // 메인 페이지로 이동
            window.location.href = '/';
        } catch (err) {
            setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
        }
    };

    return (
        <Container>
            <Logo>
                <WhereToVoteIcon fontSize='large' />
                MAPORY
            </Logo>
            <Slogan>사람들의 자취를 따라가는 여행 플랫폼</Slogan>
            <StyledForm onSubmit={handleSignIn}>
                <div>
                    <Typography fontSize={12} mb={0.5}>아이디(닉네임)</Typography>
                    <TextField
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        sx={{ width: "350px" }}
                        size="small"
                        placeholder="아이디를 입력하세요."
                        fullWidth
                    />
                </div>
                <div>
                    <Typography fontSize={12} mb={0.5}>비밀번호</Typography>
                    <TextField
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        sx={{ width: "350px" }}
                        type="password"
                        size="small"
                        placeholder="비밀번호를 입력하세요."
                        fullWidth
                    />
                </div>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <LoginButton 
                    type="submit"
                    fullWidth 
                    variant="contained" 
                    color='primary'
                >
                    로그인
                </LoginButton>
            </StyledForm>
            <SignupLink>
                아직 계정이 없으신가요?
                <a href="/signup">회원가입</a>
            </SignupLink>
        </Container>
    );
}

const Container = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100dvh - 70px);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  color: #90a4c8;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  svg {
    margin-right: 0px;
    font-size: 32px;
  }
`;

const Slogan = styled(Typography)`
  font-size: 13px;
  color: #666;
  margin-bottom: 40px;
`;

const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    width: 350px;
    gap: 14px;
`;

const LoginButton = styled(Button)`
  margin-top: 20px;
  border-radius: 6px;
  height: 40px;
  width: 350px;
  text-transform: none;
  font-weight: 500;
`;

const SignupLink = styled(Typography)`
  font-size: 13px;
  color: #666;
  margin-top: 20px;
  margin-bottom: 100px;
  text-align: center;
  a {
    color: #585858;
    text-decoration: underline;
    margin-left: 6px;

    &:hover {
      color: #222;
    }
  }
`;

const ErrorMessage = styled.div`
    color: #ff3333;
    font-size: 12px;
    margin-top: 4px;
    text-align: center;
`;
