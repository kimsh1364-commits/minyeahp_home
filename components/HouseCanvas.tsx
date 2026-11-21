"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { CENTER, House, ROOMS, type RoomId } from "./house/House";

type Props = {
  fraction: Record<string, number>;
  nextId: string | null;
  dream: boolean;
  focus?: RoomId | null;
  onSelect: (id: string | null) => void;
};

const DIR = new THREE.Vector3(-11, 13, 15).normalize();

// 방을 고르면 카메라가 부드럽게 날아가서 확대
function CameraRig({ focus }: { focus: RoomId | null }) {
  const { camera, size, controls } = useThree();
  const goal = useRef<{ t: THREE.Vector3; p: THREE.Vector3; z: number } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const r = focus ? ROOMS[focus] : null;
    const cx = r ? (r.x[0] + r.x[1]) / 2 : CENTER[0];
    const cz = r ? (r.z[0] + r.z[1]) / 2 : CENTER[2];
    // 아이소메트릭이라 방 대각선이 화면 폭을 차지함
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
    const stop = () => (goal.current = null);
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, dt) => {
    const g = goal.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = controls as any;
    if (!g || !c) return;
    const k = 1 - Math.exp(-dt * 4);
    const cam = camera as THREE.OrthographicCamera;
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
  return (
    <Canvas shadows dpr={[1, 2]} onPointerMissed={() => onSelect(null)} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <OrthographicCamera makeDefault position={[-11, 13, 15]} zoom={28} near={-50} far={200} />
      <OrbitControls makeDefault enablePan={false} minZoom={14} maxZoom={180} minPolarAngle={0.35} maxPolarAngle={1.25} enableDamping />
      <CameraRig focus={focus} />
      <hemisphereLight args={["#fff4dc", "#e2cfa6", 1.15]} />
      <ambientLight intensity={0.35} color="#fff2d6" />
      <directionalLight
        position={[-6, 14, 9]}
        intensity={1.55}
        color="#ffeccc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <House fraction={(id) => fraction[id] ?? 0} nextId={nextId} dream={dream} focus={focus} onSelect={onSelect} />
      <ContactShadows position={[0, -0.29, 0]} opacity={0.2} scale={24} blur={2.5} far={4} />
    </Canvas>
  );
}
