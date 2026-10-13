import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Text, ContactShadows } from "@react-three/drei";
import { useMemo, useRef } from "react";

function Player({ color, skin, movement }) {
  const group = useRef();
  const speed = 3.6;
  const turnSpeed = 5.0;

  useFrame((state, delta) => {
    if (!group.current) return;

    const dx = ((movement.right ? 1 : 0) - (movement.left ? 1 : 0)) * speed * delta;
    const dz = ((movement.backward ? 1 : 0) - (movement.forward ? 1 : 0)) * speed * delta;

    group.current.position.x += dx;
    group.current.position.z += dz;

    const moving = Math.hypot(dx, dz) > 0.0001;
    if (moving) {
      const targetAngle = Math.atan2(dx, -dz);
      const current = group.current.rotation.y;
      let diff = targetAngle - current;

      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;

      group.current.rotation.y += diff * Math.min(turnSpeed * delta, 1);
    }

    group.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
  });

  return (
    <group ref={group} position={[0, 0.6, 0]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.5, 1.2, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color={skin === "red" ? "#ff5f5f" : skin === "blue" ? "#5ea3ff" : "#facc15"} />
      </mesh>

      <mesh position={[0.35, 0.15, 0.2]} rotation={[0, 0, 0.7]} castShadow>
        <boxGeometry args={[0.3, 0.12, 1.2]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ShopStand({ item, selected, onClick }) {
  const color = item.rarity === 4 ? "#fbbf24" : item.rarity === 3 ? "#a78bfa" : "#60a5fa";

  return (
    <group position={item.position} onClick={onClick}>
      <mesh castShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.8, 24]} />
        <meshStandardMaterial color={selected ? "#f59e0b" : "#1f2937"} />
      </mesh>

      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <Text position={[0, 1.8, 0]} fontSize={0.24} color="#fff" anchorX="center" anchorY="middle">
        {item.name}
      </Text>
    </group>
  );
}

export default function GameScene({ items, selectedItemId, onSelectItem, equippedSkin, movement }) {
  const playerColor = equippedSkin === "red" ? "#ef4444" : equippedSkin === "blue" ? "#3b82f6" : "#facc15";

  const shopItems = useMemo(() => [
    { id: 101, name: "Shadow Reaver", rarity: 3, position: [-3, 0, -2] },
    { id: 102, name: "Crimson Burst", rarity: 4, position: [0, 0, -2] },
    { id: 103, name: "Aurora Pulse", rarity: 4, position: [3, 0, -2] }
  ], []);

  return (
    <Canvas shadows camera={{ position: [0, 2.5, 7], fov: 55 }}>
      <color attach="background" args={["#070b14"]} />
      <ambientLight intensity={1.2} />
      <directionalLight castShadow position={[5, 8, 5]} intensity={1.8} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={0.6}>
        <Player color={playerColor} skin={equippedSkin || "gold"} movement={movement || {}} />
      </Float>

      {shopItems.map((item) => (
        <ShopStand
          key={item.id}
          item={item}
          selected={selectedItemId === item.id}
          onClick={() => onSelectItem(item.id)}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      <ContactShadows position={[0, -0.58, 0]} opacity={0.5} scale={12} blur={2} far={10} />

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={12} />
    </Canvas>
  );
}
