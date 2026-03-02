"use client";

import { useEffect, useRef } from "react";
import { CharacterData } from "@/types/game";
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS, TOPS, BOTTOMS, SHOES, HATS, ACCESSORIES } from "@/data/items";

interface Props {
  character: CharacterData;
  direction?: "up" | "down" | "left" | "right";
  frame?: number; // 0-3 walking animation frame
  scale?: number;
}

const TILE = 2; // base pixel unit

function getColor(list: { id: string; color?: string }[], id: string, fallback: string) {
  return list.find((i) => i.id === id)?.color ?? fallback;
}

// Draw a filled rectangle in pixel units
function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  scale: number
) {
  ctx.fillStyle = color;
  ctx.fillRect(x * TILE * scale, y * TILE * scale, w * TILE * scale, h * TILE * scale);
}

// Draw outline
function outline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
) {
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = scale;
  ctx.strokeRect(x * TILE * scale + 0.5, y * TILE * scale + 0.5, w * TILE * scale - 1, h * TILE * scale - 1);
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  character: CharacterData,
  direction: "up" | "down" | "left" | "right",
  frame: number,
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
  const hatColor = character.hat !== "none" ? getColor(HATS, character.hat, "transparent") : null;
  const accColor = character.accessory !== "none" ? getColor(ACCESSORIES, character.accessory, "transparent") : null;

  // walking bob: frame 1,3 shift up by 1px
  const bob = (frame === 1 || frame === 3) ? -0.5 : 0;

  const S = scale;
  const T = TILE * S;
  const ox = offsetX;
  const oy = offsetY;

  // Helper using canvas coordinates
  const rect = (gx: number, gy: number, gw: number, gh: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + gx * T, oy + (gy + bob) * T, gw * T, gh * T);
  };

  // ── SHOES (bottom layer) ──
  if (direction !== "up") {
    rect(1, 11, 2, 1, shoeColor);
    rect(5, 11, 2, 1, shoeColor);
  } else {
    rect(1, 11, 2, 1, shoeColor);
    rect(5, 11, 2, 1, shoeColor);
  }

  // ── BOTTOM (pants/skirt) ──
  rect(1, 9, 6, 2, bottomColor);

  // ── TOP (shirt) ──
  rect(1, 6, 6, 3, topColor);

  // ── ARMS ──
  rect(0, 6, 1, 3, skin);
  rect(7, 6, 1, 3, skin);

  // ── HEAD ──
  rect(2, 1, 4, 4, skin); // head
  outline(ctx, 2 + ox / T, 1 + (bob > 0 ? 0 : bob), 4, 4, S);

  // ── HAIR (based on style) ──
  const { hairStyle } = character;
  if (hairStyle === "short" || hairStyle === "bob") {
    rect(2, 0, 4, 2, hair); // top hair
    if (direction !== "up") {
      rect(2, 0, 1, 4, hair); // left sideburn
      rect(5, 0, 1, 4, hair); // right sideburn
    }
  } else if (hairStyle === "long") {
    rect(2, 0, 4, 2, hair);
    rect(2, 0, 1, 5, hair);
    rect(5, 0, 1, 5, hair);
    rect(2, 5, 4, 1, hair);
  } else if (hairStyle === "twin") {
    rect(2, 0, 4, 2, hair);
    rect(1, 1, 1, 5, hair); // left twin tail
    rect(6, 1, 1, 5, hair); // right twin tail
  } else if (hairStyle === "curly") {
    rect(1, 0, 6, 2, hair);
    rect(1, 0, 1, 4, hair);
    rect(6, 0, 1, 4, hair);
    rect(2, 4, 2, 1, hair);
    rect(4, 4, 2, 1, hair);
  } else if (hairStyle === "ponytail") {
    rect(2, 0, 4, 2, hair);
    rect(5, 0, 1, 6, hair); // ponytail on right
  }

  // ── FACE (direction dependent) ──
  if (direction === "down" || direction === "left" || direction === "right") {
    // Eyes
    const eyeOffsetX = direction === "left" ? 0.5 : direction === "right" ? 0 : 0;
    rect(3 + eyeOffsetX, 2.5, 0.5, 0.5, eye);
    rect(5 + eyeOffsetX, 2.5, 0.5, 0.5, eye);
    // Mouth
    rect(3.5, 3.5, 1, 0.5, "#FF9999");
  }

  // ── HAT ──
  if (hatColor && character.hat !== "none") {
    if (character.hat.startsWith("beret")) {
      rect(2, -1, 4, 2, hatColor);
      rect(1, 0, 6, 1, hatColor);
    } else if (character.hat.startsWith("cap")) {
      rect(1, -1, 6, 1, hatColor);
      rect(2, -2, 4, 1, hatColor);
      rect(0, -1, 1, 0.5, hatColor); // brim
      rect(7, -1, 1, 0.5, hatColor);
    } else if (character.hat === "cat_ears") {
      rect(2, -2, 1, 2, hatColor);
      rect(5, -2, 1, 2, hatColor);
      // inner ear
      ctx.fillStyle = "#FFB7C5";
      ctx.fillRect(ox + 2.2 * T, oy + (-1.8 + bob) * T, 0.6 * T, 1.4 * T);
      ctx.fillRect(ox + 5.2 * T, oy + (-1.8 + bob) * T, 0.6 * T, 1.4 * T);
    } else if (character.hat === "bunny_ears") {
      rect(2.5, -4, 0.5, 3, hatColor);
      rect(5, -4, 0.5, 3, hatColor);
    } else if (character.hat === "flower_crown") {
      rect(2, -1, 4, 0.5, "#22C55E"); // stem
      for (let i = 0; i < 4; i++) {
        rect(2 + i, -1.5, 0.8, 0.8, hatColor);
      }
    }
  }

  // ── ACCESSORY ──
  if (accColor && character.accessory !== "none") {
    if (character.accessory === "glasses_round") {
      ctx.strokeStyle = accColor;
      ctx.lineWidth = S;
      ctx.strokeRect(ox + 2.8 * T, oy + (2.3 + bob) * T, 1.2 * T, 1 * T);
      ctx.strokeRect(ox + 4.5 * T, oy + (2.3 + bob) * T, 1.2 * T, 1 * T);
      ctx.beginPath();
      ctx.moveTo(ox + 4 * T, oy + (2.8 + bob) * T);
      ctx.lineTo(ox + 4.5 * T, oy + (2.8 + bob) * T);
      ctx.stroke();
    } else if (character.accessory === "glasses_cat") {
      ctx.strokeStyle = accColor;
      ctx.lineWidth = S;
      ctx.strokeRect(ox + 2.5 * T, oy + (2.3 + bob) * T, 1.5 * T, 1 * T);
      ctx.strokeRect(ox + 4.5 * T, oy + (2.3 + bob) * T, 1.5 * T, 1 * T);
    } else if (character.accessory === "scarf_red") {
      rect(1, 5, 6, 1, accColor);
    } else if (character.accessory === "bow_pink") {
      rect(3, -0.5, 2, 0.5, accColor);
      rect(3.5, -1, 1, 0.5, accColor);
    }
  }
}

export default function PixelCharacter({ character, direction = "down", frame = 0, scale = 3 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas size: 8 x 13 tiles (including hat space)
  const canvasW = 8 * TILE * scale;
  const canvasH = 15 * TILE * scale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // offset to center character and leave room for hats
    const offsetX = 0;
    const offsetY = 2 * TILE * scale;

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
