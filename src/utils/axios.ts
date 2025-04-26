import axios from 'axios';

// 로그아웃 처리 함수
export const handleLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('nickname');
  localStorage.removeItem('region');
  window.location.href = '/signin';
};

// axios 인스턴스 생성
const api = axios.create({
  baseURL: '/api/proxy',
});

// 요청 보낼 때마다 자동으로 토큰 첨부
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 받을 때마다 토큰 만료 체크
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러(토큰 만료)시 자동 로그아웃
    if (error.response?.status === 401) {
      handleLogout();
    }
    return Promise.reject(error);
  }
);

export default api;