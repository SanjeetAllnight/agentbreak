import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

function ParticleField(props: any) {
  const ref = useRef<any>();
  
  const particlesCount = 3000;
  const positions = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      // Generate points in a sphere
      const r = 2 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 15;
      ref.current.rotation.y -= delta / 20;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#3b82f6"
          size={0.008}
          sizeAttenuation={true}
          depthWrite={false}
          blending={2} // Additive blending for glow effect
        />
      </Points>
    </group>
  );
}

export function Background3D() {
  return (
    <div className="fixed inset-0 z-[-1] bg-agentbreak-darker">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ParticleField />
      </Canvas>
      {/* Subtle overlay gradient to blend the 3D with the dark theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-agentbreak-darker/60 via-transparent to-agentbreak-darker/90 pointer-events-none" />
    </div>
  );
}
