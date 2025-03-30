import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Avatar({ isSpeaking }) {
  const meshRef = useRef();
  const mouthRef = useRef();
  
  // Improved mouth animation that only happens during speech
  useFrame(() => {
    if (isSpeaking && mouthRef.current) {
      // More natural mouth movement
      mouthRef.current.scale.y = Math.sin(Date.now() / 100) * 0.5 + 0.7;
      // Subtle head movement during speech
      meshRef.current.rotation.y = Math.sin(Date.now() / 1000) * 0.1;
      meshRef.current.rotation.z = Math.sin(Date.now() / 1200) * 0.05;
    } else if (mouthRef.current) {
      // Return mouth to closed position when not speaking
      mouthRef.current.scale.y = 0.3;
      // Return head to neutral position
      meshRef.current.rotation.y = 0;
      meshRef.current.rotation.z = 0;
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Main head shape */}
      <group>
        {/* Base head mesh */}
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#0066cc" wireframe={true} />
        </mesh>

        {/* Inner head for depth effect */}
        <mesh scale={0.98}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#00ffff" wireframe={true} opacity={0.3} transparent={true} />
        </mesh>

        {/* Face features */}
        {/* Eyes */}
        <group position={[0, 0.1, 0]}>
          {/* Left eye socket */}
          <mesh position={[-0.3, 0, 0.85]}>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshBasicMaterial color="#0066cc" wireframe={true} />
          </mesh>
          {/* Left eye glow */}
          <mesh position={[-0.3, 0, 0.9]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>

          {/* Right eye socket */}
          <mesh position={[0.3, 0, 0.85]}>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshBasicMaterial color="#0066cc" wireframe={true} />
          </mesh>
          {/* Right eye glow */}
          <mesh position={[0.3, 0, 0.9]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
          </mesh>
        </group>

        {/* Updated mouth - wider and more horizontal */}
        <group position={[0, -0.3, 0.7]} ref={mouthRef}>
          <mesh>
            <planeGeometry args={[0.6, 0.05]} /> {/* Wider mouth */}
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
          </mesh>
          {/* Additional mouth detail */}
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.55, 0.04]} />
            <meshBasicMaterial color="#0066cc" wireframe={true} />
          </mesh>
        </group>

        {/* Face contours */}
        <mesh>
          <torusGeometry args={[0.7, 0.02, 16, 32, Math.PI]} />
          <meshBasicMaterial color="#0066cc" wireframe={true} />
        </mesh>

        {/* Cheek contours */}
        <mesh position={[-0.4, -0.2, 0.6]} rotation={[0, 0.5, 0]}>
          <torusGeometry args={[0.3, 0.02, 16, 32, Math.PI]} />
          <meshBasicMaterial color="#0066cc" wireframe={true} />
        </mesh>
        <mesh position={[0.4, -0.2, 0.6]} rotation={[0, -0.5, 0]}>
          <torusGeometry args={[0.3, 0.02, 16, 32, Math.PI]} />
          <meshBasicMaterial color="#0066cc" wireframe={true} />
        </mesh>
      </group>

      {/* Outer wireframe for glow effect */}
      <mesh scale={1.02}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00ffff" wireframe={true} transparent={true} opacity={0.1} />
      </mesh>
    </mesh>
  );
}

const VirtualAssistant = ({ isSpeaking }) => {
  return (
    <div className="virtual-assistant">
      <Canvas camera={{ position: [0, 0, 2.2] }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <spotLight 
          position={[0, 5, 5]} 
          angle={0.3} 
          penumbra={1} 
          intensity={0.5}
          color="#00ffff"
        />
        <Avatar isSpeaking={isSpeaking} />
        <OrbitControls 
          enableZoom={false}
          minPolarAngle={Math.PI/2 - 0.5}
          maxPolarAngle={Math.PI/2 + 0.5}
        />
      </Canvas>
    </div>
  );
};

export default VirtualAssistant; 
