import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { history, step } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY 없음' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const isFinal = step >= 3;

    if (!isFinal) {
      const prompt = `
사용자가 음식 메뉴를 정하기 위해 지금까지 다음을 선택했습니다:
${history.map((h: string, idx: number) => `- ${idx + 1}단계: ${h}`).join('\n')}

위 선택에 이어지는 다음 밸런스 게임 질문 1개와 두 가지 선택지(A, B)를 작성해주세요.
질문과 선택지는 직전 선택을 더 구체화하는 내용이어야 합니다.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "isFinal": false,
  "question": "다음 질문 내용",
  "optionA": "선택지 A (이모지 포함)",
  "optionB": "선택지 B (이모지 포함)"
}
`;
      const result = await model.generateContent(prompt);
      return NextResponse.json(JSON.parse(result.response.text()));
    } else {
      const prompt = `
사용자가 다음 취향 가지치기 경로를 거쳐 음식을 골랐습니다:
${history.map((h: string, idx: number) => `- ${idx + 1}단계: ${h}`).join('\n')}

위 경로에 딱 들어맞는 구체적인 음식 메뉴 이름 하나만 추천해주세요. 설명이나 팁은 일절 필요 없습니다.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "isFinal": true,
  "menuName": "구체적인 추천 메뉴명 (예: 차돌 마라탕, 전복 솥밥, 트러플 크림 파스타)",
  "category": "한식, 일식, 중식, 양식, 아시안 중 하나"
}
`;
      const result = await model.generateContent(prompt);
      return NextResponse.json(JSON.parse(result.response.text()));
    }
  } catch (error: any) {
    console.error('Gemini Route Error:', error);
    return NextResponse.json(
      {
        isFinal: false,
        question: '어떤 스타일의 분위기를 원하시나요?',
        optionA: '🏮 편안한 로컬 골목 맛집',
        optionB: '✨ 깔끔하고 세련된 감성 맛집',
      },
      { status: 200 }
    );
  }
}