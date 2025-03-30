import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module';



// Face component that handles the 3D model
const Face = ({ isSpeaking }) => {
  const meshRef = useRef();
  const mixerRef = useRef();
  const { scene, gl } = useThree();
  const lastSpeakingState = useRef(isSpeaking);

  useEffect(() => {
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath('/basis/')
      .detectSupport(gl);

    const loader = new GLTFLoader()
      .setKTX2Loader(ktx2Loader)
      .setMeshoptDecoder(MeshoptDecoder);

    loader.load('/models/facecap.glb', (gltf) => {
      
      const mesh = gltf.scene.children[0];
      meshRef.current = mesh;

      mesh.scale.set(5, 5, 5);
      mesh.position.set(0, 0.10, 0); // Lower the head slightly
      mesh.rotation.set(0, 0, 0.03); // Counteract default tilt

      // Apply new materials for a clean, white appearance
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (child.name.toLowerCase().includes('eye')) {
            // Slightly darker material for eyes
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(0x303030),
              metalness: 0.4,
              roughness: 0.2,
              clearcoat: 0.8,
              clearcoatRoughness: 0.2
            });
          } else {
            // Clean white material for the face
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(0xbbddff),
              metalness: 0.2,
              roughness: 0.3,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1,
              envMapIntensity: 0.8
            });
          }
        }
      });

      scene.add(mesh);
      mixerRef.current = new THREE.AnimationMixer(mesh);
      
    });

    return () => {
      if (meshRef.current) {
        scene.remove(meshRef.current);
      }
    };
  }, [scene, gl]);

  // Mouth animation
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);

      if (meshRef.current) {
        const head = meshRef.current.getObjectByName('mesh_2');
        if (head && head.morphTargetInfluences && head.morphTargetDictionary) {
          const mouthOpenIndex = head.morphTargetDictionary['mouthOpen'];
          const jawOpenIndex = head.morphTargetDictionary['jawOpen'];
          const mouthSmileIndex = head.morphTargetDictionary['mouthSmile'];

          // Check if speaking state has changed
          if (lastSpeakingState.current !== isSpeaking) {
            lastSpeakingState.current = isSpeaking;
            
            // Immediately reset mouth position when stopping speaking
            if (!isSpeaking) {
              if (mouthOpenIndex !== undefined) head.morphTargetInfluences[mouthOpenIndex] = 0;
              if (jawOpenIndex !== undefined) head.morphTargetInfluences[jawOpenIndex] = 0;
              if (mouthSmileIndex !== undefined) head.morphTargetInfluences[mouthSmileIndex] = 0.1;
              return; // Exit early when stopping speech
            }
          }

          if (isSpeaking) {
            const time = state.clock.elapsedTime;
            
            // Create vowel-like patterns
            const vowelSpeed = 12;
            const consonantSpeed = 18;
            
            // Vowel movement (slower, wider opening)
            const vowelMovement = Math.sin(time * vowelSpeed) * 0.5 + 0.5;
            
            // Consonant movement (faster, shorter opening)
            const consonantMovement = Math.sin(time * consonantSpeed) * 0.3;
            
            // Combine movements with natural variation
            const naturalVariation = Math.sin(time * 4) * 0.1;
            const openAmount = (vowelMovement + consonantMovement + naturalVariation) * 0.7;

            // Add micro-movements for more realism
            const microMovement = Math.sin(time * 30) * 0.05;
            
            if (mouthOpenIndex !== undefined) {
              // Smooth the mouth movement
              const targetOpen = Math.max(0, Math.min(0.8, openAmount + microMovement));
              head.morphTargetInfluences[mouthOpenIndex] = targetOpen;
            }
            
            if (jawOpenIndex !== undefined) {
              // Jaw follows mouth but with less intensity
              head.morphTargetInfluences[jawOpenIndex] = openAmount * 0.4;
            }
            
            if (mouthSmileIndex !== undefined) {
              // Subtle smile variation
              const smileAmount = 0.1 + Math.sin(time * 2) * 0.05;
              head.morphTargetInfluences[mouthSmileIndex] = smileAmount;
            }
          } else {
            // Ensure mouth is closed when not speaking
            if (mouthOpenIndex !== undefined) head.morphTargetInfluences[mouthOpenIndex] = 0;
            if (jawOpenIndex !== undefined) head.morphTargetInfluences[jawOpenIndex] = 0;
            if (mouthSmileIndex !== undefined) head.morphTargetInfluences[mouthSmileIndex] = 0.1;
          }
        }
      }
    }
  });

  return null;
};

const VirtualAssistant = ({ isSpeaking }) => {
  return (
    <div className="virtual-assistant">
      <Canvas
        camera={{
          fov: 45,
          near: 1,
          far: 20,
          position: [0, 0, 3]
        }}
      >
        {/* Pure black background */}
        <color attach="background" args={['#000000']} />
        
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        
        {/* Main rim light */}
        <spotLight 
          position={[-2, 2, 2]}
          intensity={10}
          color="#ffffff"
          angle={0.6}
          penumbra={1} 
          decay={2}
        />
        
        {/* Fill light */}
        <pointLight
          position={[2, 0, 1]}
          intensity={1}
          color="#ffffff"
        />
        
        {/* Top light */}
        <directionalLight
          position={[0, 3, 0]}
          intensity={0.3}
          color="#ffffff"
        />

        <Face isSpeaking={isSpeaking} />
        
        <OrbitControls 
          enableDamping
          minDistance={2}
          maxDistance={4}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
};

export default VirtualAssistant; 
