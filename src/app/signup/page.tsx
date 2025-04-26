'use client';

import { useState } from 'react';
import {
    Button,
    TextField,
    Typography,
    Box,
    Select,
    MenuItem,
    SelectChangeEvent,
} from '@mui/material';
import styled from '@emotion/styled';

// 시/도 목록
const koreanCities = [
    // 특별시, 광역시, 특별자치시
    '서울특별시',
    '부산광역시',
    '대구광역시',
    '인천광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',

    // 경기도
    '수원시', '고양시', '용인시', '성남시', '부천시', '안산시', '화성시', '남양주시', '안양시',
    '평택시', '시흥시', '파주시', '의정부시', '김포시', '광주시', '광명시', '군포시', '하남시',
    '오산시', '양주시', '이천시', '구리시', '안성시', '포천시', '의왕시', '여주시', '동두천시',

    // 강원도
    '춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시',

    // 충청북도
    '청주시', '충주시', '제천시',

    // 충청남도
    '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시',

    // 전라북도
    '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시',

    // 전라남도
    '목포시', '여수시', '순천시', '나주시', '광양시',

    // 경상북도
    '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시',

    // 경상남도
    '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시',

    // 제주특별자치도
    '제주시', '서귀포시'
];

interface SignUpForm {
    username: string;
    password: string;
    passwordConfirm: string;
    region: string;
}

interface SignUpResponse {
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

export default function SignUpPage() {
    // 폼 데이터 상태 관리
    const [formData, setFormData] = useState<SignUpForm>({
        username: '',
        password: '',
        passwordConfirm: '',
        region: ''
    });

    // 에러 메시지 상태
    const [error, setError] = useState<string>('');

    // TextField와 Select의 onChange 핸들러를 분리
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as string]: value
        }));
    };

    // 회원가입 요청 함수
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.password || !formData.passwordConfirm || !formData.region) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (formData.password !== formData.passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await fetch('/api/proxy/v1/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nickname: formData.username,
                    password: formData.password,
                    region: formData.region,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || '회원가입에 실패했습니다.');
            }

            const responseData: SignUpResponse = await response.json();

            // 로컬 스토리지에 데이터 저장
            localStorage.setItem('accessToken', responseData.data.jwtDto.accessToken);
            localStorage.setItem('refreshToken', responseData.data.jwtDto.refreshToken);
            localStorage.setItem('nickname', responseData.data.memberInfoDto.nickname);
            localStorage.setItem('region', responseData.data.memberInfoDto.region);

            // 로그인 페이지로 이동
            window.location.href = '/';
        } catch (err) {
            setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
        }
    };

    return (
        <Container>
            <Logo>회원가입</Logo>
            <Slogan>아래 정보를 입력하여 계정을 생성하세요!</Slogan>
            <StyledForm onSubmit={handleSignUp}>
                <div>
                    <Typography fontSize={12} mb={0.5}>아이디(닉네임)</Typography>
                    <TextField
                        name="username"
                        value={formData.username}
                        onChange={handleTextChange}
                        sx={{ width: '350px' }}
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
                        onChange={handleTextChange}
                        sx={{ width: '350px' }}
                        type="password"
                        size="small"
                        placeholder="비밀번호를 입력하세요."
                        fullWidth
                    />
                </div>
                <div>
                    <Typography fontSize={12} mb={0.5}>비밀번호 확인</Typography>
                    <TextField
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleTextChange}
                        sx={{ width: '350px' }}
                        type="password"
                        size="small"
                        placeholder="비밀번호를 한번 더 입력하세요."
                        fullWidth
                    />
                </div>
                <div>
                    <Typography fontSize={12} mb={0.5}>사는 지역</Typography>
                    <Select
                        name="region"
                        value={formData.region}
                        onChange={handleSelectChange}
                        displayEmpty
                        size="small"
                        fullWidth
                        sx={{
                            width: '350px',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    maxHeight: 200,
                                    mt: 1,           
                                },
                            },
                        }}
                    >
                        <MenuItem value="" disabled>
                            지역을 선택하세요.
                        </MenuItem>
                        {koreanCities.map((city) => (
                            <MenuItem key={city} value={city}>
                                {city}
                            </MenuItem>
                        ))}
                    </Select>
                </div>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <LoginButton 
                    type="submit"
                    fullWidth 
                    variant="contained" 
                    color="primary"
                >
                    회원가입
                </LoginButton>
            </StyledForm>
            <SignupLink>
                이미 계정이 있으신가요?
                <a href="/signin">로그인</a>
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
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 12px;
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