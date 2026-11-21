"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { House } from "./house/House";
import { CENTER, ROOMS, type Focus, type RoomId } from "./house/kit";
import { ME } from "./house/Me";

type Props = {
  fraction: Record<string, number>;
  nextId: string | null;
  dream: boolean;
  focus?: Focus;
  onSelect: (id: string | null) => void;
};

const DIR = new THREE.Vector3(-11, 13, 15).normalize();

// 방을 고르면 카메라가 부드럽게 날아가서 확대, "나"를 고르면 따라다님
function CameraRig({ focus }: { focus: Focus }) {
  const { camera, size, controls } = useThree();
  const goal = useRef<{ t: THREE.Vector3; p: THREE.Vector3; z: number } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (focus === "me") return;
    const r = focus ? ROOMS[focus] : null;
    const cx = r ? (r.x[0] + r.x[1]) / 2 : CENTER[0];
    const cz = r ? (r.z[0] + r.z[1]) / 2 : CENTER[2];
    const span = r ? Math.hypot(r.x[1] - r.x[0], r.z[1] - r.z[0]) * 1.05 + 0.6 : 13.2;
    const t = new THREE.Vector3(cx - CENTER[0], r ? 1.5 : 0.6, cz - CENTER[2] - (r ? 0.5 : 0));
    const g = { t, p: t.clone().add(DIR.clone().multiplyScalar(30)), z: Math.min(size.width, size.height * 1.15) / span };
    goal.current = g;
    if (first.current && controls) {
      first.current = false;
      camera.position.copy(g.p);
      (camera as THREE.OrthographicCamera).zoom = g.z;
      camera.updateProjectionMatrix();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (controls as any).target.copy(g.t);
      goal.current = null;
    }
  }, [focus, size.width, size.height, camera, controls]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = controls as any;
    if (!c) return;
    const stop = () => {
      if (focus !== "me") goal.current = null;
    };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, [controls, focus]);

  useFrame((_, dt) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = controls as any;
    if (!c) return;
    const cam = camera as THREE.OrthographicCamera;
    const k = 1 - Math.exp(-dt * 4);
    if (focus === "me") {
      // 카메라 방향은 사용자가 돌린 그대로 두고 대상만 따라감
      const t = new THREE.Vector3(ME.x - CENTER[0], 0.9, ME.z - CENTER[2]);
      const offset = cam.position.clone().sub(c.target);
      c.target.lerp(t, k);
      cam.position.copy(c.target).add(offset);
      const z = Math.min(size.width, size.height * 1.15) / 5.2;
      cam.zoom += (z - cam.zoom) * k * 0.5;
      cam.updateProjectionMatrix();
      c.update();
      return;
    }
    const g = goal.current;
    if (!g) return;
    cam.position.lerp(g.p, k);
    c.target.lerp(g.t, k);
    cam.zoom += (g.z - cam.zoom) * k;
    cam.updateProjectionMatrix();
    c.update();
    if (cam.position.distanceTo(g.p) < 0.01 && Math.abs(cam.zoom - g.z) < 0.05) goal.current = null;
  });
  return null;
}

export default function HouseCanvas({ fraction, nextId, dream, focus = null, onSelect }: Props) {
  // "나" 따라가기: 지금 있는 방 기준으로 벽을 낮춤
  const [meRoom, setMeRoom] = useState<RoomId | null>(null);
  useEffect(() => {
    if (focus !== "me") return;
    const id = setInterval(() => setMeRoom(ME.room), 300);
    return () => clearInterval(id);
  }, [focus]);
  const wallFocus = focus === "me" ? meRoom : focus;

  return (
    <Canvas shadows dpr={[1, 2]} onPointerMissed={() => onSelect(null)} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <OrthographicCamera makeDefault position={[-11, 13, 15]} zoom={28} near={-50} far={200} />
      <OrbitControls makeDefault enablePan={false} minZoom={14} maxZoom={180} minPolarAngle={0.35} maxPolarAngle={1.25} enableDamping />
      <CameraRig focus={focus} />
      <hemisphereLight args={["#fff6e2", "#e6d6b6", 1.15]} />
      <ambientLight intensity={0.35} color="#fff4de" />
      <directionalLight
        position={[-6, 14, 9]}
        intensity={1.5}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <House fraction={(id) => fraction[id] ?? 0} nextId={nextId} dream={dream} focus={wallFocus} onSelect={onSelect} showMe={dream} />
      <ContactShadows position={[0, -0.29, 0]} opacity={0.2} scale={24} blur={2.5} far={4} />
    </Canvas>
  );
}
