"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// 평면도(방3, 전용 62.35㎡) 기준 좌표, 단위 m. x: 서→동, z: 북→남
export const H = 2.4;
export const T = 0.12;
export const CENTER: [number, number, number] = [3.9, 0, 5.35];

// 톤: 버터 크림 바탕 + 세이지·하늘·라벤더·코코아. 빨강은 쓰지 않음
export const C = {
  wall: "#f6ecd2",
  wallRaw: "#bdb7ae",
  butter: "#f3d77e",
  butterSoft: "#f8e8ad",
  cream: "#fff8ea",
  white: "#fbfaf6",
  honey: "#c98b55",
  honeyDeep: "#a86a3c",
  birch: "#e6cc9f",
  birchDeep: "#d2b07c",
  walnut: "#7a5134",
  cherry: "#9a5b34",
  cocoa: "#6e4535",
  sage: "#a9c29a",
  green: "#3f7a4e",
  mint: "#bfe3c9",
  sky: "#a9c8ea",
  skySoft: "#cfe0f3",
  lavender: "#bcaee0",
  pink: "#f4b6c2",
  peach: "#f6b98a",
  cobalt: "#2f63c4",
  leaf: "#5e8a4f",
  chrome: "#d7dbde",
  black: "#2b2523",
  glow: "#ffd9a0",
};

export type RoomId = "living" | "kitchen" | "master" | "dress" | "study" | "bath" | "entrance";
export type Focus = RoomId | "me" | null;
export type Room = { name: string; x: [number, number]; z: [number, number]; items: string[]; mood: string };
export const ROOMS: Record<RoomId, Room> = {
  living: { name: "거실", x: [3.5, 7.8], z: [5.4, 9.3], items: ["sofa", "storage", "lights", "decor", "floor"], mood: "그린 체크 원목 소파, 토끼 쿠션, 블루 토끼 러그, 도트 암체어" },
  kitchen: { name: "주방·다이닝", x: [2.6, 5.5], z: [1.3, 5.9], items: ["kitchen", "island", "dining", "appliances", "lights"], mood: "버터 체커 타일, 레트로 냉장고, 세이지 식탁, 핑크 스트라이프 펜던트" },
  master: { name: "안방", x: [0, 3.6], z: [5.9, 9.3], items: ["bed", "appliances", "decor", "floor"], mood: "하늘색 이불, 도트 베개, 별 시계, 이동식 TV" },
  dress: { name: "드레스룸", x: [0, 2.7], z: [1.3, 4.4], items: ["storage", "decor"], mood: "자작나무 붙박이장, 파스텔 행거, 라벤더 도트" },
  study: { name: "취미방", x: [5.4, 7.8], z: [1.3, 4.0], items: ["desk", "storage", "decor"], mood: "반달 원목 책상, 재봉틀, 도트 페그보드, 귀여운 오브제 선반" },
  bath: { name: "욕실", x: [0, 2.7], z: [4.3, 6.0], items: ["bath", "lights"], mood: "세이지 모자이크, 페니 타일 액자 거울, 욕조" },
  entrance: { name: "현관", x: [6.2, 7.8], z: [3.9, 5.2], items: ["entrance", "keys"], mood: "버터 체커 바닥, 우드 유리 중문, 꽃" },
};
const ROOM_ORDER: RoomId[] = ["bath", "master", "dress", "study", "entrance", "kitchen", "living"];
export function roomAt(x: number, z: number): RoomId | null {
  return ROOM_ORDER.find((id) => {
    const r = ROOMS[id];
    return x >= r.x[0] && x <= r.x[1] && z >= r.z[0] && z <= r.z[1];
  }) ?? null;
}

/* ───────────── 씬 상태 ───────────── */

type ItemState = "done" | "ghost" | "hidden";
export type SceneCtx = { fraction: (id: string) => number; nextId: string | null; dream: boolean; focus: RoomId | null; onSelect: (id: string) => void };
export const Ctx = createContext<SceneCtx>({ fraction: () => 1, nextId: null, dream: true, focus: null, onSelect: () => {} });
const GhostCtx = createContext(false);

export function useItem(id: string): ItemState {
  const { fraction, nextId, dream } = useContext(Ctx);
  if (dream || fraction(id) >= 1) return "done";
  if (id === nextId) return "ghost";
  return "hidden";
}
export const useDone = (id: string) => useItem(id) === "done";
export const useF = (id: string) => {
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

export function Item({ id, children }: { id: string; children: ReactNode }) {
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

/* ───────────── 기본 도형 ───────────── */

export type MatProps = { c: string; map?: THREE.Texture; rough?: number; metal?: number; emissive?: string; glass?: boolean; side?: THREE.Side };
export function M({ c, map, rough = 0.8, metal = 0, emissive, glass, side }: MatProps) {
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

type V3 = [number, number, number];
type BoxProps = { x: [number, number]; y: [number, number]; z: [number, number]; r?: number; shadow?: boolean } & MatProps;
export function B({ x, y, z, r = 0, shadow = true, ...mat }: BoxProps) {
  const size: V3 = [x[1] - x[0], y[1] - y[0], z[1] - z[0]];
  const pos: V3 = [(x[0] + x[1]) / 2, (y[0] + y[1]) / 2, (z[0] + z[1]) / 2];
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

export function Cyl({ p, r, h, segs = 24, rot, theta, ...mat }: { p: V3; r: number | [number, number]; h: number; segs?: number; rot?: V3; theta?: number } & MatProps) {
  const [rt, rb] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[rt, rb, h, segs, 1, false, 0, theta ?? Math.PI * 2]} />
      <M {...mat} />
    </mesh>
  );
}

export function Ball({ p, r, s, ...mat }: { p: V3; r: number; s?: V3 } & MatProps) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[r, 16, 12]} />
      <M {...mat} />
    </mesh>
  );
}

export function Dome({ p, r, ...mat }: { p: V3; r: number } & MatProps) {
  return (
    <mesh position={p} castShadow>
      <sphereGeometry args={[r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <M side={THREE.DoubleSide} {...mat} />
    </mesh>
  );
}

export function Plane({ p, w, h, rotY = 0, flat = false, ...mat }: { p: V3; w: number; h: number; rotY?: number; flat?: boolean } & MatProps) {
  return (
    <mesh position={p} rotation={flat ? [-Math.PI / 2, 0, 0] : [0, rotY, 0]} receiveShadow>
      <planeGeometry args={[w, h]} />
      <M {...mat} />
    </mesh>
  );
}

// 바닥에 까는 원/타원 러그
export function Rug({ p, rx, rz, ...mat }: { p: [number, number]; rx: number; rz: number } & MatProps) {
  return (
    <mesh position={[p[0], 0.028, p[1]]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx, rz, 1]} receiveShadow>
      <circleGeometry args={[1, 40]} />
      <M {...mat} />
    </mesh>
  );
}

// 별 (두께 있는 오브제)
export function Star({ p, r, depth = 0.04, rot, ...mat }: { p: V3; r: number; depth?: number; rot?: V3 } & MatProps) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const rr = i % 2 ? r * 0.48 : r;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i) s.lineTo(x, y);
      else s.moveTo(x, y);
    }
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: r * 0.08, bevelThickness: r * 0.08, bevelSegments: 2 });
  }, [r, depth]);
  return (
    <mesh position={p} rotation={rot} geometry={geo} castShadow>
      <M {...mat} />
    </mesh>
  );
}

/* ───────────── 벽 ───────────── */

export type Wall = { x: [number, number]; z: [number, number]; max: number; outer?: boolean };
const low = 0.55;
export const WALLS = {
  north: { x: [0, 7.8], z: [0, T], max: H, outer: true },
  east: { x: [7.8 - T, 7.8], z: [0, 10.7], max: H, outer: true },
  west: { x: [0, T], z: [0, 10.7], max: low, outer: true },
  south: { x: [0, 7.8], z: [10.7 - T, 10.7], max: low, outer: true },
  z13: { x: [0, 7.8], z: [1.3, 1.3 + T], max: H },
  x26a: { x: [2.6, 2.6 + T], z: [1.3, 3.4], max: H },
  z43: { x: [0, 2.6 + T], z: [4.3, 4.3 + T], max: H },
  x26b: { x: [2.6, 2.6 + T], z: [4.3, 4.6], max: H },
  x26c: { x: [2.6, 2.6 + T], z: [5.4, 5.9], max: H },
  z59: { x: [0, 2.7], z: [5.9, 5.9 + T], max: H },
  x35: { x: [3.5, 3.5 + T], z: [5.9, 9.2], max: H },
  x54: { x: [5.4, 5.4 + T], z: [1.3, 3.9], max: H },
  z39: { x: [6.3, 7.8], z: [3.9, 3.9 + T], max: H },
  z92: { x: [0, 7.8], z: [9.2, 9.2 + T], max: low },
} satisfies Record<string, Wall>;
export type WallId = keyof typeof WALLS;

// 방에 집중하면 그 방의 북쪽·동쪽(뒷벽)만 남기고 나머지는 낮춤
export function isBackWall(w: Wall, r: Room) {
  const horizontal = w.x[1] - w.x[0] > w.z[1] - w.z[0];
  const overlap = (a: [number, number], b: [number, number]) => Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 0.1;
  if (horizontal) return Math.abs((w.z[0] + w.z[1]) / 2 - r.z[0]) < 0.2 && overlap(w.x, r.x);
  return Math.abs((w.x[0] + w.x[1]) / 2 - r.x[1]) < 0.2 && overlap(w.z, r.z);
}

// 벽에 걸린 것들: 벽이 낮아지면 같이 숨김
export function On({ wall, children }: { wall: WallId; children: ReactNode }) {
  const { focus } = useContext(Ctx);
  return focus && !isBackWall(WALLS[wall], ROOMS[focus]) ? null : <>{children}</>;
}

/* ───────────── 공용 오브제 ───────────── */

type FlowerKind = "gerbera" | "daisy" | "ball" | "tulip";
// 꽃병 + 꽃 (식물 대신 꽃)
export function Flowers({ p, s = 1, vase = "glass", kind = "gerbera", colors = [C.pink, C.pink, C.butter] }: { p: V3; s?: number; vase?: "glass" | "stripe" | "dot" | "pot" | "cobalt"; kind?: FlowerKind; colors?: string[] }) {
  const vaseColor = vase === "glass" ? "#dfeef0" : vase === "cobalt" ? C.cobalt : vase === "pot" ? "#d9a27a" : C.cream;
  const n = colors.length;
  return (
    <group position={p} scale={s}>
      {vase === "stripe" ? (
        <>
          <Cyl p={[0, 0.12, 0]} r={[0.07, 0.09]} h={0.24} c={C.cream} />
          {[0.05, 0.11, 0.17].map((y) => <Cyl key={y} p={[0, y, 0]} r={0.087} h={0.02} c={C.pink} />)}
        </>
      ) : vase === "dot" ? (
        <Cyl p={[0, 0.12, 0]} r={[0.07, 0.1]} h={0.24} c="#ffffff" map={undefined} />
      ) : (
        <Cyl p={[0, 0.12, 0]} r={[0.08, 0.07]} h={0.24} c={vaseColor} glass={vase === "glass"} />
      )}
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const lean = 0.07;
        const x = Math.cos(a) * lean;
        const z = Math.sin(a) * lean;
        const top = 0.42 + (i % 2) * 0.06;
        return (
          <group key={i}>
            <Cyl p={[x / 2, (0.2 + top) / 2, z / 2]} r={0.006} h={top - 0.2} rot={[z * 2, 0, -x * 2]} c={C.leaf} segs={5} />
            {kind === "ball" ? (
              <Ball p={[x, top, z]} r={0.07} c={colors[i]} />
            ) : kind === "tulip" ? (
              <Ball p={[x, top, z]} r={0.045} s={[1, 1.3, 1]} c={colors[i]} />
            ) : (
              <group position={[x, top, z]} rotation={[-0.5 + z * 3, 0, x * 3]}>
                <Cyl p={[0, 0, 0]} r={kind === "daisy" ? 0.05 : 0.065} h={0.012} segs={kind === "daisy" ? 10 : 14} c={colors[i]} />
                <Ball p={[0, 0.012, 0]} r={0.02} c={kind === "daisy" ? C.butter : "#8a6a3a"} />
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function MushroomLamp({ p, c = C.butter, s = 1, dots = true }: { p: V3; c?: string; s?: number; dots?: boolean }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.015, 0]} r={0.09} h={0.03} c={C.cream} />
      <Cyl p={[0, 0.16, 0]} r={[0.035, 0.05]} h={0.28} c={C.cream} />
      <Dome p={[0, 0.28, 0]} r={0.15} c={c} emissive="#ffd9a8" />
      {dots &&
        [[0.08, 0.32, 0.06], [-0.07, 0.34, 0.07], [0.0, 0.4, -0.08], [0.09, 0.33, -0.05], [-0.09, 0.31, -0.04]].map((d, i) => (
          <Ball key={i} p={d as V3} r={0.022} c="#ffffff" />
        ))}
    </group>
  );
}

// 토끼 쿠션 (얼굴 + 귀). 로컬 +z가 앞
export function BunnyCushion({ p, rot = 0, c = C.cream }: { p: V3; rot?: number; c?: string }) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Ball p={[0, 0.14, 0]} r={0.16} s={[1.1, 0.95, 0.45]} c={c} rough={1} />
      <Ball p={[-0.07, 0.33, 0]} r={0.06} s={[0.8, 1.9, 0.6]} c={c} rough={1} />
      <Ball p={[0.07, 0.33, 0]} r={0.06} s={[0.8, 1.9, 0.6]} c={c} rough={1} />
      <Ball p={[-0.05, 0.14, 0.07]} r={0.012} c={C.black} />
      <Ball p={[0.05, 0.14, 0.07]} r={0.012} c={C.black} />
    </group>
  );
}

// 벤트우드 체어 (둥근 좌판). 로컬 +z가 앞
export function BentwoodChair({ p, rot = 0, seat = C.sage, seatMap }: { p: V3; rot?: number; seat?: string; seatMap?: THREE.Texture }) {
  const w = C.birch;
  return (
    <group position={p} rotation={[0, rot, 0]}>
      {[[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].map(([x, z], i) => (
        <Cyl key={i} p={[x, 0.22, z]} r={0.02} h={0.44} c={w} segs={8} />
      ))}
      <Cyl p={[0, 0.45, 0]} r={0.21} h={0.04} c={w} />
      <Cyl p={[0, 0.48, 0]} r={0.2} h={0.03} c={seatMap ? "#ffffff" : seat} map={seatMap} />
      <Cyl p={[0, 0.7, -0.03]} r={0.2} h={0.08} theta={Math.PI} rot={[0, Math.PI / 2, 0]} c={w} />
      {[-0.17, 0.17].map((x) => <Cyl key={x} p={[x, 0.6, -0.12]} r={0.018} h={0.22} c={w} segs={8} />)}
    </group>
  );
}
