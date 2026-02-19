"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/stores/game-store";
import { generateTile, generateTileWindow } from "@/lib/game/engine";
import { TILES_AHEAD, TILES_BEHIND } from "@/lib/game/constants";
import type { Tile } from "@/types/game";
import { Vehicle3D } from "./Vehicle3D";
import { mulberry32 } from "@/lib/game/prng";

const TILE_Z_SPACING = 3;
const ROAD_WIDTH = 3.6;
const ROAD_HEIGHT = 0.18;
const TERRAIN_SIZE = 140;

const biomeRoadColors: Record<string, string> = {
  desert: "#c9a568",
  forest: "#3d6b4f",
  tundra: "#6b7b8f",
};

const biomeTerrainColors: Record<string, string> = {
  desert: "#e4c991",
  forest: "#5fa06a",
  tundra: "#9aa6b2",
};

const biomeTreeColors: Record<string, string> = {
  desert: "#9ca3af",
  forest: "#22c55e",
  tundra: "#86efac",
};

function RoadTile({ tile }: { tile: Tile }) {
  const z = tile.index * TILE_Z_SPACING;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, ROAD_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[ROAD_WIDTH, ROAD_HEIGHT, TILE_Z_SPACING]} />
        <meshStandardMaterial color={biomeRoadColors[tile.biome]} />
      </mesh>
      {/* center line */}
      <mesh position={[0, ROAD_HEIGHT + 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.1, 0.02, TILE_Z_SPACING * 0.6]} />
        <meshStandardMaterial color="#f9fafb" />
      </mesh>
    </group>
  );
}

function RewardCrate({ tile, highlight }: { tile: Tile; highlight: boolean }) {
  const z = tile.index * TILE_Z_SPACING;
  return (
    <group position={[0.9, 0.55, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color={highlight ? "#60a5fa" : "#fbbf24"}
          emissive={highlight ? "#3b82f6" : "#f59e0b"}
          emissiveIntensity={highlight ? 0.8 : 0.4}
        />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function MilestoneMarker({ tile }: { tile: Tile }) {
  const z = tile.index * TILE_Z_SPACING;
  return (
    <group position={[-1.1, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.08, 1.0, 0.08]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
    </group>
  );
}

function TerrainBase({
  color,
  centerZ,
}: {
  color: string;
  centerZ: number;
}) {
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 32, 32);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const height = Math.sin(x * 0.12) * Math.cos(y * 0.1) * 0.3;
      pos.setZ(i, height);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, centerZ]} receiveShadow>
      <primitive object={geometry} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Tree({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <meshStandardMaterial color="#7c3f00" />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Mushroom({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.4, 10]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

function FollowCamera({ targetRef }: { targetRef: RefObject<THREE.Group> }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3());
  const smoothLook = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!targetRef.current) return;
    const target = new THREE.Vector3();
    targetRef.current.getWorldPosition(target);

    const desiredPos = new THREE.Vector3(
      target.x,
      target.y + 2.2,
      target.z - 6
    );
    smoothPos.current.lerp(desiredPos, 0.08);
    camera.position.copy(smoothPos.current);

    const desiredLook = new THREE.Vector3(target.x, target.y + 0.6, target.z + 3);
    smoothLook.current.lerp(desiredLook, 0.08);
    camera.lookAt(smoothLook.current);
  });

  return null;
}

function Scene({
  tiles,
  viewCenter,
  lookAheadIndex,
  isMoving,
  playerSeed,
}: {
  tiles: Tile[];
  viewCenter: number;
  lookAheadIndex: number | null;
  isMoving: boolean;
  playerSeed: number;
}) {
  const carRef = useRef<THREE.Group>(null);
  const carZRef = useRef(viewCenter * TILE_Z_SPACING);
  const initializedRef = useRef(false);
  const moveRef = useRef({
    from: viewCenter * TILE_Z_SPACING,
    to: viewCenter * TILE_Z_SPACING,
    start: 0,
    duration: 5,
  });

  useEffect(() => {
    const now = performance.now();
    const nextZ = viewCenter * TILE_Z_SPACING;
    if (!initializedRef.current) {
      carZRef.current = nextZ;
      if (carRef.current) {
        carRef.current.position.z = nextZ;
      }
      moveRef.current = { from: nextZ, to: nextZ, start: now, duration: 0 };
      initializedRef.current = true;
      return;
    }
    moveRef.current = {
      from: carZRef.current,
      to: nextZ,
      start: now,
      duration: 5000,
    };
  }, [viewCenter]);

  useFrame(() => {
    const { from, to, start, duration } = moveRef.current;
    const now = performance.now();
    const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
    const nextZ = from + (to - from) * t;
    carZRef.current = nextZ;
    if (carRef.current) {
      carRef.current.position.z = nextZ;
    }
  });

  const biomeColor = tiles.length > 0 ? biomeTerrainColors[tiles[0].biome] : "#5fa06a";

  const terrainCenterZ = viewCenter * TILE_Z_SPACING;
  const decorations = useMemo(() => {
    const items: {
      type: "tree" | "mushroom";
      position: [number, number, number];
      color?: string;
      scale?: number;
    }[] = [];
    for (const tile of tiles) {
      const rng = mulberry32(playerSeed + tile.index * 1337);
      if (rng() < 0.5) {
        const side = rng() < 0.5 ? -1 : 1;
        const x = side * (ROAD_WIDTH / 2 + 1.2 + rng() * 1.8);
        const z = tile.index * TILE_Z_SPACING + (rng() - 0.5) * 0.9;
        items.push({
          type: "tree",
          position: [x, 0, z],
          color: biomeTreeColors[tile.biome],
          scale: 0.7 + rng() * 0.6,
        });
      }
      if (rng() < 0.12) {
        const side = rng() < 0.5 ? -1 : 1;
        const x = side * (ROAD_WIDTH / 2 + 0.9 + rng() * 1.4);
        const z = tile.index * TILE_Z_SPACING + (rng() - 0.5) * 0.6;
        items.push({ type: "mushroom", position: [x, 0, z] });
      }
    }
    return items;
  }, [tiles, playerSeed]);

  return (
    <>
      <Sky sunPosition={[5, 5, -5]} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[6, 8, -4]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={["#dbeafe", "#1f2937", 0.5]} />
      <fog attach="fog" args={[biomeColor, 10, 50]} />

      <TerrainBase color={biomeColor} centerZ={terrainCenterZ} />

      {tiles.map((tile) => (
        <group key={tile.index}>
          <RoadTile tile={tile} />
          {tile.type === "crate" && (
            <RewardCrate tile={tile} highlight={lookAheadIndex === tile.index} />
          )}
          {tile.type === "milestone" && <MilestoneMarker tile={tile} />}
        </group>
      ))}

      {decorations.map((item, idx) =>
        item.type === "tree" ? (
          <Tree
            key={`tree-${idx}`}
            position={item.position}
            color={item.color ?? "#22c55e"}
            scale={item.scale ?? 1}
          />
        ) : (
          <Mushroom key={`mush-${idx}`} position={item.position} />
        )
      )}

      <Vehicle3D groupRef={carRef} isMoving={isMoving} />
      <FollowCamera targetRef={carRef} />
    </>
  );
}

export function ThreeWorld() {
  const tiles = useGameStore((s) => s.tiles);
  const vehiclePosition = useGameStore((s) => s.vehiclePosition);
  const playerSeed = useGameStore((s) => s.playerSeed);
  const [lookAheadIndex, setLookAheadIndex] = useState<number | null>(null);
  const [aheadError, setAheadError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const initializedRef = useRef(false);

  const MAX_LOOKAHEAD = 500;
  const MAX_LOOKBACK = 500;

  const viewCenter = lookAheadIndex ?? vehiclePosition;
  const visibleTiles = useMemo(() => {
    if (lookAheadIndex === null) return tiles;
    return generateTileWindow(viewCenter, TILES_BEHIND, TILES_AHEAD, playerSeed);
  }, [lookAheadIndex, viewCenter, playerSeed, tiles]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      setIsMoving(false);
      return;
    }
    setIsMoving(true);
    const t = setTimeout(() => setIsMoving(false), 5000);
    return () => clearTimeout(t);
  }, [viewCenter]);

  const findNextCrate = (fromIndex: number) => {
    for (let i = fromIndex + 1; i <= fromIndex + MAX_LOOKAHEAD; i++) {
      if (generateTile(i, playerSeed).type === "crate") return i;
    }
    return null;
  };

  const findPrevCrate = (fromIndex: number) => {
    const start = Math.max(0, fromIndex - MAX_LOOKBACK);
    for (let i = fromIndex - 1; i >= start; i--) {
      if (generateTile(i, playerSeed).type === "crate") return i;
    }
    return null;
  };

  const handleAheadClick = () => {
    const base = lookAheadIndex ?? vehiclePosition;
    const next = findNextCrate(base);
    if (next === null) {
      setAheadError(`No rewards within ${MAX_LOOKAHEAD} tiles.`);
      return;
    }
    setAheadError(null);
    setLookAheadIndex(next);
  };

  const handleBackClick = () => {
    const base = lookAheadIndex ?? vehiclePosition;
    const prev = findPrevCrate(base);
    if (prev === null) {
      setAheadError(`No rewards within ${MAX_LOOKBACK} tiles.`);
      return;
    }
    setAheadError(null);
    setLookAheadIndex(prev);
  };

  const handleReturnClick = () => {
    setAheadError(null);
    setLookAheadIndex(null);
  };

  return (
    <div className="relative w-full h-64 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <Canvas
        shadows
        camera={{ fov: 55, position: [0, 2.2, -6] }}
        className="w-full h-full"
      >
        <Scene
          tiles={visibleTiles}
          viewCenter={viewCenter}
          lookAheadIndex={lookAheadIndex}
          isMoving={isMoving}
          playerSeed={playerSeed}
        />
      </Canvas>

      <button
        type="button"
        onClick={handleAheadClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 text-blue-300/90 hover:text-blue-200 transition-colors"
      >
        <span className="text-xs uppercase tracking-wider">Ahead</span>
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M13 5l7 7-7 7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleBackClick}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 text-blue-300/90 hover:text-blue-200 transition-colors"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M11 19l-7-7 7-7" />
        </svg>
        <span className="text-xs uppercase tracking-wider">Back</span>
      </button>

      <button
        type="button"
        onClick={handleReturnClick}
        className="absolute left-1/2 bottom-2 -translate-x-1/2 z-40 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-[10px] uppercase tracking-wider text-blue-200 hover:bg-blue-500/20 transition-colors"
      >
        Return
      </button>

      {(lookAheadIndex !== null || aheadError) && (
        <div className="absolute right-3 top-6 z-40 text-[10px] text-blue-200/90">
          {aheadError ? aheadError : `Reward at tile ${lookAheadIndex}`}
        </div>
      )}
    </div>
  );
}
