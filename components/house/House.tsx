"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { greyTile, mosaic, oakFloor, terracotta } from "./textures";

// 평면도(방3, 전용 62.35㎡) 기준 좌표, 단위 m. x: 서→동, z: 북→남
const H = 2.4; // 층고
const T = 0.12; // 벽 두께
export const CENTER: [number, number, number] = [3.9, 0, 5.35];

type ItemState = "done" | "ghost" | "hidden";
type SceneCtx = { fraction: (id: string) => number; nextId: string | null; dream: boolean; onSelect: (id: string) => void };
const Ctx = createContext<SceneCtx>({ fraction: () => 1, nextId: null, dream: true, onSelect: () => {} });
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

// 해금되면 톡 튀어나오는 그룹
function Pop({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current || t.current >= 1) return;
    t.current = Math.min(1, t.current + dt * 2.2);
    const x = t.current;
    const s = 1 + 0.12 * Math.sin(x * Math.PI) - (1 - x) * (1 - x) * 0.9; // 살짝 오버슈트
    ref.current.scale.set(1, Math.max(0.01, s), 1); // 바닥에서 쑥 자라남
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
  const body = <group>{children}</group>;
  return (
    <GhostCtx.Provider value={state === "ghost"}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        {state === "done" ? <Pop>{body}</Pop> : body}
      </group>
    </GhostCtx.Provider>
  );
}

function M({ c, map, rough = 0.8, metal = 0, emissive, glass }: { c: string; map?: THREE.Texture; rough?: number; metal?: number; emissive?: string; glass?: boolean }) {
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
    />
  );
}

// 좌표 범위로 박스 그리기
function B({ x, y, z, c, map, r = 0, rough, metal, emissive, glass, shadow = true }: {
  x: [number, number]; y: [number, number]; z: [number, number]; c: string; map?: THREE.Texture; r?: number; rough?: number; metal?: number; emissive?: string; glass?: boolean; shadow?: boolean;
}) {
  const size: [number, number, number] = [x[1] - x[0], y[1] - y[0], z[1] - z[0]];
  const pos: [number, number, number] = [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2];
  if (size[1] <= 0.001) return null;
  const mat = <M c={c} map={map} rough={rough} metal={metal} emissive={emissive} glass={glass} />;
  if (r > 0)
    return (
      <RoundedBox args={size} radius={Math.min(r, ...size.map((s) => s / 2.01))} smoothness={3} position={pos} castShadow={shadow} receiveShadow>
        {mat}
      </RoundedBox>
    );
  return (
    <mesh position={pos} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
      {mat}
    </mesh>
  );
}

function Cyl({ p, r, h, c, rough, metal, emissive, segs = 24 }: { p: [number, number, number]; r: number | [number, number]; h: number; c: string; rough?: number; metal?: number; emissive?: string; segs?: number }) {
  const [rt, rb] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[rt, rb, h, segs]} />
      <M c={c} rough={rough} metal={metal} emissive={emissive} />
    </mesh>
  );
}

/* ───────────── 구조 ───────────── */

type Wall = { x: [number, number]; z: [number, number]; max: number };
const tall = H;
const low = 0.55;
// 남서쪽에서 내려다보므로 서쪽·남쪽 벽은 낮게(컷어웨이)
const OUTER: Wall[] = [
  { x: [0, 7.8], z: [0, T], max: tall }, // 북쪽 발코니 바깥벽
  { x: [7.8 - T, 7.8], z: [0, 10.7], max: tall }, // 동쪽
  { x: [0, T], z: [0, 10.7], max: low }, // 서쪽
  { x: [0, 7.8], z: [10.7 - T, 10.7], max: low }, // 남쪽
];
const INNER: Wall[] = [
  { x: [0, 7.8], z: [1.3, 1.3 + T], max: tall }, // 발코니 | 방
  { x: [2.6, 2.6 + T], z: [1.3, 3.4], max: tall }, // 작은방 | 주방
  { x: [0, 2.6 + T], z: [4.3, 4.3 + T], max: tall }, // 작은방 | 욕실
  { x: [2.6, 2.6 + T], z: [4.3, 4.6], max: tall },
  { x: [2.6, 2.6 + T], z: [5.4, 5.9], max: tall }, // 욕실 | 복도
  { x: [0, 2.7], z: [5.9, 5.9 + T], max: tall }, // 욕실 | 안방
  { x: [3.5, 3.5 + T], z: [5.9, 9.2], max: tall }, // 안방 | 거실
  { x: [5.4, 5.4 + T], z: [1.3, 3.9], max: tall }, // 주방 | 침실3
  { x: [6.3, 7.8], z: [3.9, 3.9 + T], max: tall }, // 침실3 | 현관
  { x: [0, 7.8], z: [9.2, 9.2 + T], max: low }, // 거실·안방 | 남쪽 발코니
];

function Walls() {
  const outerF = useF("outerWalls");
  const innerF = useF("innerWalls");
  const cream = useDone("wallpaper");
  const color = cream ? "#f4ecdf" : "#bdb7ae";
  return (
    <group>
      {OUTER.map((w, i) => (
        <B key={`o${i}`} x={w.x} z={w.z} y={[0, w.max * outerF]} c={color} rough={0.95} />
      ))}
      {INNER.map((w, i) => (
        <B key={`i${i}`} x={w.x} z={w.z} y={[0, w.max * innerF]} c={color} rough={0.95} />
      ))}
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
      {outerF < 1 &&
        cols.map(([x, z], i) => (
          <B key={i} x={[x - 0.1, x + 0.1]} z={[z - 0.1, z + 0.1]} y={[0, H * Math.min(1, f * 1.0)]} c="#a9a39a" />
        ))}
    </group>
  );
}

function Floors() {
  const oak = oakFloor(2, 2);
  return (
    <>
      <Item id="floor">
        <B x={[0.1, 2.6]} z={[1.4, 4.3]} y={[0, 0.02]} c="#ffffff" map={oak} shadow={false} />
        <B x={[2.7, 5.4]} z={[1.4, 4.3]} y={[0, 0.02]} c="#ffffff" map={oak} shadow={false} />
        <B x={[5.5, 7.7]} z={[1.4, 3.9]} y={[0, 0.02]} c="#ffffff" map={oak} shadow={false} />
        <B x={[2.7, 6.3]} z={[3.9, 9.2]} y={[0, 0.02]} c="#ffffff" map={oak} shadow={false} />
        <B x={[6.3, 7.7]} z={[5.1, 9.2]} y={[0, 0.02]} c="#ffffff" map={oak} shadow={false} />
        <B x={[0.1, 3.5]} z={[6.0, 9.2]} y={[0, 0.02]} c="#ffffff" map={oak} shadow={false} />
      </Item>
      <Item id="entrance">
        <B x={[6.3, 7.7]} z={[4.0, 5.1]} y={[0, 0.03]} c="#ffffff" map={greyTile(3, 2)} shadow={false} />
        {/* 3연동 유리 중문 */}
        <B x={[6.26, 6.32]} z={[4.0, 5.1]} y={[0, 2.1]} c="#e8eef0" glass />
        <B x={[6.24, 6.34]} z={[4.0, 5.1]} y={[2.05, 2.12]} c="#c9a47a" />
        {[4.0, 4.37, 4.73, 5.08].map((z) => (
          <B key={z} x={[6.24, 6.34]} z={[z - 0.02, z + 0.02]} y={[0, 2.1]} c="#c9a47a" />
        ))}
        {/* 우드 신발장 */}
        <B x={[6.45, 7.65]} z={[4.03, 4.38]} y={[0, 1.2]} c="#c98b55" r={0.03} />
        <B x={[7.04, 7.06]} z={[4.37, 4.39]} y={[0.1, 1.1]} c="#a06a3c" />
      </Item>
      <Item id="balcony">
        <B x={[0.1, 7.7]} z={[0.12, 1.3]} y={[0, 0.03]} c="#ffffff" map={terracotta(8, 1)} shadow={false} />
        <B x={[0.1, 7.7]} z={[9.3, 10.6]} y={[0, 0.03]} c="#ffffff" map={terracotta(8, 1)} shadow={false} />
      </Item>
    </>
  );
}

function Window({ x, z, y = [0.9, 2.1], axis = "x" }: { x: [number, number]; z: number; y?: [number, number]; axis?: "x" | "z" }) {
  const sash = useDone("sash");
  const fc = sash ? "#f7f5f0" : "#8f8f8f";
  const ft = sash ? 0.07 : 0.035;
  const glass = { c: "#cfe6ef", glass: true } as const;
  const mid = (x[0] + x[1]) / 2;
  if (axis === "x")
    return (
      <group>
        <B x={x} z={[z - 0.03, z + 0.03]} y={y} {...glass} shadow={false} />
        <B x={x} z={[z - 0.08, z + 0.08]} y={[y[0], y[0] + ft]} c={fc} />
        <B x={x} z={[z - 0.08, z + 0.08]} y={[y[1] - ft, y[1]]} c={fc} />
        <B x={[x[0], x[0] + ft]} z={[z - 0.08, z + 0.08]} y={y} c={fc} />
        <B x={[x[1] - ft, x[1]]} z={[z - 0.08, z + 0.08]} y={y} c={fc} />
        <B x={[mid - ft / 2, mid + ft / 2]} z={[z - 0.08, z + 0.08]} y={y} c={fc} />
      </group>
    );
  return (
    <group>
      <B z={x} x={[z - 0.03, z + 0.03]} y={y} {...glass} shadow={false} />
      <B z={x} x={[z - 0.08, z + 0.08]} y={[y[0], y[0] + ft]} c={fc} />
      <B z={x} x={[z - 0.08, z + 0.08]} y={[y[1] - ft, y[1]]} c={fc} />
      <B z={[x[0], x[0] + ft]} x={[z - 0.08, z + 0.08]} y={y} c={fc} />
      <B z={[x[1] - ft, x[1]]} x={[z - 0.08, z + 0.08]} y={y} c={fc} />
    </group>
  );
}

function Windows() {
  return (
    <Item id="windows">
      <Window x={[0.4, 5.1]} z={0.06} y={[0.5, 2.2]} />
      <Window x={[5.6, 7.5]} z={0.06} y={[0.5, 2.2]} />
      <Window x={[0.4, 2.2]} z={1.36} />
      <Window x={[5.7, 7.3]} z={1.36} />
      <Window x={[3.0, 4.6]} z={1.36} y={[0.05, 2.1]} />
      <Window x={[1.7, 3.0]} z={7.74} y={[0.9, 2.1]} axis="z" />
    </Item>
  );
}

function DoorPanel({ hinge, along, len = 0.8 }: { hinge: [number, number]; along: "x+" | "x-" | "z+" | "z-"; len?: number }) {
  const oak = useDone("carpentry");
  const c = oak ? "#c98b55" : "#dccdb2";
  const [hx, hz] = hinge;
  const x: [number, number] = along === "x+" ? [hx, hx + len] : along === "x-" ? [hx - len, hx] : [hx - 0.02, hx + 0.02];
  const z: [number, number] = along === "z+" ? [hz, hz + len] : along === "z-" ? [hz - len, hz] : [hz - 0.02, hz + 0.02];
  return (
    <group>
      <B x={x} z={z} y={[0, 2.05]} c={c} r={0.01} />
      <Cyl p={[along.startsWith("x") ? x[0] + (along === "x+" ? len - 0.08 : 0.08) : hx, 1.0, along.startsWith("z") ? z[0] + (along === "z+" ? len - 0.08 : 0.08) : hz]} r={0.03} h={0.08} c="#d8d8d8" metal={0.8} rough={0.3} />
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
      {/* 현관문 + 문패 */}
      <B x={[7.6, 7.72]} z={[4.15, 5.0]} y={[0, 2.1]} c="#556170" r={0.02} />
      <Cyl p={[7.58, 1.05, 4.25]} r={0.04} h={0.06} c="#e6c27a" metal={0.7} rough={0.3} />
      <B x={[7.56, 7.6]} z={[4.4, 4.75]} y={[1.6, 1.8]} c="#fff7e8" r={0.01} />
      {/* 웰컴 매트 */}
      <B x={[6.9, 7.5]} z={[4.3, 4.85]} y={[0.03, 0.05]} c="#d9b98c" r={0.01} />
    </Item>
  );
}

/* ───────────── 인테리어 ───────────── */

function Kitchen() {
  const wood = "#c98b55";
  const steel = "#c9ced2";
  return (
    <Item id="kitchen">
      {/* 동쪽 벽면 하부장 */}
      <B x={[4.8, 5.38]} z={[1.45, 3.75]} y={[0, 0.85]} c={wood} r={0.02} />
      <B x={[4.76, 5.4]} z={[1.42, 3.78]} y={[0.85, 0.9]} c={steel} metal={0.6} rough={0.35} />
      {/* 북쪽 하부장 */}
      <B x={[3.35, 4.8]} z={[1.45, 2.05]} y={[0, 0.85]} c={wood} r={0.02} />
      <B x={[3.32, 4.8]} z={[1.42, 2.08]} y={[0.85, 0.9]} c={steel} metal={0.6} rough={0.35} />
      {/* 스텐 백스플래시 */}
      <B x={[3.35, 5.38]} z={[1.43, 1.46]} y={[0.9, 1.35]} c={steel} metal={0.6} rough={0.35} />
      {/* 싱크 + 수전 */}
      <B x={[4.9, 5.25]} z={[2.6, 3.2]} y={[0.86, 0.91]} c="#9aa0a4" metal={0.8} rough={0.25} />
      <Cyl p={[5.3, 1.05, 2.9]} r={0.02} h={0.3} c="#d6d6d6" metal={0.9} rough={0.2} />
      {/* 쿡탑 */}
      <B x={[3.6, 4.2]} z={[1.55, 1.95]} y={[0.9, 0.92]} c="#2f3133" rough={0.2} />
      {/* 우드 후드 */}
      <B x={[3.6, 4.2]} z={[1.45, 1.9]} y={[1.55, 1.95]} c={wood} r={0.02} />
      <B x={[3.75, 4.05]} z={[1.45, 1.7]} y={[1.95, 2.4]} c={wood} />
      {/* 상부 화분 */}
      <Cyl p={[4.1, 2.03, 1.65]} r={0.06} h={0.12} c="#e8e0d2" />
      <mesh position={[4.1, 2.15, 1.65]} castShadow>
        <sphereGeometry args={[0.1, 10, 10]} />
        <M c="#6f8f5a" />
      </mesh>
    </Item>
  );
}

function Island() {
  return (
    <Item id="island">
      <B x={[3.2, 4.5]} z={[2.85, 3.55]} y={[0, 0.85]} c="#c98b55" r={0.02} />
      <B x={[3.15, 4.55]} z={[2.8, 3.6]} y={[0.85, 0.9]} c="#c9ced2" metal={0.6} rough={0.35} />
      <Cyl p={[3.6, 0.5, 3.57]} r={0.06} h={0.02} c="#c9ced2" metal={0.7} rough={0.3} />
      <Cyl p={[3.8, 0.5, 3.57]} r={0.06} h={0.02} c="#c9ced2" metal={0.7} rough={0.3} />
      {/* 커피 도구 */}
      <Cyl p={[4.2, 0.97, 3.15]} r={0.07} h={0.14} c="#f4f1ea" />
      <Cyl p={[3.5, 0.95, 3.1]} r={[0.07, 0.03]} h={0.09} c="#a9c1dd" />
    </Item>
  );
}

function Bath() {
  const tile = mosaic(4, 4);
  return (
    <Item id="bath">
      <B x={[0.12, 2.6]} z={[4.42, 5.9]} y={[0, 0.03]} c="#ffffff" map={terracotta(3, 2)} shadow={false} />
      {/* 모자이크 벽 */}
      <B x={[0.12, 2.6]} z={[4.42, 4.44]} y={[0, 2.2]} c="#ffffff" map={tile} shadow={false} />
      <B x={[2.58, 2.6]} z={[4.42, 5.9]} y={[0, 2.2]} c="#ffffff" map={tile} shadow={false} />
      <B x={[0.12, 0.14]} z={[4.42, 5.9]} y={[0, 0.55]} c="#ffffff" map={tile} shadow={false} />
      {/* 블랙 라인 띠 */}
      <B x={[0.12, 2.6]} z={[4.44, 4.46]} y={[1.0, 1.03]} c="#3a2e2e" shadow={false} />
      <B x={[0.12, 2.6]} z={[4.44, 4.46]} y={[1.12, 1.15]} c="#3a2e2e" shadow={false} />
      {/* 타일 선반 */}
      <B x={[0.12, 2.6]} z={[4.44, 4.62]} y={[1.15, 1.22]} c="#eef3ec" />
      {/* 벽걸이 세면대 + 수전 */}
      <B x={[1.4, 1.95]} z={[4.46, 4.9]} y={[0.75, 0.88]} c="#fbfbf8" r={0.04} />
      <Cyl p={[1.67, 0.98, 4.55]} r={0.015} h={0.2} c="#d6d6d6" metal={0.9} rough={0.2} />
      {/* 타원 거울 + 페니 타일 프레임 */}
      <B x={[1.3, 2.05]} z={[4.44, 4.47]} y={[1.3, 2.15]} c="#f7f6f1" />
      <mesh position={[1.675, 1.725, 4.48]} scale={[0.27, 0.36, 1]}>
        <circleGeometry args={[1, 40]} />
        <M c="#d9d2c4" rough={0.1} metal={0.5} />
      </mesh>
      {/* 변기 */}
      <B x={[0.45, 0.85]} z={[4.46, 4.65]} y={[0.4, 0.75]} c="#fbfbf8" r={0.04} />
      <B x={[0.47, 0.83]} z={[4.6, 5.1]} y={[0, 0.42]} c="#fbfbf8" r={0.08} />
      {/* 블랙 벽등 */}
      <Cyl p={[0.95, 1.75, 4.5]} r={[0.03, 0.05]} h={0.16} c="#fff6e0" emissive="#ffd9a0" />
    </Item>
  );
}

function Lights() {
  const pend = (x: number) => (
    <group key={x} position={[x, 0, 3.2]}>
      <Cyl p={[0, 2.25, 0]} r={0.005} h={0.3} c="#ffffff" />
      <Cyl p={[0, 2.08, 0]} r={[0.05, 0.16]} h={0.08} c="#fbfbf8" />
      <Cyl p={[0, 1.99, 0]} r={0.08} h={0.1} c="#fff3d6" emissive="#ffd9a0" />
    </group>
  );
  return (
    <Item id="lights">
      {[3.55, 4.15].map(pend)}
      {/* 주방 벽등 */}
      <B x={[5.38, 5.4]} z={[3.0, 3.25]} y={[1.6, 1.95]} c="#fff3d6" emissive="#ffd9a0" />
      {/* 거실 우드 벽등 */}
      <Cyl p={[3.68, 1.7, 7.6]} r={[0.1, 0.05]} h={0.18} c="#fff3d6" emissive="#ffd9a0" />
    </Item>
  );
}

function Sofa() {
  return (
    <Item id="sofa">
      {/* 러그 */}
      <B x={[4.6, 6.6]} z={[6.6, 8.6]} y={[0.02, 0.035]} c="#e9dfcd" r={0.01} shadow={false} />
      {/* 크림 소파 (동쪽 벽, 서쪽을 향함) */}
      <B x={[6.85, 7.65]} z={[6.4, 8.8]} y={[0, 0.42]} c="#ece3d3" r={0.12} />
      <B x={[7.35, 7.65]} z={[6.4, 8.8]} y={[0.4, 0.85]} c="#ece3d3" r={0.12} />
      <B x={[6.85, 7.6]} z={[6.4, 6.62]} y={[0.4, 0.62]} c="#ece3d3" r={0.08} />
      <B x={[6.85, 7.6]} z={[8.58, 8.8]} y={[0.4, 0.62]} c="#ece3d3" r={0.08} />
      <B x={[7.1, 7.35]} z={[7.0, 7.4]} y={[0.42, 0.72]} c="#c98b55" r={0.1} />
      {/* 원목 커피테이블 */}
      <Cyl p={[5.7, 0.2, 7.6]} r={0.4} h={0.4} c="#b97a47" />
    </Item>
  );
}

function Dining() {
  return (
    <Item id="dining">
      <Cyl p={[4.5, 0.36, 4.9]} r={0.06} h={0.72} c="#b97a47" />
      <Cyl p={[4.5, 0.73, 4.9]} r={0.55} h={0.04} c="#c98b55" />
      {[[3.8, 4.9], [5.2, 4.9]].map(([x, z]) => (
        <group key={x}>
          <B x={[x - 0.2, x + 0.2]} z={[z - 0.2, z + 0.2]} y={[0.42, 0.46]} c="#c98b55" r={0.02} />
          <B x={x < 4.5 ? [x - 0.2, x - 0.16] : [x + 0.16, x + 0.2]} z={[z - 0.2, z + 0.2]} y={[0.46, 0.85]} c="#c98b55" />
          <Cyl p={[x, 0.21, z]} r={0.03} h={0.42} c="#b97a47" />
        </group>
      ))}
    </Item>
  );
}

function Bed() {
  return (
    <Item id="bed">
      <B x={[0.5, 2.3]} z={[6.05, 8.2]} y={[0, 0.3]} c="#c98b55" r={0.04} />
      <B x={[0.55, 2.25]} z={[6.2, 8.15]} y={[0.3, 0.52]} c="#fbf8f2" r={0.08} />
      <B x={[0.5, 2.3]} z={[6.03, 6.15]} y={[0, 1.0]} c="#c98b55" r={0.03} />
      <B x={[0.7, 1.35]} z={[6.25, 6.6]} y={[0.5, 0.65]} c="#ffffff" r={0.06} />
      <B x={[1.45, 2.1]} z={[6.25, 6.6]} y={[0.5, 0.65]} c="#ffffff" r={0.06} />
      <B x={[0.55, 2.25]} z={[7.1, 8.17]} y={[0.5, 0.58]} c="#d9c7a7" r={0.04} />
      {/* 협탁 */}
      <B x={[2.45, 2.9]} z={[6.05, 6.45]} y={[0, 0.5]} c="#c98b55" r={0.03} />
    </Item>
  );
}

function Desk() {
  return (
    <Item id="desk">
      <B x={[5.9, 7.2]} z={[1.45, 2.05]} y={[0.7, 0.75]} c="#c98b55" r={0.02} />
      <B x={[5.92, 5.97]} z={[1.5, 2.0]} y={[0, 0.7]} c="#b97a47" />
      <B x={[7.13, 7.18]} z={[1.5, 2.0]} y={[0, 0.7]} c="#b97a47" />
      <B x={[6.3, 6.75]} z={[2.2, 2.6]} y={[0.42, 0.47]} c="#ece3d3" r={0.03} />
      <B x={[6.3, 6.75]} z={[2.55, 2.6]} y={[0.47, 0.85]} c="#ece3d3" r={0.02} />
      <Cyl p={[6.52, 0.21, 2.4]} r={0.03} h={0.42} c="#b97a47" />
      <Cyl p={[6.2, 0.85, 1.7]} r={[0.04, 0.09]} h={0.2} c="#fff3d6" emissive="#ffd9a0" />
    </Item>
  );
}

function Storage() {
  return (
    <Item id="storage">
      {/* 작은방 옷장 */}
      <B x={[0.2, 1.8]} z={[1.45, 2.05]} y={[0, 2.1]} c="#efe7da" r={0.02} />
      <B x={[0.99, 1.01]} z={[2.04, 2.06]} y={[0.1, 2.0]} c="#d8cdb9" />
      {/* 거실 낮은 수납장 */}
      <B x={[3.63, 4.05]} z={[6.6, 8.6]} y={[0, 0.55]} c="#c98b55" r={0.02} />
    </Item>
  );
}

function Appliances() {
  return (
    <Item id="appliances">
      {/* 냉장고 (화이트 빌트인) */}
      <B x={[2.75, 3.32]} z={[1.45, 2.1]} y={[0, 2.1]} c="#f6f4ef" r={0.03} />
      {/* 식기세척기 */}
      <B x={[4.78, 4.8]} z={[2.0, 2.6]} y={[0.05, 0.8]} c="#f6f4ef" />
      {/* 세탁기 (북쪽 발코니) */}
      <B x={[0.3, 0.95]} z={[0.25, 0.9]} y={[0, 0.85]} c="#f6f4ef" r={0.05} />
      <mesh position={[0.625, 0.5, 0.91]}>
        <circleGeometry args={[0.2, 24]} />
        <M c="#9fb3bf" rough={0.2} />
      </mesh>
      {/* 정수기 */}
      <B x={[5.05, 5.3]} z={[1.55, 1.85]} y={[0.9, 1.25]} c="#f6f4ef" r={0.03} />
    </Item>
  );
}

function Plant({ p, s = 1 }: { p: [number, number, number]; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.15, 0]} r={[0.14, 0.11]} h={0.3} c="#c47f58" />
      <mesh position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <M c="#6f8f5a" />
      </mesh>
      <mesh position={[0.1, 0.62, 0.05]} castShadow>
        <sphereGeometry args={[0.14, 12, 12]} />
        <M c="#80a068" />
      </mesh>
    </group>
  );
}

function Decor() {
  // 물결 우드 프레임 거울 (안방, 거실 벽 서쪽면)
  const beads = [];
  const w = 0.55;
  const h = 0.85;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    beads.push([-w / 2 + w * t, h / 2], [-w / 2 + w * t, -h / 2]);
  }
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    beads.push([-w / 2, -h / 2 + h * t], [w / 2, -h / 2 + h * t]);
  }
  return (
    <Item id="decor">
      <group position={[3.47, 1.45, 7.3]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[w, h]} />
          <M c="#dcd6cb" rough={0.1} metal={0.5} />
        </mesh>
        {beads.map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.02]} castShadow>
            <sphereGeometry args={[0.045, 10, 10]} />
            <M c="#a86a3c" />
          </mesh>
        ))}
      </group>
      <Plant p={[6.8, 0, 9.0]} s={1.2} />
      <Plant p={[0.6, 0, 9.9]} />
      <Plant p={[7.2, 0, 9.9]} s={0.9} />
      <Plant p={[2.9, 0, 6.3]} s={0.8} />
      <Plant p={[7.3, 0, 0.6]} />
      {/* 커튼 */}
      <B x={[4.0, 4.7]} z={[9.05, 9.15]} y={[0.05, 2.3]} c="#f3ece0" r={0.03} />
      <B x={[6.0, 6.7]} z={[9.05, 9.15]} y={[0.05, 2.3]} c="#f3ece0" r={0.03} />
      {/* 거실 액자 */}
      <B x={[7.66, 7.68]} z={[7.2, 7.9]} y={[1.2, 1.7]} c="#d9c7a7" />
    </Item>
  );
}

function Electric() {
  const on = useDone("electric");
  if (!on) return null;
  return (
    <group>
      {[[1.3, 2.8], [4.0, 2.4], [6.5, 2.6], [5.4, 7.4], [1.6, 7.6], [1.4, 5.1]].map(([x, z], i) => (
        <pointLight key={i} position={[x, 2.1, z]} intensity={0.9} distance={4} color="#ffd7a3" />
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
          {/* 폐기물 마대 */}
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
        <B x={[3.35, 3.85]} z={[-0.25, 0.25]} y={[-2.3, -2.0]} c="#c98b55" />
      </group>
    </group>
  );
}

/* ───────────── 씬 ───────────── */

export function House(props: SceneCtx) {
  return (
    <Ctx.Provider value={props}>
      <group position={[-CENTER[0], 0, -CENTER[2]]}>
        {/* 미니어처 받침 */}
        <mesh position={[3.9, -0.42, 5.35]} receiveShadow>
          <cylinderGeometry args={[9.6, 9.8, 0.24, 64]} />
          <meshStandardMaterial color="#e5dccb" roughness={1} />
        </mesh>
        <Foundation />
        <Walls />
        <Floors />
        <Windows />
        <Doors />
        <Keys />
        <Kitchen />
        <Island />
        <Bath />
        <Lights />
        <Sofa />
        <Dining />
        <Bed />
        <Desk />
        <Storage />
        <Appliances />
        <Decor />
        <Electric />
        <Construction />
      </group>
    </Ctx.Provider>
  );
}
