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
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // 첫 번째 질문 제외 4번의 질문 진행 -> 총 5단계(Step 0~4) 선택 완료 시 최종 결과(step >= 5)
    const isFinal = step >= 5;

    if (!isFinal) {
      const prompt = `
사용자가 음식 메뉴를 추천받기 위해 지금까지 선택한 취향 목록입니다:
${history.map((h: string, idx: number) => `- ${idx === 0 ? '기본 베이스' : `${idx}단계 취향`}: ${h}`).join('\n')}

[규칙]
1. 절대로 '제육덮밥', '칼국수', '삼겹살' 같은 구체적인 특정 음식 메뉴명을 선택지(optionA, optionB)로 제시하지 마세요.
2. 대신 사용자의 미각, 감각, 식사 스타일 취향을 묻는 밸런스 질문을 1개 만드세요. (단, 갈 수록 질문이 세심해져야합니다. 처음부터 너무 선택지를 확 좁히는 질문 X)
   - 예시: 
     - 맵기: "🔥 스트레스 풀리는 매콤함" vs "🤍 속 편안하고 담백한 맛"
     - 국물/식감: "🍲 깊고 진한 뜨끈한 국물" vs "🥢 꾸덕하고 쫄깃하게 비벼먹는 스타일"
     - 온도/무게감: "🧊 입맛 돋우는 시원하고 산뜻함" vs "♨️ 이열치열 든든하고 묵직한 포만감"
     - 기름기/느낌: "🧈 풍미 가득 기름진 고소함" vs "🥗 깔끔하고 개운한 뒷맛"
     - 식사 무드: "🏮 로컬 감성의 찐한 한 상" vs "✨ 정갈하고 세련된 플레이팅"
     (예시는 예시일뿐 그대로 사용하지 말아주세요.)
3. 앞서 나온 선택들과 중복되지 않는 새로운 축의 취향 질문을 던져주세요.
4. 앞서 나온 선택을 통해 유추할 수 있는 음식 취향 질문을 던져주세요. (가지치기 느낌)
   - 예시 :
     - 국물 취향을 골랐다면 국물 음식 취향에서 가지치기를 하여 취향 질문을 던져주세요.
     - 맵지 않은 것이 좋다는 취향을 골랐다면 맵지 않은 음식들과 관련된 취향 질문을 던져주세요.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "isFinal": false,
  "question": "센스 있는 취향 질문 문장",
  "optionA": "선택지 A (이모지 포함)",
  "optionB": "선택지 B (이모지 포함)"
}
`;
      const result = await model.generateContent(prompt);
      return NextResponse.json(JSON.parse(result.response.text()));
    } else {
      const prompt = `
사용자가 다음 5가지 취향 선택을 통해 음식을 골랐습니다:
${history.map((h: string, idx: number) => `- ${idx === 0 ? '기본 베이스' : `${idx}단계 취향`}: ${h}`).join('\n')}

위 5가지 취향 조건(베이스 + 4가지 세부 취향)을 모두 충족하는 가장 매력적이고 구체적인 음식 메뉴 이름 1개를 추천해주세요.
설명이나 수식어는 필요 없으며 메뉴명만 단답으로 지정하세요.

반드시 다음 JSON 형식으로만 응답하세요:
{
  "isFinal": true,
  "menuName": "구체적인 추천 메뉴명 (예: 들기름 막국수, 매콤 소고기 버섯전골, 크림 트러플 뇨끼)",
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
        question: '오늘 끌리는 맛의 온도는?',
        optionA: '🔥 화끈하고 자극적인 매운맛',
        optionB: '🍵 은은하고 부드러운 순한맛',
      },
      { status: 200 }
    );
  }
}