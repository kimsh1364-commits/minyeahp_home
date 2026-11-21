"use client";

import { useContext, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  B, Ball, BentwoodChair, BunnyCushion, C, Ctx, Cyl, Dome, Flowers, Item, M, MushroomLamp, On, Plane, Rug, Star,
  WALLS, isBackWall, useDone, useF, type SceneCtx, type Wall, type WallId, ROOMS, CENTER, H,
} from "./kit";
import { argyle, bunnyRug, checker, dots, gingham, mosaic, oakFloor, patchwork, penny, pinkStripe, plaid } from "./textures";
import { ME, Me } from "./Me";

export { CENTER, ROOMS };
export type { RoomId } from "./kit";

/* ───────────── 구조 ───────────── */

function Walls() {
  const { focus } = useContext(Ctx);
  const outerF = useF("outerWalls");
  const innerF = useF("innerWalls");
  const color = useDone("wallpaper") ? C.wall : C.wallRaw;
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
  const f = { c: "#ffffff", map: oakFloor(2, 2), shadow: false } as const;
  const terra = checker("#d9a27a", "#e8c09a", 4, 8, 1);
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
        <B x={[0.1, 7.7]} z={[0.12, 1.3]} y={[0, 0.03]} c="#ffffff" map={terra} shadow={false} />
        <B x={[0.1, 7.7]} z={[9.3, 10.6]} y={[0, 0.03]} c="#ffffff" map={terra} shadow={false} />
      </Item>
    </>
  );
}

function Window({ x, z, y = [0.9, 2.1], axis = "x" }: { x: [number, number]; z: number; y?: [number, number]; axis?: "x" | "z" }) {
  const sash = useDone("sash");
  const fc = sash ? C.white : "#8f8f8f";
  const ft = sash ? 0.07 : 0.035;
  const mid = (x[0] + x[1]) / 2;
  const zz: [number, number] = [z - 0.08, z + 0.08];
  const P = (a: [number, number], b: [number, number], yy: [number, number], extra: object = {}) =>
    axis === "x" ? <B x={a} z={b} y={yy} c={fc} {...extra} /> : <B z={a} x={b} y={yy} c={fc} {...extra} />;
  return (
    <group>
      {P(x, [z - 0.03, z + 0.03], y, { c: "#cfe6ef", glass: true, shadow: false })}
      {P(x, zz, [y[0], y[0] + ft])}
      {P(x, zz, [y[1] - ft, y[1]])}
      {P([x[0], x[0] + ft], zz, y)}
      {P([x[1] - ft, x[1]], zz, y)}
      {P([mid - ft / 2, mid + ft / 2], zz, y)}
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
  const c = useDone("carpentry") ? C.birch : "#dccdb2";
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
      <DoorPanel hinge={[2.66, 5.4]} along="x-" len={0.7} />
      <DoorPanel hinge={[2.75, 5.95]} along="z+" len={0.75} />
      <DoorPanel hinge={[6.3, 3.96]} along="x-" />
    </Item>
  );
}

function Keys() {
  return (
    <Item id="keys">
      <On wall="east">
        <B x={[7.6, 7.72]} z={[4.15, 5.0]} y={[0, 2.1]} c={C.butter} r={0.02} />
        <Ball p={[7.57, 1.05, 4.25]} r={0.04} c="#c9a24a" metal={0.7} rough={0.3} />
        <Star p={[7.6, 1.62, 4.58]} r={0.12} rot={[0, -Math.PI / 2, 0]} c={C.cream} />
      </On>
      <B x={[6.9, 7.5]} z={[4.3, 4.85]} y={[0.03, 0.05]} c="#ffffff" map={dots(C.sky, C.white, 4, 2, 2)} r={0.01} />
    </Item>
  );
}

/* ───────────── 주방·다이닝: 버터 체커 + 레트로 ───────────── */

function Kitchen() {
  const steel = { c: C.chrome, metal: 0.6, rough: 0.35 } as const;
  const tile = checker(C.butter, C.cream, 8, 4, 1);
  return (
    <Item id="kitchen">
      <B x={[4.8, 5.38]} z={[1.45, 3.75]} y={[0, 0.85]} c={C.honey} r={0.02} />
      {[1.9, 2.5, 3.3].map((z) => <B key={z} x={[4.78, 4.8]} z={[z - 0.15, z + 0.15]} y={[0.74, 0.77]} c={C.honeyDeep} />)}
      <B x={[4.76, 5.4]} z={[1.42, 3.78]} y={[0.85, 0.9]} {...steel} />
      <B x={[3.35, 4.8]} z={[1.45, 2.05]} y={[0, 0.85]} c={C.honey} r={0.02} />
      <B x={[3.32, 4.8]} z={[1.42, 2.08]} y={[0.85, 0.9]} {...steel} />
      <On wall="z13">
        <Plane p={[4.36, 1.2, 1.431]} w={2.02} h={0.6} c="#ffffff" map={tile} />
        <B x={[3.6, 4.2]} z={[1.45, 1.9]} y={[1.55, 1.95]} c={C.honey} r={0.02} />
        <B x={[3.75, 4.05]} z={[1.45, 1.7]} y={[1.95, 2.4]} c={C.honey} />
      </On>
      <B x={[4.9, 5.25]} z={[2.6, 3.2]} y={[0.86, 0.91]} c="#9aa0a4" metal={0.8} rough={0.25} />
      <Cyl p={[5.3, 1.05, 2.9]} r={0.02} h={0.3} c={C.chrome} metal={0.9} rough={0.2} />
      <B x={[3.6, 4.2]} z={[1.55, 1.95]} y={[0.9, 0.92]} c="#2f3133" rough={0.2} />
      {/* 하늘색 법랑 냄비 + 주전자 */}
      <Cyl p={[3.75, 0.99, 1.75]} r={0.12} h={0.15} c={C.sky} rough={0.35} />
      <Cyl p={[3.75, 1.075, 1.75]} r={0.125} h={0.02} c={C.sky} rough={0.35} />
      <Ball p={[3.75, 1.1, 1.75]} r={0.02} c={C.white} />
      <Ball p={[4.05, 0.99, 1.72]} r={0.08} s={[1, 0.85, 1]} c={C.mint} rough={0.3} />
      <On wall="x54">
        <Plane p={[5.399, 1.2, 2.6]} w={2.3} h={0.6} rotY={-Math.PI / 2} c="#ffffff" map={tile} />
        <B x={[5.12, 5.38]} z={[2.0, 3.5]} y={[1.7, 1.74]} c={C.honeyDeep} />
        {[[C.peach, 2.15], [C.butter, 2.35], [C.sage, 2.55]].map(([c, z]) => (
          <Cyl key={z as number} p={[5.25, 1.82, z as number]} r={0.06} h={0.16} c={c as string} />
        ))}
        {[[2.85, C.pink], [3.0, C.sky], [3.15, C.butter]].map(([z, c]) => (
          <Cyl key={z as number} p={[5.3, 1.86, z as number]} r={0.1} h={0.02} rot={[Math.PI / 2, 0, 0]} c={c as string} />
        ))}
        <B x={[5.38, 5.4]} z={[3.5, 3.7]} y={[1.6, 1.9]} c="#fff3d6" emissive={C.glow} />
      </On>
      <Flowers p={[4.45, 0.9, 1.7]} s={0.7} kind="daisy" colors={[C.white, C.white, C.white, C.white]} vase="stripe" />
    </Item>
  );
}

function Island() {
  return (
    <Item id="island">
      <B x={[3.2, 4.5]} z={[2.85, 3.55]} y={[0, 0.85]} c={C.honey} r={0.02} />
      <B x={[3.15, 4.55]} z={[2.8, 3.6]} y={[0.85, 0.9]} c={C.chrome} metal={0.6} rough={0.35} />
      <Cyl p={[3.55, 0.94, 3.2]} r={[0.17, 0.1]} h={0.08} c={C.cream} />
      <Ball p={[3.5, 1.0, 3.18]} r={0.06} c="#f0a24a" />
      <Ball p={[3.61, 1.0, 3.24]} r={0.06} c="#f0a24a" />
      <Ball p={[3.56, 1.04, 3.12]} r={0.055} c={C.butter} />
      <Cyl p={[4.2, 0.97, 3.15]} r={0.07} h={0.14} c="#ffffff" map={dots(C.white, C.cocoa, 3, 2, 1)} />
    </Item>
  );
}

// 레퍼런스: 세이지 상판 + 자작 프레임 식탁, 벤트우드 체어, 도트 스툴
function Dining() {
  return (
    <Item id="dining">
      {[[4.08, 4.68], [4.92, 4.68], [4.08, 5.32], [4.92, 5.32]].map(([x, z], i) => (
        <B key={i} x={[x - 0.03, x + 0.03]} z={[z - 0.03, z + 0.03]} y={[0, 0.7]} c={C.birch} />
      ))}
      <B x={[4.02, 4.98]} z={[4.62, 5.38]} y={[0.7, 0.75]} c={C.birch} r={0.01} />
      <B x={[4.06, 4.94]} z={[4.66, 5.34]} y={[0.75, 0.755]} c={C.sage} shadow={false} />
      <Flowers p={[4.5, 0.755, 5.0]} s={0.75} kind="gerbera" colors={[C.pink, C.pink, "#f7a8c0", C.pink, C.butter]} />
      <Cyl p={[4.75, 0.8, 5.15]} r={0.04} h={0.09} c={C.cream} />
      <BentwoodChair p={[3.72, 0, 5.0]} rot={Math.PI / 2} seat={C.sage} seatMap={dots(C.sage, "#d9ead0", 4, 1, 1)} />
      <BentwoodChair p={[4.5, 0, 5.72]} rot={Math.PI} seat={C.sky} />
      {/* 도트 스툴 */}
      <group position={[5.25, 0, 5.0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return <Cyl key={i} p={[Math.cos(a) * 0.13, 0.22, Math.sin(a) * 0.13]} r={0.02} h={0.44} c={C.cocoa} segs={8} />;
        })}
        <Cyl p={[0, 0.46, 0]} r={0.18} h={0.05} c="#ffffff" map={dots(C.cocoa, C.white, 4, 2, 1)} />
      </group>
    </Item>
  );
}

/* ───────────── 욕실 (그대로 유지) ───────────── */

function Bath() {
  const zF = 4.425;
  return (
    <Item id="bath">
      <B x={[0.12, 2.6]} z={[4.42, 5.9]} y={[0, 0.03]} c="#ffffff" map={checker("#efe8da", "#ddd3c1", 6, 3, 2)} shadow={false} />
      <On wall="z43">
        <Plane p={[1.36, 1.1, zF]} w={2.48} h={2.2} c="#ffffff" map={mosaic(5, 4)} />
        <Plane p={[1.36, 0.93, zF + 0.002]} w={2.48} h={0.13} c="#ffffff" map={penny(10, 1)} />
        <B x={[0.12, 2.6]} z={[zF, zF + 0.006]} y={[0.86, 0.875]} c={C.black} shadow={false} />
        <B x={[0.12, 2.6]} z={[zF, zF + 0.006]} y={[0.985, 1.0]} c={C.black} shadow={false} />
        <B x={[0.12, 2.6]} z={[zF, 4.6]} y={[1.0, 1.08]} c="#ffffff" map={mosaic(12, 1)} />
        <Plane p={[1.47, 1.72, zF + 0.002]} w={0.86} h={1.0} c="#ffffff" map={penny(3, 4)} />
        <B x={[1.04, 1.9]} z={[zF, zF + 0.008]} y={[2.2, 2.22]} c={C.black} shadow={false} />
        <B x={[1.04, 1.9]} z={[zF, zF + 0.008]} y={[1.22, 1.24]} c={C.black} shadow={false} />
        <B x={[1.03, 1.05]} z={[zF, zF + 0.008]} y={[1.22, 2.22]} c={C.black} shadow={false} />
        <B x={[1.89, 1.91]} z={[zF, zF + 0.008]} y={[1.22, 2.22]} c={C.black} shadow={false} />
        <mesh position={[1.47, 1.72, zF + 0.01]} scale={[0.24, 0.36, 1]}>
          <circleGeometry args={[1, 40]} />
          <M c="#e4ddd0" rough={0.05} metal={0.6} />
        </mesh>
        <Cyl p={[0.7, 1.35, 4.47]} r={0.02} h={0.22} c={C.chrome} metal={0.9} rough={0.2} />
        <Cyl p={[0.7, 1.48, 4.5]} r={[0.05, 0.03]} h={0.06} c={C.chrome} metal={0.9} rough={0.2} />
        <Cyl p={[0.95, 1.85, 4.48]} r={[0.035, 0.05]} h={0.16} c="#fff6e0" emissive={C.glow} />
        <Dome p={[0.95, 1.92, 4.48]} r={0.045} c={C.black} />
        <B x={[2.2, 2.55]} z={[zF, 4.45]} y={[1.5, 1.53]} c={C.black} />
        <Flowers p={[2.3, 1.08, 4.52]} s={0.45} kind="tulip" colors={[C.butter, C.white, C.butter]} />
      </On>
      <B x={[1.2, 1.76]} z={[4.44, 4.88]} y={[0.68, 0.82]} c={C.white} r={0.05} />
      <Cyl p={[1.48, 0.9, 4.52]} r={0.016} h={0.18} c={C.chrome} metal={0.9} rough={0.2} />
      <Cyl p={[1.48, 0.45, 4.6]} r={0.03} h={0.45} c={C.chrome} metal={0.9} rough={0.2} />
      <B x={[0.14, 0.92]} z={[4.44, 5.88]} y={[0, 0.55]} c="#efe4cf" r={0.03} />
      <B x={[0.22, 0.84]} z={[4.52, 5.8]} y={[0.5, 0.56]} c={C.white} r={0.04} />
      <B x={[0.27, 0.79]} z={[4.57, 5.75]} y={[0.52, 0.565]} c="#dbe9ec" shadow={false} />
      <B x={[2.05, 2.45]} z={[4.44, 4.63]} y={[0.4, 0.75]} c={C.white} r={0.04} />
      <B x={[2.07, 2.43]} z={[4.58, 5.08]} y={[0, 0.42]} c={C.white} r={0.08} />
      <Rug p={[1.5, 5.4]} rx={0.4} rz={0.28} c="#ffffff" map={dots(C.butter, C.white, 4, 2, 2)} />
    </Item>
  );
}

/* ───────────── 거실: 그린 체크 + 토끼 + 코발트 ───────────── */

function Sofa() {
  const pl = plaid(3, 2);
  const w = C.cherry;
  return (
    <Item id="sofa">
      {/* 블루 토끼 타원 러그 */}
      <mesh position={[5.55, 0.03, 7.6]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} scale={[1.15, 0.8, 1]} receiveShadow>
        <circleGeometry args={[1, 48]} />
        <M c="#ffffff" map={bunnyRug()} />
      </mesh>
      {/* 원목 프레임 + 그린 체크 쿠션 소파 (동쪽 벽, 서쪽을 향함) */}
      <B x={[6.8, 7.66]} z={[6.35, 8.85]} y={[0.12, 0.3]} c={w} r={0.02} />
      {[6.4, 8.8].map((z) => [6.86, 7.6].map((x) => <B key={`${x}-${z}`} x={[x - 0.04, x + 0.04]} z={[z - 0.04, z + 0.04]} y={[0, 0.14]} c={w} />))}
      <B x={[6.82, 7.5]} z={[6.4, 8.8]} y={[0.3, 0.5]} c="#ffffff" map={pl} r={0.06} />
      <B x={[7.36, 7.56]} z={[6.4, 8.8]} y={[0.48, 1.0]} c="#ffffff" map={pl} r={0.06} />
      <B x={[7.56, 7.67]} z={[6.33, 8.87]} y={[0.12, 1.08]} c={w} r={0.02} />
      {[6.33, 8.81].map((z) => <B key={z} x={[6.85, 7.67]} z={[z, z + 0.06]} y={[0.12, 0.62]} c={w} r={0.02} />)}
      {/* 토끼 쿠션 */}
      <BunnyCushion p={[7.2, 0.5, 7.25]} rot={-Math.PI / 2} c={C.cream} />
      <BunnyCushion p={[7.2, 0.5, 7.95]} rot={-Math.PI / 2} c="#e3c08f" />
      {/* 민트 원형 스툴 (사이드테이블) + 도트 피처 꽃병 */}
      <group position={[6.55, 0, 6.05]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2 + 0.4;
          return <Cyl key={i} p={[Math.cos(a) * 0.14, 0.22, Math.sin(a) * 0.14]} r={0.022} h={0.44} c={C.birch} segs={8} />;
        })}
        <Cyl p={[0, 0.46, 0]} r={0.2} h={0.04} c={C.mint} />
        <Flowers p={[0, 0.48, 0]} s={0.8} kind="ball" vase="dot" colors={["#7fae5c", "#8dbb68", "#7fae5c"]} />
      </group>
      {/* 블루 위빙 스툴 + 유리 꽃병 */}
      <group position={[6.55, 0, 9.0]}>
        {[[-0.14, -0.1], [0.14, -0.1], [-0.14, 0.1], [0.14, 0.1]].map(([x, z], i) => (
          <B key={i} x={[x - 0.02, x + 0.02]} z={[z - 0.02, z + 0.02]} y={[0, 0.4]} c={C.birch} />
        ))}
        <B x={[-0.17, 0.17]} z={[-0.13, 0.13]} y={[0.4, 0.45]} c={C.cobalt} r={0.01} />
        <Flowers p={[0, 0.45, 0]} s={0.85} kind="daisy" colors={[C.white, C.pink, C.white, C.pink, C.white]} />
      </group>
    </Item>
  );
}

function Storage() {
  return (
    <Item id="storage">
      {/* 드레스룸: 자작나무 붙박이장 */}
      <B x={[0.2, 1.8]} z={[1.45, 2.05]} y={[0, 2.1]} c={C.birch} r={0.02} />
      {[0.73, 1.27].map((x) => <B key={x} x={[x - 0.005, x + 0.005]} z={[2.05, 2.06]} y={[0.05, 2.05]} c={C.birchDeep} />)}
      {[0.67, 0.79, 1.21, 1.33].map((x) => <Cyl key={x} p={[x, 1.05, 2.07]} r={0.025} h={0.03} rot={[Math.PI / 2, 0, 0]} c={C.birchDeep} />)}
      {/* 파스텔 행거 */}
      <B x={[0.35, 0.39]} z={[3.48, 3.52]} y={[0, 1.6]} c={C.white} />
      <B x={[1.86, 1.9]} z={[3.48, 3.52]} y={[0, 1.6]} c={C.white} />
      <Cyl p={[1.12, 1.58, 3.5]} r={0.015} h={1.55} rot={[0, 0, Math.PI / 2]} c={C.white} />
      {[[0.55, C.lavender, 1.0], [0.8, C.butter, 0.85], [1.05, C.sky, 1.05], [1.3, C.mint, 0.9], [1.55, C.cream, 0.8]].map(([x, c, h]) => (
        <B key={x as number} x={[(x as number) - 0.1, (x as number) + 0.1]} z={[3.42, 3.58]} y={[1.55 - (h as number), 1.52]} c={c as string} r={0.04} />
      ))}
      {/* 거실: 월넛 장식장 + 오브제 */}
      <B x={[3.63, 4.1]} z={[6.6, 8.6]} y={[0.06, 0.6]} c={C.walnut} r={0.02} />
      {[7.1, 7.6, 8.1].map((z) => <Ball key={z} p={[4.11, 0.35, z]} r={0.02} c="#d8b98a" />)}
      <B x={[3.68, 3.74]} z={[6.95, 7.45]} y={[0.6, 1.1]} c={C.walnut} />
      <B x={[3.74, 3.75]} z={[7.0, 7.4]} y={[0.65, 1.05]} c="#ffffff" map={patchwork()} shadow={false} />
      <Cyl p={[3.85, 0.68, 8.2]} r={0.07} h={0.16} c="#ffffff" map={dots(C.butter, C.white, 3, 2, 1)} />
      <BunnyCushion p={[3.88, 0.6, 7.7]} rot={Math.PI / 2} c={C.white} />
      {/* 취미방: 화이트 오픈 선반 + 귀여운 오브제 */}
      <B x={[7.36, 7.68]} z={[1.6, 3.6]} y={[0, 1.8]} c={C.white} />
      {[0.45, 0.9, 1.35].map((y) => <B key={y} x={[7.36, 7.4]} z={[1.62, 3.58]} y={[y - 0.02, y]} c={C.white} />)}
      <MushroomLamp p={[7.5, 1.35, 1.9]} c={C.peach} s={0.6} />
      <BunnyCushion p={[7.52, 0.9, 2.6]} rot={-Math.PI / 2} c={C.lavender} />
      <Ball p={[7.5, 0.98, 3.2]} r={0.08} c={C.butter} />
      <Star p={[7.55, 0.47, 2.0]} r={0.1} rot={[0, -Math.PI / 2, 0]} c={C.sky} />
      {[2.6, 2.8, 3.0].map((z, i) => <B key={z} x={[7.42, 7.6]} z={[z - 0.08, z + 0.08]} y={[0.45, 0.62]} c={[C.pink, C.mint, C.butter][i]} r={0.02} />)}
      <Ball p={[7.5, 0.06, 3.2]} r={0.1} c={C.white} />
    </Item>
  );
}

function Appliances() {
  const screen = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!screen.current) return;
    if (ME.activity === "tv") {
      const h = (clock.elapsedTime * 0.15) % 1;
      screen.current.emissive.setHSL(h, 0.5, 0.55);
      screen.current.emissiveIntensity = 0.9;
    } else screen.current.emissiveIntensity = 0;
  });
  return (
    <Item id="appliances">
      {/* 레트로 버터 냉장고 */}
      <B x={[2.75, 3.32]} z={[1.45, 2.1]} y={[0.05, 1.85]} c={C.butterSoft} r={0.12} />
      <B x={[3.0, 3.06]} z={[2.1, 2.13]} y={[1.2, 1.55]} c={C.chrome} metal={0.8} rough={0.3} />
      <B x={[2.77, 3.3]} z={[2.09, 2.11]} y={[1.3, 1.31]} c="#e4cf8e" shadow={false} />
      <Star p={[2.9, 1.65, 2.11]} r={0.05} c={C.sky} />
      <B x={[4.78, 4.8]} z={[2.0, 2.45]} y={[0.05, 0.8]} c={C.cream} />
      {/* 세탁기 */}
      <B x={[0.3, 0.95]} z={[0.25, 0.9]} y={[0, 0.85]} c={C.cream} r={0.05} />
      <mesh position={[0.625, 0.5, 0.91]}>
        <circleGeometry args={[0.2, 24]} />
        <M c="#9fb3bf" rough={0.2} />
      </mesh>
      {/* 안방 이동식 TV (바퀴 스탠드) — 침대를 향함 */}
      <group position={[1.6, 0, 8.85]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <group key={i}>
              <B x={[-0.015, 0.015]} z={[0, 0.25]} y={[0.04, 0.07]} c={C.white} />
              <Ball p={[Math.sin(a) * 0.25, 0.03, Math.cos(a) * 0.25]} r={0.03} c="#9b9b9b" />
            </group>
          );
        })}
        <Cyl p={[0, 0.06, 0]} r={0.26} h={0.03} c={C.white} />
        <Cyl p={[0, 0.6, 0]} r={0.025} h={1.1} c={C.white} />
        <B x={[-0.42, 0.42]} z={[-0.05, 0.0]} y={[0.95, 1.45]} c={C.white} r={0.03} />
        <mesh position={[0, 1.2, -0.052]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.78, 0.44]} />
          <meshStandardMaterial ref={screen} color="#2c3138" roughness={0.25} emissive="#000000" />
        </mesh>
      </group>
    </Item>
  );
}

function Lights() {
  return (
    <Item id="lights">
      {/* 아일랜드: 버터 돔 펜던트 */}
      {[3.55, 4.15].map((x) => (
        <group key={x} position={[x, 0, 3.2]}>
          <Cyl p={[0, 2.25, 0]} r={0.005} h={0.3} c={C.white} />
          <Dome p={[0, 1.98, 0]} r={0.16} c={C.butter} />
          <Ball p={[0, 1.97, 0]} r={0.06} c="#fff3d6" emissive={C.glow} />
        </group>
      ))}
      {/* 식탁: 핑크 스트라이프 드럼 펜던트 */}
      <Cyl p={[4.5, 2.1, 5.0]} r={0.005} h={0.6} c={C.black} />
      <mesh position={[4.5, 1.68, 5.0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.24, 28, 1, true]} />
        <M c="#ffffff" map={pinkStripe()} side={THREE.DoubleSide} emissive="#ffd6d6" />
      </mesh>
      {/* 거실 플리츠 스탠드 */}
      <group position={[4.35, 0, 9.0]}>
        <Cyl p={[0, 0.02, 0]} r={0.14} h={0.04} c={C.walnut} />
        <Cyl p={[0, 0.75, 0]} r={0.015} h={1.5} c="#c9a24a" metal={0.6} rough={0.3} />
        <Cyl p={[0, 1.55, 0]} r={[0.12, 0.22]} h={0.3} segs={14} c={C.cream} emissive="#ffe2b0" />
      </group>
      {/* 안방 민트 콘 램프 */}
      <group position={[2.7, 0.5, 6.25]}>
        <Ball p={[0, 0.08, 0]} r={0.07} s={[1, 1.2, 1]} c={C.cream} />
        <Cyl p={[0, 0.25, 0]} r={[0.06, 0.15]} h={0.16} c={C.mint} emissive="#e8ffe0" />
      </group>
      <MushroomLamp p={[6.15, 0.75, 1.65]} c={C.peach} s={0.85} />
    </Item>
  );
}

/* ───────────── 안방: 하늘색 + 별 + 도트 ───────────── */

function Bed() {
  return (
    <Item id="bed">
      <B x={[0.3, 2.7]} z={[7.5, 9.1]} y={[0.02, 0.035]} c="#ffffff" map={argyle(3, 2)} shadow={false} />
      {/* 낮은 자작 프레임 + 핑크 체크 시트 */}
      <B x={[0.55, 2.35]} z={[6.1, 8.25]} y={[0.04, 0.24]} c={C.birch} r={0.06} />
      <B x={[0.55, 2.35]} z={[6.05, 6.14]} y={[0, 0.75]} c={C.birch} r={0.04} />
      <B x={[0.6, 2.3]} z={[6.18, 8.2]} y={[0.24, 0.44]} c="#ffffff" map={gingham(4, 4, "rgba(244,182,194,0.5)")} r={0.05} />
      {/* 하늘색 이불 (뭉실) */}
      <B x={[0.62, 2.32]} z={[6.9, 8.24]} y={[0.4, 0.56]} c={C.skySoft} r={0.07} />
      <Ball p={[1.2, 0.56, 7.4]} r={0.32} s={[1.2, 0.35, 1]} c={C.skySoft} />
      <Ball p={[1.8, 0.55, 7.8]} r={0.3} s={[1.1, 0.3, 1]} c={C.skySoft} />
      {/* 베개: 그린 + 도트 */}
      <B x={[0.72, 1.38]} z={[6.22, 6.62]} y={[0.42, 0.62]} c={C.sage} r={0.08} />
      <B x={[1.52, 2.18]} z={[6.22, 6.62]} y={[0.42, 0.62]} c="#ffffff" map={dots(C.white, C.cocoa, 5, 1, 1)} r={0.08} />
      {/* 곰 인형 */}
      <group position={[1.85, 0.6, 6.75]}>
        <Ball p={[0, 0.05, 0]} r={0.08} c={C.cream} />
        <Ball p={[0, 0.17, 0]} r={0.065} c={C.cream} />
        <Ball p={[-0.045, 0.23, 0]} r={0.025} c={C.cream} />
        <Ball p={[0.045, 0.23, 0]} r={0.025} c={C.cream} />
      </group>
      {/* 플로팅 협탁 선반 */}
      <B x={[2.45, 2.95]} z={[6.03, 6.45]} y={[0.46, 0.5]} c={C.birch} />
      {/* 별 방석 */}
      <Cyl p={[3.05, 0.05, 8.55]} r={0.32} h={0.1} c={C.cocoa} />
      <Star p={[3.05, 0.105, 8.55]} r={0.18} depth={0.005} rot={[-Math.PI / 2, 0, 0]} c={C.cream} />
    </Item>
  );
}

/* ───────────── 취미방: 반달 책상 + 재봉틀 + 도트 ───────────── */

function Desk() {
  return (
    <Item id="desk">
      {/* 반달 원목 책상 */}
      <Cyl p={[6.55, 0.72, 1.44]} r={0.62} h={0.04} theta={Math.PI} rot={[0, -Math.PI / 2, 0]} segs={32} c={C.birch} />
      <B x={[6.52, 6.58]} z={[1.5, 1.9]} y={[0, 0.7]} c={C.birchDeep} />
      <B x={[6.25, 6.85]} z={[1.68, 1.72]} y={[0.02, 0.08]} c={C.birchDeep} />
      {/* 재봉틀 */}
      <group position={[6.75, 0.74, 1.62]}>
        <B x={[-0.18, 0.18]} y={[0, 0.06]} z={[-0.09, 0.09]} c={C.white} r={0.02} />
        <B x={[0.08, 0.18]} y={[0.06, 0.24]} z={[-0.08, 0.08]} c={C.white} r={0.03} />
        <B x={[-0.16, 0.18]} y={[0.2, 0.28]} z={[-0.07, 0.07]} c={C.white} r={0.03} />
        <B x={[0.1, 0.16]} y={[0.1, 0.2]} z={[0.081, 0.083]} c={C.sky} />
      </group>
      <Cyl p={[6.25, 0.79, 1.7]} r={0.05} h={0.1} c="#ffffff" map={dots(C.white, C.sage, 3, 2, 1)} />
      <BentwoodChair p={[6.5, 0, 2.35]} rot={Math.PI} seat={C.sage} seatMap={dots(C.sage, "#d9ead0", 4, 1, 1)} />
      <On wall="z13">
        {/* 도트 페그보드 + 하트·별 */}
        <B x={[5.95, 6.95]} z={[1.42, 1.44]} y={[1.05, 1.7]} c="#ffffff" map={dots(C.white, "#3b3b3b", 10, 1, 1)} />
        <Star p={[6.15, 1.55, 1.45]} r={0.07} depth={0.01} c={C.sage} />
        <Ball p={[6.7, 1.25, 1.45]} r={0.05} s={[1, 1, 0.3]} c={C.pink} />
        {/* 노란 별 시계 */}
        <Star p={[7.2, 1.85, 1.43]} r={0.12} c={C.butter} />
      </On>
      {/* 데이지 방석 */}
      <group position={[7.0, 0.04, 3.15]}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <Ball key={i} p={[Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17]} r={0.1} s={[1, 0.4, 1]} c={C.white} />;
        })}
        <Ball p={[0, 0.02, 0]} r={0.11} s={[1, 0.45, 1]} c={C.butter} />
      </group>
    </Item>
  );
}

/* ───────────── 현관 ───────────── */

function Entrance() {
  return (
    <Item id="entrance">
      <B x={[6.3, 7.7]} z={[4.0, 5.1]} y={[0, 0.03]} c="#ffffff" map={checker(C.butter, C.cream, 8, 2, 2)} shadow={false} />
      <B x={[6.26, 6.32]} z={[4.0, 5.1]} y={[0, 2.1]} c="#f3ead8" glass />
      <B x={[6.24, 6.34]} z={[4.0, 5.1]} y={[2.05, 2.12]} c={C.birch} />
      {[4.0, 4.37, 4.73, 5.08].map((z) => <B key={z} x={[6.24, 6.34]} z={[z - 0.02, z + 0.02]} y={[0, 2.1]} c={C.birch} />)}
      <B x={[6.45, 7.65]} z={[4.03, 4.38]} y={[0.12, 1.1]} c={C.birch} r={0.03} />
      <B x={[7.04, 7.06]} z={[4.37, 4.39]} y={[0.2, 1.0]} c={C.birchDeep} />
      <On wall="z39">
        <Cyl p={[7.05, 1.6, 4.04]} r={0.28} h={0.03} rot={[Math.PI / 2, 0, 0]} c={C.birch} />
        <Cyl p={[7.05, 1.6, 4.06]} r={0.24} h={0.01} rot={[Math.PI / 2, 0, 0]} c="#e4ddd0" rough={0.05} metal={0.6} />
      </On>
      <Flowers p={[6.65, 1.1, 4.2]} s={0.6} kind="tulip" colors={[C.pink, C.butter, C.pink]} />
      <Cyl p={[7.5, 0.25, 4.95]} r={0.09} h={0.5} c={C.sky} />
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
      {beads.map(([x, y], i) => <Ball key={i} p={[x, y, 0.02]} r={0.045} c={C.honeyDeep} />)}
    </group>
  );
}

function Curtain({ x, z, h = 2.3, sheer = false }: { x: [number, number]; z: number; h?: number; sheer?: boolean }) {
  const n = 5;
  const w = (x[1] - x[0]) / n;
  return (
    <group>
      <B x={[x[0] - 0.05, x[1] + 0.05]} z={[z - 0.015, z + 0.015]} y={[h + 0.02, h + 0.05]} c={C.birchDeep} />
      {Array.from({ length: n }, (_, i) => (
        <B key={i} x={[x[0] + i * w, x[0] + (i + 1) * w]} z={[z - (i % 2 ? 0.05 : 0.02), z + 0.03]} y={[0.05, h]} c={sheer ? C.white : "#ffffff"} map={sheer ? undefined : gingham(1, 4, "rgba(169,200,234,0.55)")} r={0.02} />
      ))}
    </group>
  );
}

// 코코아 도트 암체어 + 파스텔 패치워크 쿠션 (레퍼런스)
function DotArmchair({ p, rot }: { p: [number, number, number]; rot: number }) {
  const fab = dots(C.cocoa, C.white, 5, 2, 2);
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <B x={[-0.38, 0.38]} z={[-0.35, 0.35]} y={[0.08, 0.42]} c="#ffffff" map={fab} r={0.08} />
      <B x={[-0.38, 0.38]} z={[-0.35, -0.18]} y={[0.4, 0.95]} c="#ffffff" map={fab} r={0.08} />
      <B x={[-0.38, -0.24]} z={[-0.35, 0.35]} y={[0.4, 0.62]} c="#ffffff" map={fab} r={0.06} />
      <B x={[0.24, 0.38]} z={[-0.35, 0.35]} y={[0.4, 0.62]} c="#ffffff" map={fab} r={0.06} />
      <B x={[-0.18, 0.18]} z={[-0.2, -0.1]} y={[0.42, 0.78]} c="#ffffff" map={patchwork()} r={0.04} />
      {[[-0.3, -0.27], [0.3, -0.27], [-0.3, 0.27], [0.3, 0.27]].map(([x, z], i) => <Cyl key={i} p={[x, 0.04, z]} r={0.03} h={0.08} c={C.birch} />)}
    </group>
  );
}

function Decor() {
  return (
    <Item id="decor">
      <On wall="x35">
        <WavyMirror />
      </On>
      {/* 거실: 소파 위 액자 + 소파 선반 위 오브제 */}
      <On wall="east">
        <group position={[7.66, 1.6, 7.6]} rotation={[0, -Math.PI / 2, 0]}>
          <B x={[-0.18, 0.18]} y={[-0.22, 0.22]} z={[-0.01, 0.01]} c={C.white} />
          <B x={[-0.15, 0.15]} y={[-0.05, 0.19]} z={[0.01, 0.015]} c="#7fae5c" shadow={false} />
          <Ball p={[0, 0.07, 0.02]} r={0.05} s={[1, 1.3, 0.3]} c={C.pink} />
        </group>
      </On>
      <group position={[7.55, 1.08, 6.9]} rotation={[0, -Math.PI / 2, 0]}>
        <B x={[-0.17, 0.17]} y={[0, 0.36]} z={[-0.02, 0.02]} c={C.walnut} />
        {Array.from({ length: 9 }, (_, i) => (
          <B key={i} x={[-0.13 + (i % 3) * 0.09, -0.06 + (i % 3) * 0.09]} y={[0.05 + Math.floor(i / 3) * 0.1, 0.12 + Math.floor(i / 3) * 0.1]} z={[0.02, 0.025]} c={[C.sage, C.cobalt, C.butter, C.peach, C.white, C.sage, C.butter, C.sky, C.pink][i]} shadow={false} />
        ))}
      </group>
      <Flowers p={[7.55, 1.08, 8.3]} s={0.9} kind="gerbera" vase="stripe" colors={[C.butter, "#f6e3a0", C.butter, "#f3c96a"]} />
      {/* 거실: 도트 암체어 + 코발트 꽃 스탠드 */}
      <DotArmchair p={[4.7, 0, 8.5]} rot={Math.PI * 0.75} />
      <group position={[4.3, 0, 6.3]}>
        <Cyl p={[0, 0.3, 0]} r={0.015} h={0.6} c={C.cobalt} />
        <Cyl p={[0, 0.02, 0]} r={0.16} h={0.03} c={C.cobalt} />
        <Cyl p={[0, 0.7, 0]} r={[0.15, 0.12]} h={0.22} c={C.cobalt} />
        <Flowers p={[0, 0.6, 0]} s={1.2} kind="ball" vase="glass" colors={["#7fae5c", "#8dbb68", "#7fae5c", "#9cc872"]} />
      </group>
      <On wall="z92">
        <Curtain x={[4.0, 4.7]} z={9.12} sheer />
        <Curtain x={[6.9, 7.6]} z={9.12} sheer />
        <Curtain x={[0.3, 0.95]} z={9.12} />
      </On>
      {/* 안방 */}
      <On wall="z59">
        <Star p={[1.45, 1.55, 6.03]} r={0.16} c={C.butter} />
      </On>
      <Flowers p={[2.6, 0.5, 6.3]} s={0.6} kind="daisy" colors={[C.white, C.lavender, C.white]} />
      {/* 드레스룸: 우드 전신거울 + 라벤더 도트 러그 + 퍼 푸프 */}
      <group position={[2.5, 0, 2.6]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.95, 0]} scale={[0.32, 0.8, 1]} rotation={[-0.12, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <M c={C.birch} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.95, 0.012]} scale={[0.27, 0.74, 1]} rotation={[-0.12, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <M c="#e4ddd0" rough={0.05} metal={0.6} />
        </mesh>
      </group>
      <Rug p={[1.2, 2.8]} rx={0.75} rz={0.75} c="#ffffff" map={dots(C.lavender, C.white, 6, 3, 3)} />
      <Ball p={[1.2, 0.2, 2.8]} r={0.24} s={[1, 0.8, 1]} c={C.white} rough={1} />
      <Flowers p={[0.3, 0, 2.3]} s={1.2} kind="tulip" vase="pot" colors={[C.lavender, C.pink, C.lavender]} />
      {/* 발코니: 꽃 화분 + 버터 비스트로 세트 + 빨래 */}
      <Flowers p={[0.6, 0.03, 9.9]} s={1.4} kind="gerbera" vase="pot" colors={[C.pink, C.butter, C.pink]} />
      <Flowers p={[7.2, 0.03, 9.9]} s={1.3} kind="daisy" vase="pot" colors={[C.white, C.white, C.white, C.white]} />
      <Flowers p={[7.3, 0.03, 0.6]} s={1.3} kind="tulip" vase="pot" colors={[C.butter, C.peach, C.butter]} />
      <Cyl p={[2.0, 0.35, 10.0]} r={0.03} h={0.7} c={C.butter} />
      <Cyl p={[2.0, 0.71, 10.0]} r={0.3} h={0.03} c={C.butter} />
      {[1.55, 2.45].map((x) => (
        <group key={x} position={[x, 0, 10.0]}>
          <Cyl p={[0, 0.22, 0]} r={0.025} h={0.44} c={C.butter} />
          <Cyl p={[0, 0.45, 0]} r={0.18} h={0.03} c={C.butter} />
        </group>
      ))}
      <Cyl p={[2.0, 0.78, 10.0]} r={0.04} h={0.1} c={C.sky} />
      <B x={[1.3, 2.6]} z={[0.55, 0.58]} y={[1.3, 1.33]} c={C.chrome} metal={0.6} />
      {[[1.45, C.cream], [1.75, C.butter], [2.05, C.pink], [2.35, C.sky]].map(([x, c]) => (
        <B key={x as number} x={[(x as number) - 0.12, (x as number) + 0.12]} z={[0.55, 0.58]} y={[0.85, 1.3]} c={c as string} shadow={false} />
      ))}
    </Item>
  );
}

function Electric() {
  if (!useDone("electric")) return null;
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

export function House(props: SceneCtx & { showMe?: boolean }) {
  const { showMe, ...ctx } = props;
  return (
    <Ctx.Provider value={ctx}>
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
        {showMe && <Me />}
      </group>
    </Ctx.Provider>
  );
}
