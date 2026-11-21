"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { books, checker, corduroy, gingham, mosaic, oakFloor, penny, stripes } from "./textures";

// 평면도(방3, 전용 62.35㎡) 기준 좌표, 단위 m. x: 서→동, z: 북→남
const H = 2.4; // 층고
const T = 0.12; // 벽 두께
export const CENTER: [number, number, number] = [3.9, 0, 5.35];

// 무드: 빈티지 · 키치 · 코지 · 버터리
const C = {
  wall: "#f6e8c4",
  wallRaw: "#bdb7ae",
  butter: "#f1d27a",
  butterSoft: "#f7e6a8",
  cream: "#fff7e6",
  honey: "#c98b55",
  honeyDeep: "#a86a3c",
  burgundy: "#8a2a31",
  mustard: "#d9a441",
  sage: "#9db38a",
  leaf: "#5e7b4c",
  leaf2: "#7d9b62",
  terra: "#c47f58",
  chrome: "#d7dbde",
  black: "#2b2523",
  glow: "#ffd9a0",
};

export type RoomId = "living" | "kitchen" | "master" | "dress" | "study" | "bath" | "entrance";
export type Room = { name: string; x: [number, number]; z: [number, number]; items: string[]; mood: string };
export const ROOMS: Record<RoomId, Room> = {
  living: { name: "거실", x: [3.5, 7.8], z: [5.4, 9.3], items: ["sofa", "storage", "appliances", "lights", "decor", "floor"], mood: "버터 코듀로이 소파, 체커 러그, 브라운관 TV" },
  kitchen: { name: "주방·다이닝", x: [2.6, 5.5], z: [1.3, 5.9], items: ["kitchen", "island", "dining", "appliances", "lights"], mood: "허니 원목 주방, 버터 체커 타일, 줄무늬 빈티지 체어" },
  master: { name: "안방", x: [0, 3.6], z: [5.9, 9.3], items: ["bed", "decor", "floor"], mood: "물결 헤드보드, 버터 깅엄 이불, 물결 우드 거울" },
  dress: { name: "드레스룸", x: [0, 2.7], z: [1.3, 4.4], items: ["storage", "decor"], mood: "크림 붙박이장, 행거, 우드 전신거울" },
  study: { name: "서재", x: [5.4, 7.8], z: [1.3, 4.0], items: ["desk", "storage", "decor"], mood: "원목 책상, 컬러풀 책장, 버섯 조명" },
  bath: { name: "욕실", x: [0, 2.7], z: [4.3, 6.0], items: ["bath", "lights"], mood: "세이지 모자이크, 페니 타일 액자 거울, 욕조" },
  entrance: { name: "현관", x: [6.2, 7.8], z: [3.9, 5.2], items: ["entrance", "keys"], mood: "버터 체커 바닥, 우드 유리 중문" },
};

type ItemState = "done" | "ghost" | "hidden";
type SceneCtx = { fraction: (id: string) => number; nextId: string | null; dream: boolean; focus: RoomId | null; onSelect: (id: string) => void };
const Ctx = createContext<SceneCtx>({ fraction: () => 1, nextId: null, dream: true, focus: null, onSelect: () => {} });
const GhostCtx = createContext(false);

function useItem(id: string): ItemState {
  const { fraction, nextId, dream } = useContext(Ctx);
  if (dream || fraction(id) >= 1) return "done";
  if (id === nextId) return "ghost";
  return "hidden";
}
const useDone = (id: string) => useItem(id) === "done";
const useF = (id: string) => {
  const { fraction, dream } = useContext(Ctx);
  return dream ? 1 : fraction(id);
};

// 해금되면 바닥에서 쑥 자라남
function Pop({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current || t.current >= 1) return;
    t.current = Math.min(1, t.current + dt * 2.2);
    const x = t.current;
    const s = 1 + 0.12 * Math.sin(x * Math.PI) - (1 - x) * (1 - x) * 0.9;
    ref.current.scale.set(1, Math.max(0.01, s), 1);
  });
  return (
    <group ref={ref} scale={[1, 0.01, 1]}>
      {children}
    </group>
  );
}

function Item({ id, children }: { id: string; children: ReactNode }) {
  const state = useItem(id);
  const { onSelect } = useContext(Ctx);
  if (state === "hidden") return null;
  return (
    <GhostCtx.Provider value={state === "ghost"}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        {state === "done" ? <Pop>{children}</Pop> : children}
      </group>
    </GhostCtx.Provider>
  );
}

type MatProps = { c: string; map?: THREE.Texture; rough?: number; metal?: number; emissive?: string; glass?: boolean; side?: THREE.Side };
function M({ c, map, rough = 0.8, metal = 0, emissive, glass, side }: MatProps) {
  const ghost = useContext(GhostCtx);
  const opacity = ghost ? 0.3 : glass ? 0.25 : 1;
  return (
    <meshStandardMaterial
      color={ghost ? "#9fb6ff" : c}
      map={ghost ? undefined : map}
      roughness={rough}
      metalness={metal}
      emissive={emissive && !ghost ? emissive : "#000000"}
      emissiveIntensity={emissive ? 0.9 : 0}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity === 1}
      side={side}
    />
  );
}

type BoxProps = { x: [number, number]; y: [number, number]; z: [number, number]; r?: number; shadow?: boolean } & MatProps;
function B({ x, y, z, r = 0, shadow = true, ...mat }: BoxProps) {
  const size: [number, number, number] = [x[1] - x[0], y[1] - y[0], z[1] - z[0]];
  const pos: [number, number, number] = [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2];
  if (size[1] <= 0.001) return null;
  if (r > 0)
    return (
      <RoundedBox args={size} radius={Math.min(r, ...size.map((s) => s / 2.01))} smoothness={3} position={pos} castShadow={shadow} receiveShadow>
        <M {...mat} />
      </RoundedBox>
    );
  return (
    <mesh position={pos} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
      <M {...mat} />
    </mesh>
  );
}

function Cyl({ p, r, h, segs = 24, rot, ...mat }: { p: [number, number, number]; r: number | [number, number]; h: number; segs?: number; rot?: [number, number, number] } & MatProps) {
  const [rt, rb] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[rt, rb, h, segs]} />
      <M {...mat} />
    </mesh>
  );
}

function Ball({ p, r, s, ...mat }: { p: [number, number, number]; r: number; s?: [number, number, number] } & MatProps) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[r, 16, 12]} />
      <M {...mat} />
    </mesh>
  );
}

// 반구 (버섯 갓)
function Dome({ p, r, ...mat }: { p: [number, number, number]; r: number } & MatProps) {
  return (
    <mesh position={p} castShadow>
      <sphereGeometry args={[r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <M side={THREE.DoubleSide} {...mat} />
    </mesh>
  );
}

// 바닥·벽에 붙는 얇은 면 (텍스처용)
function Plane({ p, w, h, rotY = 0, flat = false, ...mat }: { p: [number, number, number]; w: number; h: number; rotY?: number; flat?: boolean } & MatProps) {
  return (
    <mesh position={p} rotation={flat ? [-Math.PI / 2, 0, 0] : [0, rotY, 0]} receiveShadow>
      <planeGeometry args={[w, h]} />
      <M {...mat} />
    </mesh>
  );
}

/* ───────────── 구조 ───────────── */

type Wall = { x: [number, number]; z: [number, number]; max: number; outer?: boolean };
const tall = H;
const low = 0.55;
// 남서쪽에서 내려다보므로 서쪽·남쪽 벽은 낮게(컷어웨이)
const WALLS = {
  north: { x: [0, 7.8], z: [0, T], max: tall, outer: true },
  east: { x: [7.8 - T, 7.8], z: [0, 10.7], max: tall, outer: true },
  west: { x: [0, T], z: [0, 10.7], max: low, outer: true },
  south: { x: [0, 7.8], z: [10.7 - T, 10.7], max: low, outer: true },
  z13: { x: [0, 7.8], z: [1.3, 1.3 + T], max: tall }, // 발코니 | 방
  x26a: { x: [2.6, 2.6 + T], z: [1.3, 3.4], max: tall }, // 드레스룸 | 주방
  z43: { x: [0, 2.6 + T], z: [4.3, 4.3 + T], max: tall }, // 드레스룸 | 욕실
  x26b: { x: [2.6, 2.6 + T], z: [4.3, 4.6], max: tall },
  x26c: { x: [2.6, 2.6 + T], z: [5.4, 5.9], max: tall }, // 욕실 | 복도
  z59: { x: [0, 2.7], z: [5.9, 5.9 + T], max: tall }, // 욕실 | 안방
  x35: { x: [3.5, 3.5 + T], z: [5.9, 9.2], max: tall }, // 안방 | 거실
  x54: { x: [5.4, 5.4 + T], z: [1.3, 3.9], max: tall }, // 주방 | 서재
  z39: { x: [6.3, 7.8], z: [3.9, 3.9 + T], max: tall }, // 서재 | 현관
  z92: { x: [0, 7.8], z: [9.2, 9.2 + T], max: low }, // 거실·안방 | 남쪽 발코니
} satisfies Record<string, Wall>;
type WallId = keyof typeof WALLS;

// 방에 집중하면 그 방의 북쪽·동쪽(뒷벽)만 남기고 나머지는 낮춤
function isBackWall(w: Wall, r: Room) {
  const horizontal = w.x[1] - w.x[0] > w.z[1] - w.z[0];
  const overlap = (a: [number, number], b: [number, number]) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 0.1;
  if (horizontal) return Math.abs((w.z[0] + w.z[1]) / 2 - r.z[0]) < 0.2 && overlap(w.x, r.x);
  return Math.abs((w.x[0] + w.x[1]) / 2 - r.x[1]) < 0.2 && overlap(w.z, r.z);
}

function useWallLowered(id: WallId) {
  const { focus } = useContext(Ctx);
  return !!focus && !isBackWall(WALLS[id], ROOMS[focus]);
}

// 벽에 걸린 것들: 벽이 낮아지면 같이 숨김
function On({ wall, children }: { wall: WallId; children: ReactNode }) {
  return useWallLowered(wall) ? null : <>{children}</>;
}

function Walls() {
  const { focus } = useContext(Ctx);
  const outerF = useF("outerWalls");
  const innerF = useF("innerWalls");
  const cream = useDone("wallpaper");
  const color = cream ? C.wall : C.wallRaw;
  return (
    <group>
      {(Object.entries(WALLS) as [WallId, Wall][]).map(([id, w]) => {
        const full = w.max * (w.outer ? outerF : innerF);
        const lowered = focus && !isBackWall(w, ROOMS[focus]);
        return <B key={id} x={w.x} z={w.z} y={[0, lowered ? Math.min(full, 0.3) : full]} c={color} rough={0.95} />;
      })}
    </group>
  );
}

function Foundation() {
  const f = useF("foundation");
  const outerF = useF("outerWalls");
  if (f <= 0) return null;
  const cols: [number, number][] = [[0, 0], [7.8, 0], [0, 10.7], [7.8, 10.7], [2.6, 1.3], [5.4, 1.3], [3.5, 9.2], [0, 5.9], [7.8, 5.9]];
  return (
    <group>
      <B x={[-0.25, 8.05]} y={[-0.3, 0]} z={[-0.25, 10.95]} c="#cfc9bf" rough={1} />
      {outerF < 1 && cols.map(([x, z], i) => <B key={i} x={[x - 0.1, x + 0.1]} z={[z - 0.1, z + 0.1]} y={[0, H * f]} c="#a9a39a" />)}
    </group>
  );
}

function Floors() {
  const oak = oakFloor(2, 2);
  const f = { c: "#ffffff", map: oak, shadow: false } as const;
  return (
    <>
      <Item id="floor">
        <B x={[0.1, 2.6]} z={[1.4, 4.3]} y={[0, 0.02]} {...f} />
        <B x={[2.7, 5.4]} z={[1.4, 4.3]} y={[0, 0.02]} {...f} />
        <B x={[5.5, 7.7]} z={[1.4, 3.9]} y={[0, 0.02]} {...f} />
        <B x={[2.7, 6.3]} z={[3.9, 9.2]} y={[0, 0.02]} {...f} />
        <B x={[6.3, 7.7]} z={[5.1, 9.2]} y={[0, 0.02]} {...f} />
        <B x={[0.1, 3.5]} z={[6.0, 9.2]} y={[0, 0.02]} {...f} />
      </Item>
      <Item id="balcony">
        <B x={[0.1, 7.7]} z={[0.12, 1.3]} y={[0, 0.03]} c="#ffffff" map={checker("#c98a63", "#d9a27a", 4, 8, 1)} shadow={false} />
        <B x={[0.1, 7.7]} z={[9.3, 10.6]} y={[0, 0.03]} c="#ffffff" map={checker("#c98a63", "#d9a27a", 4, 8, 1)} shadow={false} />
      </Item>
    </>
  );
}

function Window({ x, z, y = [0.9, 2.1], axis = "x" }: { x: [number, number]; z: number; y?: [number, number]; axis?: "x" | "z" }) {
  const sash = useDone("sash");
  const fc = sash ? "#fbf7ee" : "#8f8f8f";
  const ft = sash ? 0.07 : 0.035;
  const glass = { c: "#cfe6ef", glass: true } as const;
  const mid = (x[0] + x[1]) / 2;
  const P = (a: [number, number], b: [number, number], yy: [number, number], props: object) =>
    axis === "x" ? <B x={a} z={b} y={yy} {...(props as MatProps)} /> : <B z={a} x={b} y={yy} {...(props as MatProps)} />;
  const zz: [number, number] = [z - 0.08, z + 0.08];
  return (
    <group>
      {P(x, [z - 0.03, z + 0.03], y, { ...glass, shadow: false })}
      {P(x, zz, [y[0], y[0] + ft], { c: fc })}
      {P(x, zz, [y[1] - ft, y[1]], { c: fc })}
      {P([x[0], x[0] + ft], zz, y, { c: fc })}
      {P([x[1] - ft, x[1]], zz, y, { c: fc })}
      {P([mid - ft / 2, mid + ft / 2], zz, y, { c: fc })}
    </group>
  );
}

function Windows() {
  return (
    <Item id="windows">
      <On wall="north">
        <Window x={[0.4, 5.1]} z={0.06} y={[0.5, 2.2]} />
        <Window x={[5.6, 7.5]} z={0.06} y={[0.5, 2.2]} />
      </On>
      <On wall="z13">
        <Window x={[0.4, 2.2]} z={1.36} />
        <Window x={[5.7, 7.3]} z={1.36} />
        <Window x={[3.0, 4.6]} z={1.36} y={[0.05, 2.1]} />
      </On>
      <On wall="east">
        <Window x={[1.7, 3.0]} z={7.74} axis="z" />
      </On>
    </Item>
  );
}

function DoorPanel({ hinge, along, len = 0.8 }: { hinge: [number, number]; along: "x+" | "x-" | "z+" | "z-"; len?: number }) {
  const oak = useDone("carpentry");
  const c = oak ? C.honey : "#dccdb2";
  const [hx, hz] = hinge;
  const x: [number, number] = along === "x+" ? [hx, hx + len] : along === "x-" ? [hx - len, hx] : [hx - 0.02, hx + 0.02];
  const z: [number, number] = along === "z+" ? [hz, hz + len] : along === "z-" ? [hz - len, hz] : [hz - 0.02, hz + 0.02];
  const kx = along.startsWith("x") ? (along === "x+" ? x[1] - 0.08 : x[0] + 0.08) : hx;
  const kz = along.startsWith("z") ? (along === "z+" ? z[1] - 0.08 : z[0] + 0.08) : hz;
  return (
    <group>
      <B x={x} z={z} y={[0, 2.05]} c={c} r={0.01} />
      <Ball p={[kx, 1.0, kz]} r={0.035} c="#e2c27a" metal={0.6} rough={0.3} />
    </group>
  );
}

function Doors() {
  return (
    <Item id="doors">
      <DoorPanel hinge={[2.66, 3.4]} along="x-" />
      <DoorPanel hinge={[2.66, 5.4]} along="x+" len={0.75} />
      <DoorPanel hinge={[2.75, 5.95]} along="z+" len={0.75} />
      <DoorPanel hinge={[6.3, 3.96]} along="x-" />
    </Item>
  );
}

function Keys() {
  return (
    <Item id="keys">
      {/* 버터색 현관문 + 문패 */}
<On wall="east">
      <B x={[7.6, 7.72]} z={[4.15, 5.0]} y={[0, 2.1]} c="#e9c766" r={0.02} />
      <Ball p={[7.57, 1.05, 4.25]} r={0.04} c="#c9a24a" metal={0.7} rough={0.3} />
      <Cyl p={[7.57, 1.6, 4.58]} r={0.12} h={0.02} rot={[0, 0, Math.PI / 2]} c={C.cream} />
</On>
      <B x={[6.9, 7.5]} z={[4.3, 4.85]} y={[0.03, 0.05]} c="#ffffff" map={stripes(2, 1)} r={0.01} />
    </Item>
  );
}

/* ───────────── 공용 소품 ───────────── */

// 레퍼런스: 원목 프레임 + 버건디 줄무늬 원단 체어. 로컬 +z가 앞
function VintageChair({ p, rot = 0, s = 1 }: { p: [number, number, number]; rot?: number; s?: number }) {
  const fab = stripes(1, 1);
  const w = C.honey;
  return (
    <group position={p} rotation={[0, rot, 0]} scale={s}>
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <B key={i} x={[x - 0.025, x + 0.025]} z={[z - 0.025, z + 0.025]} y={[0, z < 0 ? 0.88 : 0.44]} c={w} />
      ))}
      <B x={[-0.2, 0.2]} z={[-0.2, -0.17]} y={[0.12, 0.17]} c={w} />
      <B x={[-0.22, -0.18]} z={[-0.2, 0.2]} y={[0.18, 0.22]} c={w} />
      <B x={[0.18, 0.22]} z={[-0.2, 0.2]} y={[0.18, 0.22]} c={w} />
      <B x={[-0.23, 0.23]} z={[-0.22, 0.23]} y={[0.4, 0.46]} c={w} />
      <B x={[-0.21, 0.21]} z={[-0.2, 0.22]} y={[0.46, 0.52]} c="#ffffff" map={fab} r={0.025} />
      <B x={[-0.2, 0.2]} z={[-0.23, -0.17]} y={[0.6, 0.84]} c="#ffffff" map={fab} r={0.025} />
    </group>
  );
}

function MushroomLamp({ p, c = C.butter, s = 1 }: { p: [number, number, number]; c?: string; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.015, 0]} r={0.09} h={0.03} c={c} />
      <Cyl p={[0, 0.16, 0]} r={[0.03, 0.045]} h={0.28} c={c} />
      <Dome p={[0, 0.28, 0]} r={0.15} c={c} emissive={c === C.butter ? "#ffd27a" : undefined} />
    </group>
  );
}

function Plant({ p, s = 1, pot = C.terra }: { p: [number, number, number]; s?: number; pot?: string }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.15, 0]} r={[0.14, 0.11]} h={0.3} c={pot} />
      <Ball p={[0, 0.5, 0]} r={0.22} c={C.leaf} />
      <Ball p={[0.11, 0.66, 0.05]} r={0.15} c={C.leaf2} />
      <Ball p={[-0.1, 0.62, -0.06]} r={0.13} c={C.leaf2} />
    </group>
  );
}

function Frame({ p, w, h, art, rotY = 0 }: { p: [number, number, number]; w: number; h: number; art: "orange" | "cherry" | "sun"; rotY?: number }) {
  const bg = art === "orange" ? C.butterSoft : art === "cherry" ? "#f3e4d2" : "#e9d8b5";
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <B x={[-w / 2, w / 2]} y={[-h / 2, h / 2]} z={[-0.02, 0.02]} c={C.honeyDeep} />
      <B x={[-w / 2 + 0.04, w / 2 - 0.04]} y={[-h / 2 + 0.04, h / 2 - 0.04]} z={[0.02, 0.025]} c={bg} shadow={false} />
      {art === "orange" && <Cyl p={[0, -0.02, 0.03]} r={w * 0.22} h={0.01} rot={[Math.PI / 2, 0, 0]} c="#e98a3a" />}
      {art === "cherry" && (
        <>
          <Cyl p={[-0.06, -0.06, 0.03]} r={w * 0.13} h={0.01} rot={[Math.PI / 2, 0, 0]} c={C.burgundy} />
          <Cyl p={[0.07, -0.04, 0.03]} r={w * 0.13} h={0.01} rot={[Math.PI / 2, 0, 0]} c={C.burgundy} />
        </>
      )}
      {art === "sun" && <Cyl p={[0, 0.02, 0.03]} r={w * 0.25} h={0.01} rot={[Math.PI / 2, 0, 0]} c={C.mustard} />}
    </group>
  );
}

function Curtain({ x, z, h = 2.3 }: { x: [number, number]; z: number; h?: number }) {
  const n = 5;
  const w = (x[1] - x[0]) / n;
  return (
    <group>
      <B x={[x[0] - 0.05, x[1] + 0.05]} z={[z - 0.015, z + 0.015]} y={[h + 0.02, h + 0.05]} c={C.honeyDeep} />
      {Array.from({ length: n }, (_, i) => (
        <B key={i} x={[x[0] + i * w, x[0] + (i + 1) * w]} z={[z - (i % 2 ? 0.05 : 0.02), z + 0.03]} y={[0.05, h]} c="#ffffff" map={gingham(1, 4)} r={0.02} />
      ))}
    </group>
  );
}

/* ───────────── 주방·다이닝 ───────────── */

function Kitchen() {
  const steel = { c: C.chrome, metal: 0.6, rough: 0.35 } as const;
  const tile = checker("#f1d27a", "#fff7e6", 8, 4, 1);
  return (
    <Item id="kitchen">
      {/* 동쪽 하부장 */}
      <B x={[4.8, 5.38]} z={[1.45, 3.75]} y={[0, 0.85]} c={C.honey} r={0.02} />
      {[1.9, 2.5, 3.3].map((z) => <B key={z} x={[4.78, 4.8]} z={[z - 0.15, z + 0.15]} y={[0.74, 0.77]} c={C.honeyDeep} />)}
      <B x={[4.76, 5.4]} z={[1.42, 3.78]} y={[0.85, 0.9]} {...steel} />
      {/* 북쪽 하부장 */}
      <B x={[3.35, 4.8]} z={[1.45, 2.05]} y={[0, 0.85]} c={C.honey} r={0.02} />
      <B x={[3.32, 4.8]} z={[1.42, 2.08]} y={[0.85, 0.9]} {...steel} />
      {/* 버터 체커 백스플래시 */}
<On wall="z13">
      <Plane p={[4.36, 1.2, 1.431]} w={2.02} h={0.6} c="#ffffff" map={tile} />
</On>
      {/* 싱크 + 구즈넥 수전 */}
      <B x={[4.9, 5.25]} z={[2.6, 3.2]} y={[0.86, 0.91]} c="#9aa0a4" metal={0.8} rough={0.25} />
      <Cyl p={[5.3, 1.05, 2.9]} r={0.02} h={0.3} c={C.chrome} metal={0.9} rough={0.2} />
      {/* 쿡탑 + 빨간 법랑 주전자 */}
      <B x={[3.6, 4.2]} z={[1.55, 1.95]} y={[0.9, 0.92]} c="#2f3133" rough={0.2} />
      <Ball p={[3.78, 1.0, 1.75]} r={0.09} s={[1, 0.85, 1]} c="#c8423a" rough={0.3} />
      <Cyl p={[3.78, 1.09, 1.75]} r={0.025} h={0.04} c={C.black} />
      <On wall="z13">
      {/* 우드 후드 */}
      <B x={[3.6, 4.2]} z={[1.45, 1.9]} y={[1.55, 1.95]} c={C.honey} r={0.02} />
      <B x={[3.75, 4.05]} z={[1.45, 1.7]} y={[1.95, 2.4]} c={C.honey} />
      </On>
      <On wall="x54">
      <Plane p={[5.399, 1.2, 2.6]} w={2.3} h={0.6} rotY={-Math.PI / 2} c="#ffffff" map={tile} />
      {/* 오픈 선반 + 유리병·접시 */}
      <B x={[5.12, 5.38]} z={[2.0, 3.5]} y={[1.7, 1.74]} c={C.honeyDeep} />
      {[["#e98a3a", 2.15], ["#f1d27a", 2.35], [C.sage, 2.55]].map(([c, z]) => (
        <Cyl key={z as number} p={[5.25, 1.82, z as number]} r={0.06} h={0.16} c={c as string} />
      ))}
      {[2.85, 3.0, 3.15].map((z) => (
        <Cyl key={z} p={[5.3, 1.86, z]} r={0.1} h={0.02} rot={[Math.PI / 2, 0, 0]} c={z === 3.0 ? C.burgundy : C.cream} />
      ))}
      </On>
      <Plant p={[4.4, 0.9, 1.7]} s={0.45} pot={C.cream} />
    </Item>
  );
}

function Island() {
  return (
    <Item id="island">
      <B x={[3.2, 4.5]} z={[2.85, 3.55]} y={[0, 0.85]} c={C.honey} r={0.02} />
      <B x={[3.15, 4.55]} z={[2.8, 3.6]} y={[0.85, 0.9]} c={C.chrome} metal={0.6} rough={0.35} />
      {/* 과일 그릇 */}
      <Cyl p={[3.55, 0.94, 3.2]} r={[0.17, 0.1]} h={0.08} c={C.cream} />
      <Ball p={[3.5, 1.0, 3.18]} r={0.06} c="#e98a3a" />
      <Ball p={[3.61, 1.0, 3.24]} r={0.06} c="#e98a3a" />
      <Ball p={[3.56, 1.04, 3.12]} r={0.055} c="#f1d27a" />
      <Cyl p={[4.2, 0.97, 3.15]} r={0.07} h={0.14} c={C.cream} />
    </Item>
  );
}

function Dining() {
  return (
    <Item id="dining">
      <Cyl p={[4.5, 0.36, 5.0]} r={[0.07, 0.2]} h={0.72} c={C.honeyDeep} />
      <Cyl p={[4.5, 0.74, 5.0]} r={0.55} h={0.04} c={C.honey} />
      {/* 깅엄 러너 + 꽃병 */}
      <B x={[4.2, 4.8]} z={[4.85, 5.15]} y={[0.76, 0.765]} c="#ffffff" map={gingham(2, 1, "rgba(138,42,49,0.4)")} shadow={false} />
      <Cyl p={[4.5, 0.86, 5.0]} r={[0.04, 0.06]} h={0.18} c={C.cream} />
      <Ball p={[4.48, 1.0, 5.0]} r={0.05} c="#e98a3a" />
      <Ball p={[4.55, 0.98, 5.03]} r={0.045} c={C.butter} />
      <VintageChair p={[3.82, 0, 5.0]} rot={Math.PI / 2} />
      <VintageChair p={[5.18, 0, 5.0]} rot={-Math.PI / 2} />
      <VintageChair p={[4.5, 0, 5.68]} rot={Math.PI} />
    </Item>
  );
}

/* ───────────── 욕실 (레퍼런스: 세이지 모자이크 + 페니 타일) ───────────── */

function Bath() {
  const mos = mosaic(5, 4);
  const pen = penny(3, 4);
  const band = penny(10, 1);
  const zF = 4.425; // 북쪽 벽 안쪽 면
  return (
    <Item id="bath">
      <B x={[0.12, 2.6]} z={[4.42, 5.9]} y={[0, 0.03]} c="#ffffff" map={checker("#efe8da", "#ddd3c1", 6, 3, 2)} shadow={false} />
      <On wall="z43">
      {/* 모자이크 벽 */}
      <Plane p={[1.36, 1.1, zF]} w={2.48} h={2.2} c="#ffffff" map={mos} />
      {/* 페니 타일 띠 + 블랙 라인 */}
      <Plane p={[1.36, 0.93, zF + 0.002]} w={2.48} h={0.13} c="#ffffff" map={band} />
      <B x={[0.12, 2.6]} z={[zF, zF + 0.006]} y={[0.86, 0.875]} c={C.black} shadow={false} />
      <B x={[0.12, 2.6]} z={[zF, zF + 0.006]} y={[0.985, 1.0]} c={C.black} shadow={false} />
      {/* 타일 선반 */}
      <B x={[0.12, 2.6]} z={[zF, 4.6]} y={[1.0, 1.08]} c="#ffffff" map={mosaic(12, 1)} />
      {/* 페니 타일 액자 + 타원 거울 */}
      <Plane p={[1.47, 1.72, zF + 0.002]} w={0.86} h={1.0} c="#ffffff" map={pen} />
      <B x={[1.04, 1.9]} z={[zF, zF + 0.008]} y={[2.2, 2.22]} c={C.black} shadow={false} />
      <B x={[1.04, 1.9]} z={[zF, zF + 0.008]} y={[1.22, 1.24]} c={C.black} shadow={false} />
      <B x={[1.03, 1.05]} z={[zF, zF + 0.008]} y={[1.22, 2.22]} c={C.black} shadow={false} />
      <B x={[1.89, 1.91]} z={[zF, zF + 0.008]} y={[1.22, 2.22]} c={C.black} shadow={false} />
      <mesh position={[1.47, 1.72, zF + 0.01]} scale={[0.24, 0.36, 1]}>
        <circleGeometry args={[1, 40]} />
        <M c="#e4ddd0" rough={0.05} metal={0.6} />
      </mesh>
      </On>
      {/* 벽걸이 세면대 + 크롬 배관 */}
      <B x={[1.2, 1.76]} z={[4.44, 4.88]} y={[0.68, 0.82]} c="#fbfbf8" r={0.05} />
      <Cyl p={[1.48, 0.9, 4.52]} r={0.016} h={0.18} c={C.chrome} metal={0.9} rough={0.2} />
      <Cyl p={[1.48, 0.45, 4.6]} r={0.03} h={0.45} c={C.chrome} metal={0.9} rough={0.2} />
      {/* 욕조 (서쪽 벽) */}
      <B x={[0.14, 0.92]} z={[4.44, 5.88]} y={[0, 0.55]} c="#efe4cf" r={0.03} />
      <B x={[0.22, 0.84]} z={[4.52, 5.8]} y={[0.5, 0.56]} c="#fbfbf8" r={0.04} />
      <B x={[0.27, 0.79]} z={[4.57, 5.75]} y={[0.52, 0.565]} c="#dbe9ec" shadow={false} />
      <On wall="z43">
      {/* 핸드샤워 */}
      <Cyl p={[0.7, 1.35, 4.47]} r={0.02} h={0.22} c={C.chrome} metal={0.9} rough={0.2} />
      <Cyl p={[0.7, 1.48, 4.5]} r={[0.05, 0.03]} h={0.06} c={C.chrome} metal={0.9} rough={0.2} />
      </On>
      {/* 변기 */}
      <B x={[2.05, 2.45]} z={[4.44, 4.63]} y={[0.4, 0.75]} c="#fbfbf8" r={0.04} />
      <B x={[2.07, 2.43]} z={[4.58, 5.08]} y={[0, 0.42]} c="#fbfbf8" r={0.08} />
      <On wall="z43">
      {/* 블랙 벽등 + 블랙 훅 레일 */}
      <Cyl p={[0.95, 1.85, 4.48]} r={[0.035, 0.05]} h={0.16} c="#fff6e0" emissive={C.glow} />
      <Dome p={[0.95, 1.92, 4.48]} r={0.045} c={C.black} />
      <B x={[2.2, 2.55]} z={[zF, 4.45]} y={[1.5, 1.53]} c={C.black} />
      {/* 디퓨저 */}
      <Cyl p={[0.5, 1.15, 4.5]} r={0.04} h={0.12} c={C.black} />
      </On>
    </Item>
  );
}

/* ───────────── 거실 ───────────── */

function Sofa() {
  const cord = corduroy(C.butter, 6, 3);
  return (
    <Item id="sofa">
      {/* 버터·크림 체커 러그 */}
      <B x={[4.55, 6.65]} z={[6.5, 8.7]} y={[0.02, 0.035]} c="#ffffff" map={checker("#f1d27a", "#fff7e6", 6, 1, 1)} r={0.01} shadow={false} />
      {/* 버터 코듀로이 소파 */}
      <B x={[6.8, 7.65]} z={[6.3, 8.9]} y={[0.08, 0.44]} c="#ffffff" map={cord} r={0.14} />
      <B x={[7.3, 7.65]} z={[6.3, 8.9]} y={[0.4, 0.9]} c="#ffffff" map={cord} r={0.14} />
      <B x={[6.8, 7.6]} z={[6.3, 6.56]} y={[0.4, 0.66]} c="#ffffff" map={cord} r={0.12} />
      <B x={[6.8, 7.6]} z={[8.64, 8.9]} y={[0.4, 0.66]} c="#ffffff" map={cord} r={0.12} />
      {[6.85, 8.85].map((z) => <Cyl key={z} p={[6.9, 0.04, z]} r={0.03} h={0.08} c={C.honeyDeep} />)}
      {/* 쿠션 */}
      <B x={[7.08, 7.3]} z={[6.75, 7.2]} y={[0.44, 0.82]} c="#ffffff" map={stripes(1, 1)} r={0.1} />
      <B x={[7.08, 7.3]} z={[7.9, 8.35]} y={[0.44, 0.82]} c="#ffffff" map={checker(C.burgundy, C.cream, 4, 1, 1)} r={0.1} />
      {/* 원목 커피테이블 + 과일 */}
      <Cyl p={[5.6, 0.19, 7.6]} r={[0.12, 0.2]} h={0.38} c={C.honeyDeep} />
      <Cyl p={[5.6, 0.4, 7.6]} r={0.45} h={0.05} c={C.honey} />
      <Cyl p={[5.5, 0.47, 7.5]} r={[0.13, 0.08]} h={0.07} c={C.cream} />
      <Ball p={[5.46, 0.52, 7.48]} r={0.05} c="#e98a3a" />
      <Ball p={[5.55, 0.52, 7.53]} r={0.05} c={C.butter} />
      <B x={[5.7, 5.9]} z={[7.65, 7.85]} y={[0.425, 0.47]} c={C.burgundy} r={0.01} />
    </Item>
  );
}

function Storage() {
  return (
    <Item id="storage">
      {/* 드레스룸 크림 붙박이장 */}
      <B x={[0.2, 1.8]} z={[1.45, 2.05]} y={[0, 2.1]} c={C.cream} r={0.02} />
      {[0.73, 1.27].map((x) => <B key={x} x={[x - 0.005, x + 0.005]} z={[2.05, 2.06]} y={[0.05, 2.05]} c="#e6d9c2" />)}
      {[0.67, 0.79, 1.21, 1.33].map((x) => <Ball key={x} p={[x, 1.05, 2.08]} r={0.025} c={C.honey} />)}
      {/* 행거 + 옷 */}
      <B x={[0.35, 0.39]} z={[3.48, 3.52]} y={[0, 1.6]} c={C.honeyDeep} />
      <B x={[1.86, 1.9]} z={[3.48, 3.52]} y={[0, 1.6]} c={C.honeyDeep} />
      <Cyl p={[1.12, 1.58, 3.5]} r={0.015} h={1.55} rot={[0, 0, Math.PI / 2]} c={C.honeyDeep} />
      {[[0.55, C.burgundy, 1.0], [0.8, C.butter, 0.85], [1.05, C.cream, 1.05], [1.3, C.sage, 0.9], [1.55, "#e98a3a", 0.8]].map(([x, c, h]) => (
        <B key={x as number} x={[(x as number) - 0.1, (x as number) + 0.1]} z={[3.42, 3.58]} y={[1.55 - (h as number), 1.52]} c={c as string} r={0.04} />
      ))}
      {/* 거실 낮은 수납장 */}
      <B x={[3.63, 4.1]} z={[6.6, 8.6]} y={[0.06, 0.55]} c={C.honey} r={0.02} />
      {[7.1, 7.6, 8.1].map((z) => <Ball key={z} p={[4.11, 0.32, z]} r={0.025} c={C.honeyDeep} />)}
      {/* 서재 책장 */}
      <B x={[7.36, 7.68]} z={[1.6, 3.6]} y={[0, 1.8]} c={C.honey} />
      <Plane p={[7.355, 0.9, 2.6]} w={1.9} h={1.7} rotY={-Math.PI / 2} c="#ffffff" map={books()} />
    </Item>
  );
}

function Appliances() {
  return (
    <Item id="appliances">
      {/* 레트로 버터 냉장고 */}
      <B x={[2.75, 3.32]} z={[1.45, 2.1]} y={[0.05, 1.85]} c={C.butterSoft} r={0.12} />
      <B x={[3.0, 3.06]} z={[2.1, 2.13]} y={[1.2, 1.55]} c={C.chrome} metal={0.8} rough={0.3} />
      <B x={[2.77, 3.3]} z={[2.09, 2.11]} y={[1.3, 1.31]} c="#e4cf8e" shadow={false} />
      {/* 식기세척기 */}
      <B x={[4.78, 4.8]} z={[2.0, 2.45]} y={[0.05, 0.8]} c={C.cream} />
      {/* 세탁기 (북쪽 발코니) */}
      <B x={[0.3, 0.95]} z={[0.25, 0.9]} y={[0, 0.85]} c={C.cream} r={0.05} />
      <mesh position={[0.625, 0.5, 0.91]}>
        <circleGeometry args={[0.2, 24]} />
        <M c="#9fb3bf" rough={0.2} />
      </mesh>
      {/* 브라운관 TV (거실 수납장 위) */}
      <B x={[3.68, 4.08]} z={[7.25, 7.85]} y={[0.55, 1.0]} c={C.cream} r={0.06} />
      <B x={[4.06, 4.1]} z={[7.32, 7.7]} y={[0.62, 0.93]} c="#3b4148" r={0.02} rough={0.2} />
      <Ball p={[4.08, 0.8, 7.78]} r={0.02} c={C.mustard} />
      <Cyl p={[3.88, 1.17, 7.45]} r={0.006} h={0.4} rot={[0.45, 0, 0]} c={C.chrome} metal={0.8} />
      <Cyl p={[3.88, 1.17, 7.65]} r={0.006} h={0.4} rot={[-0.45, 0, 0]} c={C.chrome} metal={0.8} />
    </Item>
  );
}

function Lights() {
  const pendant = (x: number, z: number, c: string, len = 0.3) => (
    <group key={`${x}-${z}`} position={[x, 0, z]}>
      <Cyl p={[0, 2.4 - len / 2, 0]} r={0.005} h={len} c="#ffffff" />
      <Dome p={[0, 2.4 - len - 0.12, 0]} r={0.16} c={c} />
      <Ball p={[0, 2.4 - len - 0.13, 0]} r={0.06} c="#fff3d6" emissive={C.glow} />
    </group>
  );
  return (
    <Item id="lights">
      {pendant(3.55, 3.2, C.butter)}
      {pendant(4.15, 3.2, C.butter)}
      {pendant(4.5, 5.0, C.cream, 0.6)}
      {/* 주방 벽등 */}
<On wall="x54">
      <B x={[5.38, 5.4]} z={[3.5, 3.7]} y={[1.6, 1.9]} c="#fff3d6" emissive={C.glow} />
</On>
      {/* 플리츠 플로어 스탠드 */}
      <Cyl p={[7.35, 0.02, 5.95]} r={0.14} h={0.04} c={C.honeyDeep} />
      <Cyl p={[7.35, 0.75, 5.95]} r={0.015} h={1.5} c="#c9a24a" metal={0.6} rough={0.3} />
      <Cyl p={[7.35, 1.55, 5.95]} r={[0.12, 0.22]} h={0.3} segs={14} c={C.cream} emissive="#ffe2b0" />
      {/* 안방 버섯 조명 */}
      <MushroomLamp p={[2.72, 0.5, 6.28]} />
    </Item>
  );
}

/* ───────────── 안방 ───────────── */

function Bed() {
  const duvet = gingham(4, 4);
  return (
    <Item id="bed">
      {/* 둥근 러그 */}
      <Cyl p={[1.5, 0.025, 7.9]} r={1.05} h={0.01} segs={40} c={C.cream} />
      {/* 원목 프레임 + 물결 헤드보드 */}
      <B x={[0.55, 2.35]} z={[6.1, 8.25]} y={[0.06, 0.3]} c={C.honey} r={0.04} />
      <B x={[0.55, 2.35]} z={[6.05, 6.16]} y={[0.0, 0.95]} c={C.honey} r={0.03} />
      {Array.from({ length: 6 }, (_, i) => (
        <Cyl key={i} p={[0.7 + i * 0.3, 0.95, 6.105]} r={0.15} h={0.11} rot={[Math.PI / 2, 0, 0]} segs={20} c={C.honey} />
      ))}
      {/* 매트리스 + 버터 깅엄 이불 */}
      <B x={[0.6, 2.3]} z={[6.2, 8.2]} y={[0.3, 0.5]} c={C.cream} r={0.06} />
      <B x={[0.58, 2.32]} z={[6.9, 8.22]} y={[0.45, 0.58]} c="#ffffff" map={duvet} r={0.06} />
      <B x={[0.58, 2.32]} z={[7.7, 7.95]} y={[0.56, 0.6]} c="#ffffff" map={stripes(3, 1)} r={0.02} />
      {/* 베개 */}
      <B x={[0.72, 1.38]} z={[6.25, 6.65]} y={[0.48, 0.66]} c="#ffffff" r={0.08} />
      <B x={[1.52, 2.18]} z={[6.25, 6.65]} y={[0.48, 0.66]} c="#ffffff" r={0.08} />
      <B x={[1.2, 1.7]} z={[6.6, 6.82]} y={[0.5, 0.72]} c={C.burgundy} r={0.08} />
      {/* 협탁 */}
      <B x={[2.5, 2.95]} z={[6.08, 6.48]} y={[0, 0.5]} c={C.honey} r={0.03} />
      <Ball p={[2.725, 0.32, 6.49]} r={0.025} c={C.honeyDeep} />
    </Item>
  );
}

/* ───────────── 서재 ───────────── */

function Desk() {
  return (
    <Item id="desk">
      <B x={[5.9, 7.2]} z={[1.45, 2.05]} y={[0.7, 0.75]} c={C.honey} r={0.02} />
      <B x={[5.92, 5.97]} z={[1.5, 2.0]} y={[0, 0.7]} c={C.honeyDeep} />
      <B x={[7.13, 7.18]} z={[1.5, 2.0]} y={[0, 0.7]} c={C.honeyDeep} />
      <B x={[6.6, 7.15]} z={[1.5, 2.0]} y={[0.4, 0.7]} c={C.honey} r={0.02} />
      <VintageChair p={[6.5, 0, 2.45]} rot={Math.PI} />
      <MushroomLamp p={[6.15, 0.75, 1.7]} c={C.sage} s={0.85} />
      <On wall="z13">
      {/* 코르크 보드 + 메모 */}
      <B x={[6.1, 7.0]} z={[1.42, 1.45]} y={[1.1, 1.65]} c="#c99a6b" />
      {[[6.3, 1.5, C.butter], [6.55, 1.3, "#f3b6a5"], [6.8, 1.48, C.sage]].map(([x, y, c], i) => (
        <B key={i} x={[(x as number) - 0.08, (x as number) + 0.08]} z={[1.45, 1.46]} y={[(y as number) - 0.08, (y as number) + 0.08]} c={c as string} shadow={false} />
      ))}
      </On>
      {/* 책 몇 권 + 머그 */}
      <B x={[6.75, 6.95]} z={[1.55, 1.8]} y={[0.75, 0.81]} c={C.burgundy} />
      <B x={[6.77, 6.93]} z={[1.57, 1.78]} y={[0.81, 0.86]} c={C.butter} />
      <Cyl p={[6.45, 0.8, 1.85]} r={0.04} h={0.09} c={C.cream} />
    </Item>
  );
}

/* ───────────── 현관 ───────────── */

function Entrance() {
  return (
    <Item id="entrance">
      <B x={[6.3, 7.7]} z={[4.0, 5.1]} y={[0, 0.03]} c="#ffffff" map={checker("#f1d27a", "#fff7e6", 8, 2, 2)} shadow={false} />
      {/* 우드 유리 중문 */}
      <B x={[6.26, 6.32]} z={[4.0, 5.1]} y={[0, 2.1]} c="#f3ead8" glass />
      <B x={[6.24, 6.34]} z={[4.0, 5.1]} y={[2.05, 2.12]} c={C.honey} />
      {[4.0, 4.37, 4.73, 5.08].map((z) => (
        <B key={z} x={[6.24, 6.34]} z={[z - 0.02, z + 0.02]} y={[0, 2.1]} c={C.honey} />
      ))}
      {/* 신발장 + 둥근 거울 */}
      <B x={[6.45, 7.65]} z={[4.03, 4.38]} y={[0.12, 1.1]} c={C.honey} r={0.03} />
      <B x={[7.04, 7.06]} z={[4.37, 4.39]} y={[0.2, 1.0]} c={C.honeyDeep} />
<On wall="z39">
      <Cyl p={[7.05, 1.6, 4.04]} r={0.28} h={0.03} rot={[Math.PI / 2, 0, 0]} c={C.honey} />
      <Cyl p={[7.05, 1.6, 4.06]} r={0.24} h={0.01} rot={[Math.PI / 2, 0, 0]} c="#e4ddd0" rough={0.05} metal={0.6} />
</On>
      <Plant p={[6.6, 1.1, 4.2]} s={0.4} pot={C.cream} />
      {/* 우산꽂이 */}
      <Cyl p={[7.5, 0.25, 4.95]} r={0.09} h={0.5} c={C.burgundy} />
    </Item>
  );
}

/* ───────────── 소품 ───────────── */

function WavyMirror() {
  const beads: [number, number][] = [];
  const w = 0.55;
  const h = 0.85;
  for (let i = 0; i <= 8; i++) beads.push([-w / 2 + (w * i) / 8, h / 2], [-w / 2 + (w * i) / 8, -h / 2]);
  for (let i = 1; i < 12; i++) beads.push([-w / 2, -h / 2 + (h * i) / 12], [w / 2, -h / 2 + (h * i) / 12]);
  return (
    <group position={[3.47, 1.45, 7.3]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <M c="#dcd6cb" rough={0.1} metal={0.5} />
      </mesh>
      {beads.map(([x, y], i) => (
        <Ball key={i} p={[x, y, 0.02]} r={0.045} c={C.honeyDeep} />
      ))}
    </group>
  );
}

function Decor() {
  return (
    <Item id="decor">
<On wall="x35">
      <WavyMirror />
</On>
      {/* 거실 포스터 (소파 위) */}
<On wall="east">
      <Frame p={[7.66, 1.55, 7.0]} w={0.5} h={0.65} art="orange" rotY={-Math.PI / 2} />
      <Frame p={[7.66, 1.45, 7.85]} w={0.45} h={0.5} art="cherry" rotY={-Math.PI / 2} />
</On>
      {/* 거실 빈티지 체어 */}
      <VintageChair p={[5.6, 0, 8.85]} rot={Math.PI} />
      <MushroomLamp p={[3.85, 0.55, 8.3]} c={C.burgundy} s={0.9} />
      {/* 화분 */}
      <Plant p={[4.05, 0, 9.0]} s={1.4} />
      <Plant p={[0.6, 0, 9.9]} />
      <Plant p={[7.2, 0, 9.9]} s={0.9} />
      <Plant p={[3.1, 0, 8.9]} s={0.8} pot={C.cream} />
      <Plant p={[7.3, 0, 0.6]} />
      <Plant p={[5.8, 0, 3.6]} s={0.75} pot={C.butter} />
      {/* 깅엄 커튼 */}
      <Curtain x={[4.0, 4.7]} z={9.12} />
      <Curtain x={[6.9, 7.6]} z={9.12} />
      <Curtain x={[0.3, 0.95]} z={9.12} />
      {/* 안방 액자 */}
<On wall="z59">
      <Frame p={[1.45, 1.55, 6.03]} w={0.6} h={0.4} art="sun" />
</On>
      {/* 드레스룸: 우드 전신거울 + 푸프 + 러그 */}
      <group position={[2.5, 0, 2.6]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.95, 0]} scale={[0.32, 0.8, 1]} rotation={[-0.12, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <M c={C.honey} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.95, 0.012]} scale={[0.27, 0.74, 1]} rotation={[-0.12, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <M c="#e4ddd0" rough={0.05} metal={0.6} />
        </mesh>
      </group>
      <Cyl p={[1.2, 0.025, 2.8]} r={0.75} h={0.01} segs={40} c={C.sage} />
      <Cyl p={[1.2, 0.2, 2.8]} r={0.24} h={0.36} c="#ffffff" map={corduroy(C.butter, 4, 1)} />
      {/* 남쪽 발코니: 버터 비스트로 세트 */}
      <Cyl p={[2.0, 0.35, 10.0]} r={0.03} h={0.7} c={C.butter} />
      <Cyl p={[2.0, 0.71, 10.0]} r={0.3} h={0.03} c={C.butter} />
      {[1.55, 2.45].map((x) => (
        <group key={x} position={[x, 0, 10.0]}>
          <Cyl p={[0, 0.22, 0]} r={0.025} h={0.44} c={C.butter} />
          <Cyl p={[0, 0.45, 0]} r={0.18} h={0.03} c={C.butter} />
        </group>
      ))}
      <Cyl p={[2.0, 0.78, 10.0]} r={0.04} h={0.1} c={C.burgundy} />
      {/* 북쪽 발코니: 빨래 건조대 */}
      <B x={[1.3, 2.6]} z={[0.55, 0.58]} y={[1.3, 1.33]} c={C.chrome} metal={0.6} />
      {[[1.45, C.cream], [1.75, C.butter], [2.05, "#f3b6a5"], [2.35, C.cream]].map(([x, c]) => (
        <B key={x as number} x={[(x as number) - 0.12, (x as number) + 0.12]} z={[0.55, 0.58]} y={[0.85, 1.3]} c={c as string} shadow={false} />
      ))}
    </Item>
  );
}

function Electric() {
  const on = useDone("electric");
  if (!on) return null;
  return (
    <group>
      {[[1.3, 2.8], [4.0, 2.4], [6.5, 2.6], [5.4, 7.4], [1.6, 7.6], [1.4, 5.1], [7.0, 4.5]].map(([x, z], i) => (
        <pointLight key={i} position={[x, 2.1, z]} intensity={0.8} distance={4} color="#ffd7a3" />
      ))}
    </group>
  );
}

/* ───────────── 공사 소품 ───────────── */

function Construction() {
  const { dream } = useContext(Ctx);
  const doorsF = useF("doors");
  const demoF = useF("demolition");
  if (dream) return null;
  return (
    <group>
      {doorsF < 1 && <Crane />}
      {demoF < 1 && (
        <group>
          <B x={[8.6, 9.4]} z={[3.0, 3.8]} y={[0, 0.55]} c="#e7e1d4" r={0.12} />
          <B x={[8.65, 9.35]} z={[3.05, 3.75]} y={[0.5, 0.65]} c="#bcb3a3" r={0.08} />
          {[[8.6, 5.2], [9.2, 5.6], [-0.9, 3.0]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Cyl p={[0, 0.25, 0]} r={[0.02, 0.16]} h={0.5} c="#ff8a3d" />
              <Cyl p={[0, 0.27, 0]} r={[0.085, 0.1]} h={0.07} c="#ffffff" />
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

function Crane() {
  const arm = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.5 + 0.4;
  });
  const y = "#f2b33d";
  return (
    <group position={[9.2, 0, -1.0]}>
      <B x={[-0.4, 0.4]} z={[-0.4, 0.4]} y={[0, 0.25]} c="#8a8a8a" />
      <B x={[-0.12, 0.12]} z={[-0.12, 0.12]} y={[0.25, 3.8]} c={y} />
      <group ref={arm} position={[0, 3.8, 0]}>
        <B x={[-1.2, 4.5]} z={[-0.1, 0.1]} y={[0, 0.2]} c={y} />
        <B x={[-1.4, -0.7]} z={[-0.25, 0.25]} y={[-0.3, 0.05]} c="#8a8a8a" />
        <B x={[-0.25, 0.25]} z={[-0.25, 0.25]} y={[0.2, 0.6]} c="#ffffff" r={0.05} />
        <Cyl p={[3.6, -1.0, 0]} r={0.008} h={2.0} c="#444" />
        <B x={[3.35, 3.85]} z={[-0.25, 0.25]} y={[-2.3, -2.0]} c={C.honey} />
      </group>
    </group>
  );
}

/* ───────────── 씬 ───────────── */

export function House(props: SceneCtx) {
  return (
    <Ctx.Provider value={props}>
      <group position={[-CENTER[0], 0, -CENTER[2]]}>
        <mesh position={[3.9, -0.42, 5.35]} receiveShadow>
          <cylinderGeometry args={[9.6, 9.8, 0.24, 64]} />
          <meshStandardMaterial color="#efe0b9" roughness={1} />
        </mesh>
        <Foundation />
        <Walls />
        <Floors />
        <Windows />
        <Doors />
        <Keys />
        <Kitchen />
        <Island />
        <Dining />
        <Bath />
        <Sofa />
        <Storage />
        <Appliances />
        <Lights />
        <Bed />
        <Desk />
        <Entrance />
        <Decor />
        <Electric />
        <Construction />
      </group>
    </Ctx.Provider>
  );
}
