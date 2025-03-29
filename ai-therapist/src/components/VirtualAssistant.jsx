import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Avatar({ isSpeaking }) {
  const meshRef = useRef();
  
  // Add subtle animation
  useFrame(() => {
    if (isSpeaking) {
      meshRef.current.rotation.y += 0.005;
      // Mouth animation
      meshRef.current.children[3].scale.y = Math.sin(Date.now() / 100) * 0.5 + 1;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Head shape */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#0066cc" wireframe={true} />
      </mesh>

      {/* Body */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 2, 16]} />
        <meshBasicMaterial color="#0066cc" wireframe={true} />
      </mesh>

      {/* Eyes - glowing */}
      <mesh position={[-0.3, 0.1, 0.85]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.3, 0.1, 0.85]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      {/* Animated mouth */}
      <mesh position={[0, -0.2, 0.85]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.05, 0.3, 8, 8]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Additional wireframe overlay for the glow effect */}
      <mesh>
        <sphereGeometry args={[1.02, 32, 32]} />
        <meshBasicMaterial color="#00ffff" wireframe={true} transparent={true} opacity={0.2} />
      </mesh>
    </mesh>
  );
}

const VirtualAssistant = ({ isSpeaking }) => {
  return (
    <div className="virtual-assistant" style={{ height: '400px', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <spotLight position={[0, 5, 5]} angle={0.3} penumbra={1} intensity={1} />
        <Avatar isSpeaking={isSpeaking} />
        <OrbitControls enableZoom={false} />
      </Canvas>
      <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px', background: 'rgba(255,255,255,0.8)' }}>
        3D Avatar View
      </div>
    </div>
  );
};

export default VirtualAssistant; 