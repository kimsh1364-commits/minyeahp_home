"use client";

import { useEffect, useRef, useCallback } from "react";
import { CharacterData, FurnitureItem, PlayerState } from "@/types/game";
import { drawCharacter } from "./PixelCharacter";
import { FURNITURE_CATALOG, WALLPAPERS, FLOORS } from "@/data/items";

const TILE_SIZE = 32; // px per tile
const ROOM_W = 16;
const ROOM_H = 12;
const CHAR_SCALE = 2;

interface Props {
  character: CharacterData;
  furniture: FurnitureItem[];
  wallpaper: string;
  floor: string;
  onPlayerMove?: (state: PlayerState) => void;
}

function getTileColor(list: { id: string; color: string }[], id: string, fallback: string) {
  return list.find((i) => i.id === id)?.color ?? fallback;
}

function buildCollisionMap(furniture: FurnitureItem[]): Set<string> {
  const blocked = new Set<string>();
  for (const item of furniture) {
    const cat = FURNITURE_CATALOG.find((c) => c.id === item.itemId);
    if (!cat) continue;
    for (let dx = 0; dx < cat.width; dx++) {
      for (let dy = 0; dy < cat.height; dy++) {
        blocked.add(`${item.x + dx},${item.y + dy}`);
      }
    }
  }
  return blocked;
}

export default function GameCanvas({ character, furniture, wallpaper, floor, onPlayerMove }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<PlayerState>({
    position: { x: 8, y: 8 },
    direction: "down",
    isMoving: false,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0);
  const animFrameRef = useRef(0);
  const frameCountRef = useRef(0);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Floor tiles ──
    const floorColor = getTileColor(FLOORS, floor, "#C8A882");
    const floorDark = floorColor + "CC";
    for (let ty = 0; ty < ROOM_H; ty++) {
      for (let tx = 0; tx < ROOM_W; tx++) {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? floorColor : floorDark;
        ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // ── Walls (top row) ──
    const wallColor = getTileColor(WALLPAPERS, wallpaper, "#F9FAFB");
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, ROOM_W * TILE_SIZE, 2 * TILE_SIZE);
    // wall bottom shadow
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 2 * TILE_SIZE, ROOM_W * TILE_SIZE, 4);

    // wall detail: baseboard
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(0, 2 * TILE_SIZE - 4, ROOM_W * TILE_SIZE, 4);

    // ── Furniture ──
    for (const item of furniture) {
      const cat = FURNITURE_CATALOG.find((c) => c.id === item.itemId);
      if (!cat) continue;
      const fx = item.x * TILE_SIZE;
      const fy = item.y * TILE_SIZE;
      const fw = cat.width * TILE_SIZE;
      const fh = cat.height * TILE_SIZE;

      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(fx + 4, fy + fh - 4, fw, 6);

      // body
      ctx.fillStyle = cat.color;
      ctx.fillRect(fx, fy, fw, fh);

      // highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(fx, fy, fw, 4);
      ctx.fillRect(fx, fy, 4, fh);

      // outline
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);

      // label
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = `bold ${Math.max(8, TILE_SIZE / 3)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(cat.name, fx + fw / 2, fy + fh / 2 + 4);
    }

    // ── Character ──
    const player = playerRef.current;
    const charX = player.position.x * TILE_SIZE - (8 * 2 * CHAR_SCALE) / 2;
    const charY = player.position.y * TILE_SIZE - (13 * 2 * CHAR_SCALE);
    drawCharacter(ctx, character, player.direction, frameRef.current, CHAR_SCALE, charX, charY);

    // ── Username (if available) ──
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("나", player.position.x * TILE_SIZE, player.position.y * TILE_SIZE - 28);
  }, [character, furniture, wallpaper, floor]);

  const gameLoop = useCallback(() => {
    const keys = keysRef.current;
    const player = playerRef.current;
    const blocked = buildCollisionMap(furniture);
    let moved = false;

    frameCountRef.current++;
    // move every 8 frames (~8fps movement)
    if (frameCountRef.current % 8 === 0) {
      let nx = player.position.x;
      let ny = player.position.y;
      let dir = player.direction;
      let moving = false;

      if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) {
        ny -= 1; dir = "up"; moving = true;
      } else if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) {
        ny += 1; dir = "down"; moving = true;
      } else if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
        nx -= 1; dir = "left"; moving = true;
      } else if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
        nx += 1; dir = "right"; moving = true;
      }

      if (moving) {
        // clamp to room + wall boundary
        nx = Math.max(0, Math.min(ROOM_W - 1, nx));
        ny = Math.max(2, Math.min(ROOM_H - 1, ny));

        if (!blocked.has(`${nx},${ny}`)) {
          player.position = { x: nx, y: ny };
          moved = true;
        }
        player.direction = dir;
        player.isMoving = moving;

        // walking animation
        if (moving) {
          frameRef.current = (frameRef.current + 1) % 4;
        }
      } else {
        player.isMoving = false;
        frameRef.current = 0;
      }

      if (moved) onPlayerMove?.(player);
    }

    renderFrame();
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [furniture, onPlayerMove, renderFrame]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={ROOM_W * TILE_SIZE}
        height={ROOM_H * TILE_SIZE}
        style={{ imageRendering: "pixelated", border: "3px solid #555", borderRadius: 4 }}
        tabIndex={0}
        className="outline-none"
      />
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded font-mono">
        WASD / 방향키로 이동
      </div>
    </div>
  );
}
