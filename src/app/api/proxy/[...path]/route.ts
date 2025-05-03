import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
    return handleRequest(req);
}

export async function POST(req: NextRequest) {
    return handleRequest(req);
}

export async function PUT(req: NextRequest) {
    return handleRequest(req);
}

export async function DELETE(req: NextRequest) {
    return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
    try {
        const path = req.url.split('/api/proxy/')[1];
        const targetUrl = `${API_BASE_URL}/api/${path}`;

        // 요청 헤더에서 Authorization 토큰 가져오기
        const authHeader = req.headers.get('Authorization');

        // 요청이 multipart/form-data인지 확인 (이미지 업로드 등)
        const isFormDataRequest = path.includes('image') || path.includes('bucket');
        
        let body;
        if (isFormDataRequest) {
            // FormData 요청인 경우 원본 요청 그대로 전달
            body = await req.arrayBuffer();
        } else {
            // JSON 요청인 경우 기존 처리 방식 유지
            try {
                body = req.method === 'GET' ? null : await req.json();
            } catch {
                body = null;  // body가 없는 경우 null로 설정
            }
        }
        
        // 기본 헤더 설정
        const headers: HeadersInit = {};

        // 이미지 업로드가 아닌 경우에만 Content-Type: application/json 설정
        if (!isFormDataRequest) {
            headers['Content-Type'] = 'application/json';
        } else {
            // 원본 Content-Type 헤더 전달
            const contentType = req.headers.get('Content-Type');
            if (contentType) {
                headers['Content-Type'] = contentType;
            }
        }

        // auth로 시작하지 않는 경로에 대해서만 Authorization 헤더 추가
        if (!path.startsWith('v1/auth') && authHeader) {
            headers['Authorization'] = authHeader;
        }

        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: isFormDataRequest 
                ? body 
                : (body ? JSON.stringify(body) : undefined),  // FormData가 아닌 경우만 JSON 변환
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}