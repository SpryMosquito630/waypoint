"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface Vehicle3DProps {
  groupRef: RefObject<THREE.Group>;
  isMoving: boolean;
}

export function Vehicle3D({ groupRef, isMoving }: Vehicle3DProps) {
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  useFrame((_, delta) => {
    if (!isMoving) return;
    const spin = delta * 6;
    for (const wheel of wheelRefs.current) {
      wheel.rotation.x -= spin;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.35, 0]} castShadow>
      {/* Body */}
      <RoundedBox args={[1.7, 0.45, 2.4]} radius={0.2} smoothness={4}>
        <meshStandardMaterial color="#ef4444" roughness={0.35} metalness={0.2} />
      </RoundedBox>

      {/* Cabin */}
      <RoundedBox args={[1.0, 0.35, 1.1]} position={[0, 0.35, -0.25]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color="#93c5fd" roughness={0.2} metalness={0.1} />
      </RoundedBox>

      {/* Nose / bumper */}
      <RoundedBox args={[1.2, 0.25, 0.5]} position={[0, 0.15, 1.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </RoundedBox>

      {/* Driver */}
      <mesh position={[0, 0.7, -0.35]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>

      {/* Wheels */}
      <mesh
        ref={(node) => {
          if (node) wheelRefs.current[0] = node;
        }}
        position={[0.65, 0.1, 0.7]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh
        ref={(node) => {
          if (node) wheelRefs.current[1] = node;
        }}
        position={[-0.65, 0.1, 0.7]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh
        ref={(node) => {
          if (node) wheelRefs.current[2] = node;
        }}
        position={[0.65, 0.1, -0.7]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh
        ref={(node) => {
          if (node) wheelRefs.current[3] = node;
        }}
        position={[-0.65, 0.1, -0.7]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.45, 0.2, 1.35]}>
        <boxGeometry args={[0.18, 0.12, 0.05]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-0.45, 0.2, 1.35]}>
        <boxGeometry args={[0.18, 0.12, 0.05]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}
