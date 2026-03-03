"use client";

import { useEffect, useRef, useCallback } from "react";
import { CharacterData, FurnitureItem, PlayerState } from "@/types/game";
import { drawCharacter } from "./PixelCharacter";
import { FURNITURE_CATALOG, WALLPAPERS, FLOORS } from "@/data/items";

const TILE_SIZE = 32; // px per game tile
const ROOM_W = 16;
const ROOM_H = 12;
const CHAR_SCALE = 2;
const CHAR_TILE = 2; // pixel unit in character

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

// D-pad button style helper
const dpadBtnClass =
  "w-12 h-12 flex items-center justify-center bg-gray-800/80 text-white text-xl font-bold " +
  "rounded-lg border-2 border-gray-600 active:bg-gray-600 select-none touch-none " +
  "shadow-md cursor-pointer hover:bg-gray-700 transition-colors";

export default function GameCanvas({ character, furniture, wallpaper, floor, onPlayerMove }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<PlayerState>({
    position: { x: 8, y: 8 },
    direction: "down",
    isMoving: false,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef(0); // 0 or 1 (2-frame animation)
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

    // ── Walls (top 2 rows) ──
    const wallColor = getTileColor(WALLPAPERS, wallpaper, "#F9FAFB");
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, ROOM_W * TILE_SIZE, 2 * TILE_SIZE);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0, 2 * TILE_SIZE, ROOM_W * TILE_SIZE, 4);
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

      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(fx + 4, fy + fh - 4, fw, 6);
      ctx.fillStyle = cat.color;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(fx, fy, fw, 4);
      ctx.fillRect(fx, fy, 4, fh);
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = `bold ${Math.max(8, TILE_SIZE / 3)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(cat.name, fx + fw / 2, fy + fh / 2 + 4);
    }

    // ── Character ──
    // 16 units body height + 4 units hat space → total 20 units
    const player = playerRef.current;
    const charW = 8 * CHAR_TILE * CHAR_SCALE;
    const charBodyH = 16 * CHAR_TILE * CHAR_SCALE; // feet at bottom of body
    const charX = player.position.x * TILE_SIZE - charW / 2;
    const charY = player.position.y * TILE_SIZE - charBodyH;
    drawCharacter(ctx, character, player.direction, frameRef.current, CHAR_SCALE, charX, charY);

    // ── Player name ──
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("나", player.position.x * TILE_SIZE, player.position.y * TILE_SIZE - charBodyH - 4);
  }, [character, furniture, wallpaper, floor]);

  const gameLoop = useCallback(() => {
    const keys = keysRef.current;
    const player = playerRef.current;
    const blocked = buildCollisionMap(furniture);
    let moved = false;

    frameCountRef.current++;
    // 이동: 8프레임마다 (~8fps)
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
        nx = Math.max(0, Math.min(ROOM_W - 1, nx));
        ny = Math.max(2, Math.min(ROOM_H - 1, ny));

        if (!blocked.has(`${nx},${ny}`)) {
          player.position = { x: nx, y: ny };
          moved = true;
        }
        player.direction = dir;
        player.isMoving = true;
        // 2-frame 걷기 애니메이션
        frameRef.current = (frameRef.current + 1) % 2;
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

  // D-pad 버튼 핸들러
  const pressKey = useCallback((key: string) => {
    keysRef.current.add(key);
  }, []);
  const releaseKey = useCallback((key: string) => {
    keysRef.current.delete(key);
  }, []);

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={ROOM_W * TILE_SIZE}
        height={ROOM_H * TILE_SIZE}
        style={{ imageRendering: "pixelated", border: "3px solid #555", borderRadius: 4, display: "block" }}
        tabIndex={0}
        className="outline-none"
      />

      {/* ── 화면 방향키 D-패드 ── */}
      <div
        className="absolute bottom-4 right-4 flex flex-col items-center gap-1"
        style={{ userSelect: "none" }}
      >
        {/* 위 */}
        <button
          className={dpadBtnClass}
          onPointerDown={() => pressKey("ArrowUp")}
          onPointerUp={() => releaseKey("ArrowUp")}
          onPointerLeave={() => releaseKey("ArrowUp")}
        >
          ▲
        </button>
        {/* 중간 행 */}
        <div className="flex gap-1">
          <button
            className={dpadBtnClass}
            onPointerDown={() => pressKey("ArrowLeft")}
            onPointerUp={() => releaseKey("ArrowLeft")}
            onPointerLeave={() => releaseKey("ArrowLeft")}
          >
            ◀
          </button>
          {/* 중앙 */}
          <div className="w-12 h-12 rounded-lg bg-gray-800/60 border-2 border-gray-600 flex items-center justify-center">
            <span className="text-gray-400 text-xs font-mono">●</span>
          </div>
          <button
            className={dpadBtnClass}
            onPointerDown={() => pressKey("ArrowRight")}
            onPointerUp={() => releaseKey("ArrowRight")}
            onPointerLeave={() => releaseKey("ArrowRight")}
          >
            ▶
          </button>
        </div>
        {/* 아래 */}
        <button
          className={dpadBtnClass}
          onPointerDown={() => pressKey("ArrowDown")}
          onPointerUp={() => releaseKey("ArrowDown")}
          onPointerLeave={() => releaseKey("ArrowDown")}
        >
          ▼
        </button>
      </div>
    </div>
  );
}
