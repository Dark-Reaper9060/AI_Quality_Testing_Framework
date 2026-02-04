import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Box, Torus } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedSphere({ position, color, speed = 1 }: { position: [number, number, number]; color: string; speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function AnimatedTorus({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <Torus ref={meshRef} args={[0.8, 0.3, 32, 100]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </Torus>
    </Float>
  );
}

function FloatingCubes() {
  const cubes = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10 - 5,
      ] as [number, number, number],
      size: Math.random() * 0.3 + 0.1,
      speed: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  return (
    <>
      {cubes.map((cube, i) => (
        <FloatingCube key={i} {...cube} />
      ))}
    </>
  );
}

function FloatingCube({ position, size, speed }: { position: [number, number, number]; size: number; speed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.7;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
    }
  });

  return (
    <Box ref={meshRef} args={[size, size, size]} position={position}>
      <meshStandardMaterial
        color="#3b82f6"
        roughness={0.5}
        metalness={0.8}
        transparent
        opacity={0.3}
      />
    </Box>
  );
}

export function AbstractScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#60a5fa" />
      <pointLight position={[10, -10, 5]} intensity={0.5} color="#818cf8" />

      <AnimatedSphere position={[-2.5, 0.5, 0]} color="#3b82f6" speed={0.8} />
      <AnimatedSphere position={[2.5, -0.5, -2]} color="#6366f1" speed={1.2} />
      <AnimatedTorus position={[0, 1.5, -1]} color="#8b5cf6" />
      
      <FloatingCubes />

      <fog attach="fog" args={['#0f172a', 5, 20]} />
    </Canvas>
  );
}
