import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    Select,
    MenuItem,
    SelectChangeEvent,
    InputAdornment,
} from '@mui/material';
import styled from '@emotion/styled';

interface EditProfileModalProps {
    open: boolean;
    onClose: () => void;
    currentNickname: string;
    currentRegion: string;
    onSave: (nickname: string, region: string) => void;
}

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

export default function EditProfileModal({
    open,
    onClose,
    currentNickname,
    currentRegion,
    onSave,
}: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        username: currentNickname,
        region: currentRegion,
    });
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [isCheckingNickname, setIsCheckingNickname] = useState(false);
    const [isNicknameChecked, setIsNicknameChecked] = useState(true);
    const [nicknameMessage, setNicknameMessage] = useState('');
    const [isNicknameAvailable, setIsNicknameAvailable] = useState(true);
    const [isNicknameChanged, setIsNicknameChanged] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData({
                username: currentNickname,
                region: currentRegion,
            });
            setIsNicknameChecked(true);
            setIsNicknameAvailable(true);
            setIsNicknameChanged(false);
            setNicknameMessage('');
            setFieldErrors({});
        }
    }, [open, currentNickname, currentRegion]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'username') {
            const isChanged = value !== currentNickname;
            setIsNicknameChanged(isChanged);
            
            if (isChanged) {
                setIsNicknameChecked(false);
                setNicknameMessage('');
                setIsNicknameAvailable(false);
            } else {
                setIsNicknameChecked(true);
                setNicknameMessage('');
                setIsNicknameAvailable(true);
            }
            
            if (value.length < 2 || value.length > 10) {
                setFieldErrors(prev => ({
                    ...prev,
                    username: '닉네임은 2~10자 사이여야 합니다.'
                }));
            } else {
                setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.username;
                    return newErrors;
                });
            }
        }
    };

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
            
            if (responseData.code === 8002) {
                setNicknameMessage('이미 사용 중인 닉네임입니다.');
                setIsNicknameAvailable(false);
                setIsNicknameChecked(false);
                return;
            }

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

    const handleSave = async () => {
        if (isNicknameChanged && (!isNicknameChecked || !isNicknameAvailable)) {
            setFieldErrors(prev => ({
                ...prev,
                username: '닉네임 중복 확인이 필요합니다.'
            }));
            return;
        }

        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch('/api/proxy/v1/member', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    nickname: formData.username,
                    region: formData.region,
                }),
            });

            if (!response.ok) {
                throw new Error('회원정보 수정에 실패했습니다.');
            }

            onSave(formData.username, formData.region);
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            setFieldErrors(prev => ({
                ...prev,
                general: '회원정보 수정에 실패했습니다.'
            }));
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="edit-profile-modal"
        >
            <ModalContainer>
                <Typography variant="h6" component="h2" mb={3}>
                    회원정보 수정
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Typography fontSize={12} mb={0.5}>아이디(닉네임)</Typography>
                    <TextField
                        name="username"
                        value={formData.username}
                        onChange={handleTextChange}
                        sx={{ 
                            width: "350px",
                            '& .MuiFormHelperText-root': {
                                marginLeft: '3px',  // 왼쪽 여백 조정
                                marginRight: 0,
                                color: isNicknameAvailable && nicknameMessage ? '#2e7d32' : '#d32f2f'  // 성공 시 초록색, 실패 시 빨간색
                            }
                        }}
                        size="small"
                        placeholder="아이디를 입력하세요."
                        error={!!fieldErrors.username}
                        helperText={fieldErrors.username || nicknameMessage}
                        InputProps={{
                            endAdornment: isNicknameChanged ? (
                                <InputAdornment position="end">
                                    <CheckButton
                                        variant="contained"
                                        onClick={handleCheckNickname}
                                        disabled={isCheckingNickname || !formData.username || !!fieldErrors.username}
                                        size="small"
                                    >
                                        {isCheckingNickname ? '확인 중' : '중복확인'}
                                    </CheckButton>
                                </InputAdornment>
                            ) : null
                        }}
                    />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Typography fontSize={12} mb={0.5}>사는 지역</Typography>
                    <Select
                        name="region"
                        value={formData.region}
                        onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                        displayEmpty
                        size="small"
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
                </FormControl>
                {fieldErrors.general && (
                    <Typography color="error" fontSize={12} mb={2}>
                        {fieldErrors.general}
                    </Typography>
                )}
                <ButtonContainer>
                    <CancelButton onClick={onClose}>
                        취소
                    </CancelButton>
                    <SaveButton 
                        onClick={handleSave}
                        disabled={
                            (isNicknameChanged && (!isNicknameChecked || !isNicknameAvailable)) || 
                            !formData.region ||
                            !!fieldErrors.username
                        }
                    >
                        저장
                    </SaveButton>
                </ButtonContainer>
            </ModalContainer>
        </Modal>
    );
}

const ModalContainer = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background-color: white;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ButtonContainer = styled(Box)`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const CancelButton = styled(Button)`
  color: #666;
  border: 1px solid #D9D9D9;
  &:hover {
    background-color: #f5f5f5;
    border-color: #D9D9D9;
  }
`;

const SaveButton = styled(Button)`
  background-color: #8EACCD;
  color: white;
  &:hover {
    background-color: #7d99b9;
  }
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

const NicknameMessage = styled(Typography)<{ isAvailable: boolean }>`
    color: ${props => props.isAvailable ? '#4CAF50' : '#f44336'};
    font-size: 12px;
    margin-top: 4px;
`;