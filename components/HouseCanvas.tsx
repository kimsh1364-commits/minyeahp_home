"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { House } from "./house/House";

type Props = {
  fraction: Record<string, number>;
  nextId: string | null;
  dream: boolean;
  onSelect: (id: string | null) => void;
};

export default function HouseCanvas({ fraction, nextId, dream, onSelect }: Props) {
  return (
    <Canvas shadows dpr={[1, 2]} onPointerMissed={() => onSelect(null)} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <OrthographicCamera makeDefault position={[-11, 13, 15]} zoom={28} near={-50} far={200} />
      <OrbitControls
        enablePan={false}
        minZoom={16}
        maxZoom={70}
        minPolarAngle={0.35}
        maxPolarAngle={1.2}
        target={[0, 0.6, 0]}
        enableDamping
      />
      <hemisphereLight args={["#fff7ea", "#d9c8ad", 1.1]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[-6, 14, 9]}
        intensity={1.6}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <House fraction={(id) => fraction[id] ?? 0} nextId={nextId} dream={dream} onSelect={onSelect} />
      <ContactShadows position={[0, -0.29, 0]} opacity={0.25} scale={24} blur={2.5} far={4} />
    </Canvas>
  );
}
