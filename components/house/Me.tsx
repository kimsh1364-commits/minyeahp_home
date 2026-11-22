"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Ball, C, Cyl, Star, roomAt, type RoomId } from "./kit";
import { dots } from "./textures";

// "나"가 지금 어디서 뭘 하는지 (TV 화면, 카메라 따라가기에서 읽음)
export const ME: { x: number; z: number; activity: Activity | "walk"; room: RoomId | null; label: string; cheerAt: number } = {
  x: 5.2,
  z: 6.1,
  activity: "walk",
  room: "living",
  label: "🚶 걷는 중",
  cheerAt: -1e9,
};

// 테스트용 (?speed= 붙였을 때만)
if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("speed")) (window as unknown as { __ME: typeof ME }).__ME = ME;

// 참았어요! → 캐릭터가 신나서 점프 + 별·하트 팡팡
export function cheer() {
  ME.cheerAt = performance.now();
}
const CHEER_MS = 2800;

type Activity = "sofa" | "cook" | "desk" | "flowers" | "tv";
type Spot = { route: [number, number][]; pose: { x: number; z: number; seat: number | null; face: [number, number] }; dur: number; label: string };

const HUB: [number, number] = [5.2, 6.1];
const SPOTS: Record<Activity, Spot> = {
  sofa: { route: [[6.4, 7.6]], pose: { x: 7.08, z: 7.6, seat: 0.5, face: [-1, 0] }, dur: 9, label: "🛋️ 소파에서 뒹굴뒹굴" },
  cook: { route: [[3.3, 6.25], [3.2, 4.3], [2.95, 3.7], [2.95, 2.45], [3.75, 2.45]], pose: { x: 3.8, z: 2.4, seat: null, face: [0, -1] }, dur: 10, label: "🍳 요리하는 중" },
  desk: { route: [[5.95, 4.4], [5.95, 3.3], [6.5, 3.0]], pose: { x: 6.5, z: 2.38, seat: 0.5, face: [0, -1] }, dur: 9, label: "🧵 재봉틀 돌리는 중" },
  flowers: { route: [[4.8, 6.45]], pose: { x: 4.62, z: 6.38, seat: null, face: [-1, 0] }, dur: 6, label: "💐 꽃에 물 주는 중" },
  tv: { route: [[3.3, 6.25], [3.15, 6.95], [2.7, 7.9]], pose: { x: 2.15, z: 8.0, seat: 0.56, face: [-0.5, 0.85] }, dur: 12, label: "📺 이동식 TV 보는 중" },
};
const ACTIVITIES: Activity[] = ["sofa", "cook", "desk", "flowers", "tv"];
// 방금 한 것만 빼고 랜덤
const pickNext = (cur: Activity | null) => {
  const pool = ACTIVITIES.filter((a) => a !== cur);
  return pool[Math.floor(Math.random() * pool.length)];
};
const FIRST = pickNext(null);

// 팡 터지는 별·하트 (방향·색은 한 번만 정함)
const BURST = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
  const sp = 0.5 + Math.random() * 0.5;
  return {
    vx: Math.cos(a) * sp,
    vz: Math.sin(a) * sp,
    vy: 1.6 + Math.random() * 0.9,
    heart: i % 2 === 0,
    c: ["#f39ab0", "#f2c94c", "#7fb0e8", "#7cc99a", "#a993e0"][i % 5],
  };
});
const FACE_CAMERA = Math.atan2(-11, 15);
const SPEED = 0.9;
// 테스트용: 주소에 ?speed=8 을 붙이면 빨리 감기
const TIME_SCALE = typeof window !== "undefined" ? Math.min(20, Number(new URLSearchParams(window.location.search).get("speed")) || 1) : 1;

function planPath(from: Activity | null, to: Activity): [number, number][] {
  const back = from ? [...SPOTS[from].route].reverse() : [];
  const s = SPOTS[to];
  return [...back, HUB, ...s.route, [s.pose.x, s.pose.z]];
}

export function Me() {
  const root = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const steam = useRef<THREE.Group>(null);
  const drops = useRef<THREE.Group>(null);
  const burst = useRef<THREE.Group>(null);
  const st = useRef({
    x: HUB[0],
    z: HUB[1],
    y: 0,
    rot: 0,
    cur: FIRST,
    prev: null as Activity | null,
    path: planPath(null, FIRST),
    acting: false,
    timer: 0,
  });
  const [prop, setProp] = useState<Activity | null>(null);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05) * TIME_SCALE;
    const s = st.current;
    const t = clock.elapsedTime;
    const cur = s.cur;
    const spot = SPOTS[cur];
    let walking = false;
    const cheerT = (performance.now() - ME.cheerAt) / 1000;
    const cheering = cheerT < CHEER_MS / 1000;

    if (cheering) {
      // 하던 일 멈추고 화면 쪽을 보며 신남
      turnTo(s, FACE_CAMERA, dt * 1.5);
    } else if (!s.acting) {
      const [tx, tz] = s.path[0];
      const dx = tx - s.x;
      const dz = tz - s.z;
      const d = Math.hypot(dx, dz);
      const step = SPEED * dt;
      if (d <= step) {
        s.x = tx;
        s.z = tz;
        s.path.shift();
        if (!s.path.length) {
          s.acting = true;
          s.timer = spot.dur;
          setProp(cur);
          ME.activity = cur;
          ME.label = spot.label;
        }
      } else {
        s.x += (dx / d) * step;
        s.z += (dz / d) * step;
        walking = true;
        turnTo(s, Math.atan2(dx, dz), dt);
      }
      s.y += ((s.path.length <= 0 && spot.pose.seat ? spot.pose.seat - 0.22 : 0.02) - s.y) * Math.min(1, dt * 8);
    } else {
      turnTo(s, Math.atan2(spot.pose.face[0], spot.pose.face[1]), dt);
      const targetY = spot.pose.seat ? spot.pose.seat - 0.22 : 0.02;
      s.y += (targetY - s.y) * Math.min(1, dt * 6);
      s.timer -= dt;
      if (s.timer <= 0) {
        s.acting = false;
        s.prev = cur;
        s.cur = pickNext(cur);
        s.path = planPath(cur, s.cur);
        setProp(null);
        ME.activity = "walk";
        ME.label = "🚶 걷는 중";
      }
    }

    ME.x = s.x;
    ME.z = s.z;
    ME.room = roomAt(s.x, s.z);

    if (!root.current) return;
    const bob = cheering ? Math.abs(Math.sin(t * 7)) * 0.22 : walking ? Math.abs(Math.sin(t * 9)) * 0.035 : 0;
    root.current.position.set(s.x, s.y + bob, s.z);
    root.current.rotation.y = s.rot;

    const sitting = s.acting && !!spot.pose.seat;
    const swing = walking ? Math.sin(t * 9) * 0.6 : 0;
    const legX = sitting ? -Math.PI / 2 : 0;
    if (legL.current) legL.current.rotation.x = legX + swing;
    if (legR.current) legR.current.rotation.x = legX - swing;

    // 팔 동작
    let lx = -swing * 0.8;
    let rx = swing * 0.8;
    let rz = 0;
    if (s.acting) {
      if (cur === "cook") {
        rx = -1.25 + Math.sin(t * 7) * 0.15;
        rz = Math.cos(t * 7) * 0.2;
        lx = -0.5;
      } else if (cur === "desk") {
        lx = -1.1 + Math.sin(t * 10) * 0.08;
        rx = -1.1 + Math.cos(t * 10) * 0.08;
      } else if (cur === "flowers") {
        rx = -1.0;
      } else if (cur === "tv") {
        lx = -0.7;
        rx = -0.7 + (Math.sin(t * 1.3) > 0.7 ? -0.9 : 0); // 팝콘 냠
      } else if (cur === "sofa") {
        lx = -0.3;
        rx = -0.3;
      }
    }
    if (armL.current) armL.current.rotation.set(lx, 0, 0.12);
    if (armR.current) armR.current.rotation.set(rx, 0, -0.12 + rz);
    if (cheering) {
      // 만세! V자로 흔들기
      const wave = Math.sin(t * 14) * 0.25;
      armL.current?.rotation.set(-0.3, 0, -2.45 + wave);
      armR.current?.rotation.set(-0.3, 0, 2.45 - wave);
    }
    if (burst.current) {
      burst.current.visible = cheering;
      if (cheering) {
        const e = Math.max(0, cheerT) % 1.4; // 두 번 팡팡
        burst.current.children.forEach((c, i) => {
          const b = BURST[i];
          c.position.set(b.vx * e, 1.0 + b.vy * e - 2.2 * e * e, b.vz * e);
          c.rotation.set(e * 4, e * 5, 0);
          c.scale.setScalar(Math.max(0.01, 1 - Math.max(0, e - 0.9) * 2));
        });
      }
    }
    if (head.current) head.current.rotation.z = s.acting && (cur === "sofa" || cur === "tv") ? Math.sin(t * 1.5) * 0.12 : 0;

    // 요리 김 / 물방울
    if (steam.current) {
      steam.current.visible = s.acting && cur === "cook";
      steam.current.children.forEach((c, i) => {
        const p = (t * 0.5 + i / 3) % 1;
        c.position.set(Math.sin(t + i) * 0.04, 1.12 + p * 0.5, 0);
        c.scale.setScalar(0.6 + p);
      });
    }
    if (drops.current) {
      drops.current.visible = s.acting && cur === "flowers";
      drops.current.children.forEach((c, i) => {
        const p = (t * 1.6 + i / 4) % 1;
        c.position.set(-0.1 - p * 0.05, 0.95 - p * 0.35, (i - 1.5) * 0.02);
      });
    }
  });

  const dress = dots(C.sky, C.white, 4, 2, 1);
  return (
    <>
      <group ref={root}>
        {/* 다리 */}
        {[-0.06, 0.06].map((x, i) => (
          <group key={x} ref={i ? legR : legL} position={[x, 0.24, 0]}>
            <Cyl p={[0, -0.1, 0]} r={0.035} h={0.2} c={C.cream} segs={10} />
            <Ball p={[0, -0.21, 0.02]} r={0.042} s={[1, 0.6, 1.4]} c={C.white} />
          </group>
        ))}
        {/* 도트 원피스 */}
        <mesh position={[0, 0.39, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.18, 0.3, 20]} />
          <meshStandardMaterial color="#ffffff" map={dress} roughness={0.9} />
        </mesh>
        <Cyl p={[0, 0.53, 0]} r={0.1} h={0.04} c={C.white} />
        {/* 팔 */}
        {[-0.13, 0.13].map((x, i) => (
          <group key={x} ref={i ? armR : armL} position={[x, 0.5, 0]}>
            <Cyl p={[0, -0.1, 0]} r={0.03} h={0.2} c={C.sky} segs={10} />
            <Ball p={[0, -0.22, 0]} r={0.035} c="#ffe3cf" />
            {i === 1 && prop === "cook" && <Cyl p={[0, -0.3, 0]} r={0.008} h={0.18} c={C.birchDeep} />}
            {i === 1 && prop === "flowers" && (
              <group position={[0, -0.27, 0.05]} rotation={[1.0, 0, 0]}>
                <Cyl p={[0, 0, 0]} r={0.07} h={0.12} c={C.mint} />
                <Cyl p={[0, 0.03, 0.1]} r={0.012} h={0.14} rot={[1.1, 0, 0]} c={C.mint} />
              </group>
            )}
          </group>
        ))}
        {prop === "tv" && (
          <group position={[0, 0.3, 0.22]}>
            <Cyl p={[0, 0, 0]} r={[0.09, 0.06]} h={0.07} c={C.white} />
            {[[-0.03, 0.02], [0.03, 0.03], [0, -0.02], [0.02, 0.0]].map(([x, z], i) => (
              <Ball key={i} p={[x, 0.05, z]} r={0.025} c="#fff6d8" />
            ))}
          </group>
        )}
        {/* 머리 */}
        <group ref={head} position={[0, 0.73, 0]}>
          <Ball p={[0, 0, 0]} r={0.2} c="#ffe3cf" />
          {/* 단발 */}
          <mesh position={[0, 0.02, -0.01]} rotation={[-0.35, 0, 0]} castShadow>
            <sphereGeometry args={[0.218, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#6b4a3a" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <Ball p={[0, -0.03, -0.06]} r={0.205} s={[1.05, 0.95, 0.8]} c="#6b4a3a" />
          <Ball p={[-0.07, -0.02, 0.185]} r={0.022} c={C.black} />
          <Ball p={[0.07, -0.02, 0.185]} r={0.022} c={C.black} />
          <Ball p={[-0.115, -0.07, 0.16]} r={0.032} s={[1, 0.6, 0.4]} c={C.pink} />
          <Ball p={[0.115, -0.07, 0.16]} r={0.032} s={[1, 0.6, 0.4]} c={C.pink} />
          <Star p={[0.13, 0.12, 0.1]} r={0.045} depth={0.015} rot={[0, 0.5, 0.3]} c={C.butter} />
        </group>
        {/* 신나는 효과: 별·하트 */}
        <group ref={burst} visible={false}>
          {BURST.map((b, i) =>
            b.heart ? (
              <group key={i}>
                <Ball p={[-0.04, 0, 0]} r={0.055} c={b.c} emissive={b.c} />
                <Ball p={[0.04, 0, 0]} r={0.055} c={b.c} emissive={b.c} />
                <Ball p={[0, -0.05, 0]} r={0.045} c={b.c} emissive={b.c} />
              </group>
            ) : (
              <group key={i}>
                <Star p={[0, 0, 0]} r={0.1} depth={0.02} c={b.c} emissive={b.c} />
              </group>
            ),
          )}
        </group>
        {/* 물뿌리개 물방울 (월드가 아닌 캐릭터 기준) */}
        <group ref={drops}>
          {[0, 1, 2, 3].map((i) => (
            <Ball key={i} p={[0, 0, 0]} r={0.015} c={C.sky} />
          ))}
        </group>
      </group>
      {/* 냄비 위 김 */}
      <group ref={steam} position={[3.75, 0, 1.75]}>
        {[0, 1, 2].map((i) => (
          <Ball key={i} p={[0, 0, 0]} r={0.05} c={C.white} />
        ))}
      </group>
    </>
  );
}

function turnTo(s: { rot: number }, target: number, dt: number) {
  let d = target - s.rot;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  s.rot += d * Math.min(1, dt * 8);
}
