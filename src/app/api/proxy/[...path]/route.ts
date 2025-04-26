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

        let body;
        try {
            body = req.method === 'GET' ? null : await req.json();
        } catch {
            body = null;  // body가 없는 경우 null로 설정
        }
        
        // 기본 헤더 설정
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // auth로 시작하지 않는 경로에 대해서만 Authorization 헤더 추가
        if (!path.startsWith('v1/auth') && authHeader) {
            headers['Authorization'] = authHeader;
        }

        const response = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: body ? JSON.stringify(body) : undefined,  // body가 null이면 undefined
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