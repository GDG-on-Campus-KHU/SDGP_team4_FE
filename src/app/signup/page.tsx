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
    InputAdornment,
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
    '경기도 수원시', '경기도 고양시', '경기도 용인시', '경기도 성남시', '경기도 부천시', 
    '경기도 안산시', '경기도 화성시', '경기도 남양주시', '경기도 안양시', '경기도 평택시', 
    '경기도 시흥시', '경기도 파주시', '경기도 의정부시', '경기도 김포시', '경기도 광주시', 
    '경기도 광명시', '경기도 군포시', '경기도 하남시', '경기도 오산시', '경기도 양주시', 
    '경기도 이천시', '경기도 구리시', '경기도 안성시', '경기도 포천시', '경기도 의왕시', 
    '경기도 여주시', '경기도 동두천시',

    // 강원도
    '강원도 춘천시', '강원도 원주시', '강원도 강릉시', '강원도 동해시', 
    '강원도 태백시', '강원도 속초시', '강원도 삼척시',

    // 충청북도
    '충청북도 청주시', '충청북도 충주시', '충청북도 제천시',

    // 충청남도
    '충청남도 천안시', '충청남도 공주시', '충청남도 보령시', '충청남도 아산시', 
    '충청남도 서산시', '충청남도 논산시', '충청남도 계룡시', '충청남도 당진시',

    // 전라북도
    '전라북도 전주시', '전라북도 군산시', '전라북도 익산시', '전라북도 정읍시', 
    '전라북도 남원시', '전라북도 김제시',

    // 전라남도
    '전라남도 목포시', '전라남도 여수시', '전라남도 순천시', '전라남도 나주시', 
    '전라남도 광양시',

    // 경상북도
    '경상북도 포항시', '경상북도 경주시', '경상북도 김천시', '경상북도 안동시', 
    '경상북도 구미시', '경상북도 영주시', '경상북도 영천시', '경상북도 상주시', 
    '경상북도 문경시', '경상북도 경산시',

    // 경상남도
    '경상남도 창원시', '경상남도 진주시', '경상남도 통영시', '경상남도 사천시', 
    '경상남도 김해시', '경상남도 밀양시', '경상남도 거제시', '경상남도 양산시',

    // 제주특별자치도
    '제주특별자치도 제주시', '제주특별자치도 서귀포시'
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
    const [fieldErrors, setFieldErrors] = useState({
        username: '',
        password: '',
        passwordConfirm: '',
        region: ''
    });

    // 닉네임 중복 확인
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [isCheckingNickname, setIsCheckingNickname] = useState(false);
    const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
    const [nicknameMessage, setNicknameMessage] = useState<string>('');

    // 비밀번호 유효성 검사 함수
    const isPasswordValid = (password: string) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/;
        return passwordRegex.test(password);
    };

    // 닉네임 유효성 검사 함수
    const isUsernameValid = (username: string) => {
        return username.length >= 2 && username.length <= 20;
    };

    // TextField onChange 핸들러 수정
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 각 필드별 유효성 검사
        switch (name) {
            case 'username':
                setIsNicknameChecked(false);
                if (!value) {
                    setFieldErrors(prev => ({ ...prev, username: '닉네임을 입력해주세요.' }));
                } else if (!isUsernameValid(value)) {
                    setFieldErrors(prev => ({ ...prev, username: '닉네임은 2~20자로 입력해주세요.' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, username: '' }));
                }
                break;
            case 'password':
                if (!value) {
                    setFieldErrors(prev => ({ ...prev, password: '비밀번호를 입력해주세요.' }));
                } else if (!isPasswordValid(value)) {
                    setFieldErrors(prev => ({ 
                        ...prev, 
                        password: '영문, 숫자, 특수문자를 포함한 8~32자로 입력해주세요.' 
                    }));
                } else {
                    setFieldErrors(prev => ({ ...prev, password: '' }));
                }
                // 비밀번호 확인 필드도 체크
                if (formData.passwordConfirm && value !== formData.passwordConfirm) {
                    setFieldErrors(prev => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다.' }));
                } else if (formData.passwordConfirm) {
                    setFieldErrors(prev => ({ ...prev, passwordConfirm: '' }));
                }
                break;
            case 'passwordConfirm':
                if (!value) {
                    setFieldErrors(prev => ({ ...prev, passwordConfirm: '비밀번호 확인을 입력해주세요.' }));
                } else if (value !== formData.password) {
                    setFieldErrors(prev => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다.' }));
                } else {
                    setFieldErrors(prev => ({ ...prev, passwordConfirm: '' }));
                }
                break;
        }
    };

    // Select onChange 핸들러 수정
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as string]: value
        }));
        
        if (!value) {
            setFieldErrors(prev => ({ ...prev, region: '지역을 선택해주세요.' }));
        } else {
            setFieldErrors(prev => ({ ...prev, region: '' }));
        }
    };

    // 닉네임 중복 확인
    const handleCheckNickname = async () => {
        if (!formData.username) {
            setNicknameMessage('닉네임을 입력해주세요.');
            setIsNicknameAvailable(false);
            return;
        }

        setIsCheckingNickname(true);
        try {
            const response = await fetch(`/api/proxy/v1/auth/nickname?nickname=${encodeURIComponent(formData.username)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const responseData = await response.json();
            
            // code가 8002인 경우 이미 존재하는 닉네임
            if (responseData.code === 8002) {
                setNicknameMessage('이미 사용 중인 닉네임입니다.');
                setIsNicknameAvailable(false);
                setIsNicknameChecked(false);
                return;
            }

            // 그 외의 경우 사용 가능한 닉네임으로 처리
            setIsNicknameChecked(true);
            setNicknameMessage('사용 가능한 닉네임입니다.');
            setIsNicknameAvailable(true);
        } catch (err) {
            console.error('Error during nickname check:', err);
            setNicknameMessage('중복 확인에 실패했습니다.');
            setIsNicknameAvailable(false);
            setIsNicknameChecked(false);
        } finally {
            setIsCheckingNickname(false);
        }
    };

    // 회원가입 요청 함수
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 모든 필드 유효성 검사
        if (!formData.username) {
            setFieldErrors(prev => ({ ...prev, username: '닉네임을 입력해주세요.' }));
            return;
        }
        if (!isNicknameChecked) {
            setFieldErrors(prev => ({ ...prev, username: '닉네임 중복 확인을 해주세요.' }));
            return;
        }
        if (!formData.password) {
            setFieldErrors(prev => ({ ...prev, password: '비밀번호를 입력해주세요.' }));
            return;
        }
        if (!formData.passwordConfirm) {
            setFieldErrors(prev => ({ ...prev, passwordConfirm: '비밀번호 확인을 입력해주세요.' }));
            return;
        }
        if (!formData.region) {
            setFieldErrors(prev => ({ ...prev, region: '지역을 선택해주세요.' }));
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
            const errorMessage = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
            // 에러 메시지를 각 필드에 맞게 설정
            if (errorMessage.includes('닉네임')) {
                setFieldErrors(prev => ({ ...prev, username: errorMessage }));
            } else if (errorMessage.includes('비밀번호')) {
                setFieldErrors(prev => ({ ...prev, password: errorMessage }));
            } else {
                // 일반적인 에러는 username 필드 아래에 표시
                setFieldErrors(prev => ({ ...prev, username: errorMessage }));
            }
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
                        sx={{ width: "350px" }}
                        size="small"
                        placeholder="아이디를 입력하세요."
                        error={!!fieldErrors.username}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <CheckButton
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleCheckNickname}
                                        disabled={isCheckingNickname || !formData.username || !!fieldErrors.username}
                                        size="small"
                                    >
                                        {isCheckingNickname ? '확인 중' : '중복확인'}
                                    </CheckButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    {fieldErrors.username && <FieldErrorMessage>{fieldErrors.username}</FieldErrorMessage>}
                    {nicknameMessage && (
                        <NicknameMessage isAvailable={isNicknameAvailable}>
                            {nicknameMessage}
                        </NicknameMessage>
                    )}
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
                        error={!!fieldErrors.password}
                    />
                    {fieldErrors.password && <FieldErrorMessage>{fieldErrors.password}</FieldErrorMessage>}
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
                        error={!!fieldErrors.passwordConfirm}
                    />
                    {fieldErrors.passwordConfirm && <FieldErrorMessage>{fieldErrors.passwordConfirm}</FieldErrorMessage>}
                </div>
                <div>
                    <Typography fontSize={12} mb={0.5}>사는 지역</Typography>
                    <Select
                        name="region"
                        value={formData.region}
                        onChange={handleSelectChange}
                        displayEmpty
                        size="small"
                        error={!!fieldErrors.region}
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
                    {fieldErrors.region && <FieldErrorMessage>{fieldErrors.region}</FieldErrorMessage>}
                </div>

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
// 에러 메시지 스타일 컴포넌트 수정
const FieldErrorMessage = styled.div`
    color: #ff3333;
    font-size: 12px;
    margin-top: 4px;
`;

const CheckButton = styled(Button)`
    height: 28px;
    font-size: 12px;
    white-space: nowrap;
    padding: 0 10px;
    margin-right: -8px;
    min-width: auto;
    box-shadow: none;
    &:hover {
        box-shadow: none;
    }
`;

// 닉네임 메시지 스타일 컴포넌트 추가
const NicknameMessage = styled.p<{ isAvailable: boolean }>`
    margin: 6px 0 0 0;
    font-size: 12px;
    color: ${props => props.isAvailable ? '#4CAF50' : '#ff3333'};
`;