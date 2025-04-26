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

        const body = req.method === 'GET' ? null : await req.json();
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
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