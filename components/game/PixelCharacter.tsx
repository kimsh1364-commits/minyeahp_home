"use client";

import { useEffect, useRef } from "react";
import { CharacterData } from "@/types/game";
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS, TOPS, BOTTOMS, SHOES } from "@/data/items";

interface Props {
  character: CharacterData;
  direction?: "up" | "down" | "left" | "right";
  frame?: number; // 0 or 1 (2-frame walking animation)
  scale?: number;
}

const TILE = 2; // base pixel unit (2px)

function getColor(list: { id: string; color?: string }[], id: string, fallback: string) {
  return list.find((i) => i.id === id)?.color ?? fallback;
}

/*
  NES/Famicom 스타일 16×32 픽셀 캐릭터
  그리드 단위: 8 wide × 16 tall (TILE=2 → 16×32px at scale 1)

  Layout (grid units, y=0 = 캐릭터 최상단):
    y= 0      : 헤어 탑
    y= 1~3    : 머리 (3 tall)
    y= 3~4    : 목
    y= 4~8    : 상의 (4 tall)
    y= 8~12   : 하의 (4 tall)
    y=12~14   : 다리 (2 tall)
    y=14~16   : 발/신발 (2 tall) ← 캐릭터 최하단

  Hat/hair space: y=-4 to y=0 (위에 여분)
  Canvas height = 4 (hat) + 16 (body) = 20 units
*/

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  character: CharacterData,
  direction: "up" | "down" | "left" | "right",
  frame: number, // 0 or 1
  scale: number,
  offsetX = 0,
  offsetY = 0
) {
  const skin = getColor(SKIN_TONES, character.skinTone, "#FDDBB4");
  const hair = getColor(HAIR_COLORS, character.hairColor, "#1a1a1a");
  const eye = getColor(EYE_COLORS, character.eyeColor, "#1a1a1a");
  const topColor = getColor(TOPS, character.top, "#FFFFFF");
  const bottomColor = getColor(BOTTOMS, character.bottom, "#2563EB");
  const shoeColor = getColor(SHOES, character.shoes, "#9CA3AF");

  const T = TILE * scale;
  const ox = offsetX;
  const oy = offsetY;

  // Helper: draw filled rect in grid units
  const rect = (gx: number, gy: number, gw: number, gh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + gx * T, oy + gy * T, gw * T, gh * T);
  };

  // Helper: draw pixel outline
  const strokeRect = (gx: number, gy: number, gw: number, gh: number, color: string, lw = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * scale;
    ctx.strokeRect(ox + gx * T + 0.5, oy + gy * T + 0.5, gw * T - 1, gh * T - 1);
  };

  // ── 2-frame walking animation: alternate left/right foot offset ──
  const leftFootOffX  = frame === 0 ? -0.3 : 0.3;
  const rightFootOffX = frame === 0 ? 0.3 : -0.3;

  // ── Draw layers bottom to top ──

  // 1. SHOES / FEET
  rect(1 + leftFootOffX,  14, 2.3, 1.5, shoeColor); // left shoe
  rect(4.7 + rightFootOffX, 14, 2.3, 1.5, shoeColor); // right shoe
  // shoe outline
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = scale * 0.6;
  ctx.strokeRect(ox + (1 + leftFootOffX) * T + 0.5,  oy + 14 * T + 0.5, 2.3 * T - 1, 1.5 * T - 1);
  ctx.strokeRect(ox + (4.7 + rightFootOffX) * T + 0.5, oy + 14 * T + 0.5, 2.3 * T - 1, 1.5 * T - 1);

  // 2. LEGS
  rect(1.5, 12, 1.8, 2, bottomColor); // left leg
  rect(4.7, 12, 1.8, 2, bottomColor); // right leg

  // 3. BOTTOM (하의)
  const bot = character.bottom;
  if (bot === "skirt") {
    rect(1, 8, 6, 2.5, bottomColor);   // upper skirt
    rect(0.5, 10.5, 7, 2, bottomColor); // flared lower
  } else if (bot === "long_skirt") {
    rect(0.5, 8, 7, 3, bottomColor);   // wide upper
    rect(0.5, 11, 7, 3.5, bottomColor);// long lower (covers legs)
    // skirt highlight
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(ox + 0.7 * T, oy + 8.3 * T, 1.5 * T, 5.5 * T);
  } else if (bot === "pumpkin_pants") {
    // 호박바지: 볼록한 호박 모양
    rect(0.8, 8, 6.4, 4, bottomColor);
    // 세로줄 (호박 주름)
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    rect(2.3, 8, 0.4, 4, "rgba(0,0,0,0.15)");
    rect(3.8, 8, 0.4, 4, "rgba(0,0,0,0.15)");
    rect(5.3, 8, 0.4, 4, "rgba(0,0,0,0.15)");
    // 밝은 하이라이트
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(ox + 1 * T, oy + 8.2 * T, 1.5 * T, 3.5 * T);
  } else if (bot === "shorts") {
    rect(1, 8, 6, 2, bottomColor);  // 짧은 바지
    // 밑단 라인
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    rect(1, 9.7, 6, 0.4, "rgba(0,0,0,0.2)");
  } else {
    // jeans / default
    rect(1, 8, 6, 4, bottomColor);
    // 바지 솔기
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    rect(3.8, 8, 0.4, 4, "rgba(0,0,0,0.1)");
  }

  // 4. CAPE panels (behind body) — drawn before arms
  if (character.top === "cape") {
    const capeCol = topColor;
    rect(-0.3, 4, 1.8, 6, capeCol); // left cape wing
    rect(6.5,  4, 1.8, 6, capeCol); // right cape wing
    // cape highlight
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(ox + (-0.1) * T, oy + 4.2 * T, 0.6 * T, 5 * T);
  }

  // 5. ARMS (skin, behind/alongside body)
  rect(0, 4, 1, 3.5, skin); // left arm
  rect(7, 4, 1, 3.5, skin); // right arm

  // 6. UPPER BODY (상의)
  const drawTop = () => {
    const tc = topColor;
    if (character.top === "jacket") {
      rect(1, 4, 6, 4, tc);
      // 재킷 라펠 (V-neck)
      ctx.fillStyle = skin;
      ctx.fillRect(ox + 2.8 * T, oy + 4 * T, 0.9 * T, 1.8 * T);
      ctx.fillRect(ox + 4.3 * T, oy + 4 * T, 0.9 * T, 1.8 * T);
      // 버튼
      rect(3.7, 5, 0.6, 0.6, "rgba(0,0,0,0.3)");
      rect(3.7, 6, 0.6, 0.6, "rgba(0,0,0,0.3)");
      // 소매 다크
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(ox + 1 * T, oy + 4 * T, 0.8 * T, 4 * T);
      ctx.fillRect(ox + 6.2 * T, oy + 4 * T, 0.8 * T, 4 * T);
    } else if (character.top === "overall") {
      rect(1, 4, 6, 4, tc);
      // 오버롤 멜빵
      rect(2.5, 4, 1.2, 2, tc);
      rect(4.3, 4, 1.2, 2, tc);
      // 가슴 포켓
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = scale * 0.5;
      ctx.strokeRect(ox + 3 * T + 0.5, oy + 5 * T + 0.5, 2 * T - 1, 1.2 * T - 1);
      // 어깨 부분 밝게
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(ox + 1 * T, oy + 4 * T, 6 * T, 0.6 * T);
    } else if (character.top === "armor") {
      // 갑옷: 실버 + 디테일
      const silver = "#C8C8D0";
      const darkSilver = "#888898";
      rect(1, 4, 6, 4, silver);
      // 흉갑 디테일
      rect(2, 4, 4, 0.8, darkSilver);    // 어깨받이
      rect(2.5, 5.2, 3, 1.5, darkSilver); // 흉갑
      rect(3.2, 7, 1.6, 0.8, darkSilver); // 허리띠
      // 하이라이트
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(ox + 1.2 * T, oy + 4.2 * T, 0.5 * T, 3 * T);
      ctx.fillRect(ox + 2 * T, oy + 4.2 * T, 4 * T, 0.4 * T);
      // 외곽선
      strokeRect(1, 4, 6, 4, "rgba(0,0,0,0.3)");
    } else if (character.top === "cape") {
      // 망토 안쪽 상의
      const innerColor = "#F8F8F8";
      rect(1.5, 4, 5, 4, innerColor);
      // 버클/클래스프
      ctx.fillStyle = "#FCD34D";
      ctx.fillRect(ox + 3.5 * T, oy + 4.3 * T, 1 * T, 0.7 * T);
    } else if (character.top === "striped") {
      // 줄무늬: 흰색 + 컬러 번갈아
      rect(1, 4, 6, 4, "#FFFFFF");
      for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) {
          rect(1, 4 + i, 6, 1, tc);
        }
      }
    } else {
      // t_shirt / 기본
      rect(1, 4, 6, 4, tc);
      // 칼라
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(ox + 2.5 * T, oy + 4 * T, 3 * T, 0.6 * T);
    }
    // 공통: 상의 외곽선 (갑옷 제외)
    if (character.top !== "armor") {
      strokeRect(1, 4, 6, 4, "rgba(0,0,0,0.2)");
    }
  };

  drawTop();

  // 7. NECK
  rect(3, 3, 2, 1.2, skin);

  // 8. HEAD (머리)
  rect(2, 0, 4, 3.5, skin);
  // 머리 외곽선
  strokeRect(2, 0, 4, 3.5, "rgba(0,0,0,0.4)");
  // 귀
  rect(1.5, 0.8, 0.7, 1, skin);
  rect(5.8, 0.8, 0.7, 1, skin);
  // 볼터치 (핑크 뺨)
  ctx.fillStyle = "rgba(255,120,120,0.3)";
  ctx.fillRect(ox + 2.2 * T, oy + 2.1 * T, 0.8 * T, 0.5 * T);
  ctx.fillRect(ox + 4.8 * T, oy + 2.1 * T, 0.8 * T, 0.5 * T);

  // 9. FACE (방향에 따른 눈/입)
  if (direction !== "up") {
    const eyeShift = direction === "left" ? 0.3 : direction === "right" ? -0.3 : 0;
    // 눈 (크고 귀엽게)
    rect(2.8 + eyeShift, 1.2, 0.7, 0.7, eye);
    rect(4.5 + eyeShift, 1.2, 0.7, 0.7, eye);
    // 눈 반짝임
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(ox + (2.8 + eyeShift) * T + scale * 0.5, oy + 1.2 * T + scale * 0.5, scale * 0.8, scale * 0.8);
    ctx.fillRect(ox + (4.5 + eyeShift) * T + scale * 0.5, oy + 1.2 * T + scale * 0.5, scale * 0.8, scale * 0.8);
    // 입
    ctx.fillStyle = "#E87070";
    ctx.fillRect(ox + (3.2 + eyeShift) * T, oy + 2.6 * T, 1.6 * T, 0.4 * T);
  }

  // 10. HAIR (헤어 스타일)
  const drawHair = () => {
    const { hairStyle } = character;
    switch (hairStyle) {
      case "short_cut":
        // 쇼트커트: 짧고 단정
        rect(2, -1, 4, 1.2, hair);  // 탑
        rect(2, -0.5, 0.8, 3, hair); // 왼쪽
        rect(5.2, -0.5, 0.8, 3, hair); // 오른쪽
        rect(2, -1, 4, 0.6, hair);   // 앞머리
        break;

      case "long_hair":
        // 긴머리: 어깨 아래까지
        rect(2, -1, 4, 1, hair);     // 탑
        rect(1, -0.5, 1, 7, hair);   // 왼쪽 긴 머리
        rect(6, -0.5, 1, 7, hair);   // 오른쪽 긴 머리
        rect(2, -1, 4, 0.7, hair);   // 앞머리
        rect(1.5, 3.5, 5, 2.5, hair); // 어깨 흘러내림
        break;

      case "bob_hair":
        // 단발머리: 턱선까지
        rect(2, -1, 4, 1, hair);       // 탑
        rect(1.5, -0.5, 1, 4.5, hair); // 왼쪽
        rect(5.5, -0.5, 1, 4.5, hair); // 오른쪽
        rect(2, -1, 4, 0.6, hair);     // 앞머리
        rect(1.5, 3.8, 5, 0.7, hair);  // 밑단 (컷)
        break;

      case "bunny_hat": {
        // 토끼 모자: 흰 귀 + 머리띠
        const bunnyWhite = "#F9FAFB";
        const bunnyPink  = "#FFB7C5";
        // 귀 (바깥)
        rect(2, -4, 1.2, 3.5, bunnyWhite);
        rect(4.8, -4, 1.2, 3.5, bunnyWhite);
        // 귀 (안쪽 핑크)
        ctx.fillStyle = bunnyPink;
        ctx.fillRect(ox + 2.3 * T, oy + -3.7 * T, 0.6 * T, 2.8 * T);
        ctx.fillRect(ox + 5.1 * T, oy + -3.7 * T, 0.6 * T, 2.8 * T);
        // 토끼 귀 외곽선
        strokeRect(2, -4, 1.2, 3.5, "rgba(0,0,0,0.25)");
        strokeRect(4.8, -4, 1.2, 3.5, "rgba(0,0,0,0.25)");
        // 머리 밴드 (흰색)
        rect(1.5, -0.5, 5, 1.2, bunnyWhite);
        strokeRect(1.5, -0.5, 5, 1.2, "rgba(0,0,0,0.2)");
        // 머리카락 (조금 보임)
        rect(2, -0.2, 4, 0.5, hair);
        break;
      }

      case "pigeon_hat": {
        // 비둘기 모자: 머리 위에 비둘기 한마리
        const pigGray    = "#9CA3AF";
        const pigDark    = "#6B7280";
        const pigWhite   = "#F3F4F6";
        const pigYellow  = "#FCD34D";
        // 비둘기 몸통
        rect(2.2, -2.8, 3.6, 2, pigGray);
        // 날개 디테일
        ctx.fillStyle = pigDark;
        ctx.fillRect(ox + 2.4 * T, oy + -1.8 * T, 1.2 * T, 0.7 * T);
        ctx.fillRect(ox + 4.4 * T, oy + -1.8 * T, 1.2 * T, 0.7 * T);
        // 흰 배
        rect(3, -2.5, 2, 1.5, pigWhite);
        // 머리
        rect(3.4, -3.8, 1.2, 1.2, pigGray);
        // 부리
        ctx.fillStyle = pigYellow;
        ctx.fillRect(ox + 4.5 * T, oy + -3.3 * T, 0.6 * T, 0.4 * T);
        // 눈
        ctx.fillStyle = "#1F2937";
        ctx.fillRect(ox + 4.1 * T, oy + -3.5 * T, 0.35 * T, 0.35 * T);
        // 꼬리깃
        rect(2, -1.5, 0.8, 0.8, pigDark);
        // 발 (노랑)
        ctx.fillStyle = pigYellow;
        ctx.fillRect(ox + 3 * T, oy + -0.8 * T, 0.5 * T, 0.8 * T);
        ctx.fillRect(ox + 4.5 * T, oy + -0.8 * T, 0.5 * T, 0.8 * T);
        // 모자 외곽선
        strokeRect(2.2, -2.8, 3.6, 2, "rgba(0,0,0,0.2)");
        // 머리카락
        rect(2, -0.2, 4, 0.5, hair);
        break;
      }

      case "cat_hat": {
        // 고양이 모자: 귀 + 머리띠
        // 고양이 귀
        rect(2, -2.5, 1.5, 2.5, hair);     // 왼쪽 귀
        rect(4.5, -2.5, 1.5, 2.5, hair);   // 오른쪽 귀
        ctx.fillStyle = "#FFB7C5";
        ctx.fillRect(ox + 2.35 * T, oy + -2.2 * T, 0.8 * T, 1.8 * T); // 왼쪽 안쪽
        ctx.fillRect(ox + 4.85 * T, oy + -2.2 * T, 0.8 * T, 1.8 * T); // 오른쪽 안쪽
        // 귀 외곽선
        strokeRect(2, -2.5, 1.5, 2.5, "rgba(0,0,0,0.25)");
        strokeRect(4.5, -2.5, 1.5, 2.5, "rgba(0,0,0,0.25)");
        // 머리띠
        rect(1.5, -0.5, 5, 0.9, hair);
        strokeRect(1.5, -0.5, 5, 0.9, "rgba(0,0,0,0.2)");
        // 머리
        rect(2, -0.2, 4, 0.6, hair);
        break;
      }

      case "curly": {
        // 곱슬머리: 울퉁불퉁한 텍스처
        rect(1, -1, 6, 1.5, hair);     // 탑 (넓게)
        rect(1, -0.5, 1.2, 4, hair);   // 왼쪽 곱슬
        rect(5.8, -0.5, 1.2, 4, hair); // 오른쪽 곱슬
        // 곱슬 텍스처
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(ox + 1.2 * T, oy + -0.8 * T, 0.5 * T, 0.5 * T);
        ctx.fillRect(ox + 2.5 * T, oy + -0.9 * T, 0.5 * T, 0.5 * T);
        ctx.fillRect(ox + 4 * T,   oy + -0.9 * T, 0.5 * T, 0.5 * T);
        ctx.fillRect(ox + 5.3 * T, oy + -0.8 * T, 0.5 * T, 0.5 * T);
        ctx.fillRect(ox + 1.3 * T, oy + 2 * T, 0.5 * T, 0.5 * T);
        ctx.fillRect(ox + 5.8 * T, oy + 2 * T, 0.5 * T, 0.5 * T);
        break;
      }

      default:
        // 기본 (short_cut과 동일)
        rect(2, -1, 4, 1.2, hair);
        rect(2, -0.5, 0.8, 3, hair);
        rect(5.2, -0.5, 0.8, 3, hair);
        break;
    }
  };

  drawHair();

  // 11. ACCESSORY (액세서리, 헤어 위에)
  const accColor = character.accessory !== "none"
    ? (character as CharacterData & { accessory: string }).accessory !== "none"
      ? ["glasses_round","glasses_cat","scarf_red","bow_pink"].includes(character.accessory)
        ? { glasses_round: "#9CA3AF", glasses_cat: "#1F2937", scarf_red: "#DC2626", bow_pink: "#F9A8D4" }[character.accessory as string] ?? null
        : null
      : null
    : null;

  if (accColor) {
    if (character.accessory === "glasses_round") {
      ctx.strokeStyle = accColor;
      ctx.lineWidth = scale * 0.8;
      ctx.strokeRect(ox + 2.7 * T, oy + 1.3 * T, 1.3 * T, 1 * T);
      ctx.strokeRect(ox + 4.5 * T, oy + 1.3 * T, 1.3 * T, 1 * T);
      ctx.beginPath();
      ctx.moveTo(ox + 4 * T, oy + 1.8 * T);
      ctx.lineTo(ox + 4.5 * T, oy + 1.8 * T);
      ctx.stroke();
    } else if (character.accessory === "glasses_cat") {
      ctx.strokeStyle = accColor;
      ctx.lineWidth = scale * 0.8;
      ctx.strokeRect(ox + 2.5 * T, oy + 1.3 * T, 1.5 * T, 1 * T);
      ctx.strokeRect(ox + 4.5 * T, oy + 1.3 * T, 1.5 * T, 1 * T);
    } else if (character.accessory === "scarf_red") {
      rect(1, 3.5, 6, 0.8, accColor);
    } else if (character.accessory === "bow_pink") {
      // 리본 (머리 위)
      ctx.fillStyle = accColor;
      ctx.fillRect(ox + 3 * T, oy + -1.3 * T, 0.7 * T, 0.7 * T);
      ctx.fillRect(ox + 4.3 * T, oy + -1.3 * T, 0.7 * T, 0.7 * T);
      ctx.fillRect(ox + 3.6 * T, oy + -1.2 * T, 0.8 * T, 0.5 * T);
    }
  }
}

export default function PixelCharacter({ character, direction = "down", frame = 0, scale = 3 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 16×32 body + 4 units hat space above = 20 total
  const canvasW = 8  * TILE * scale;
  const canvasH = 20 * TILE * scale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // 4 units of hat space at top
    const offsetX = 0;
    const offsetY = 4 * TILE * scale;

    drawCharacter(ctx, character, direction, frame, scale, offsetX, offsetY);
  }, [character, direction, frame, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
