import { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module';

// Matrix background component
const MatrixBackground = () => {
  const { scene } = useThree();
  const particlesCount = 1000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 10 - 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      state.scene.children.forEach((child) => {
        if (child.isPoints) {
          child.geometry.attributes.position.array[i3 + 1] -= 0.01;
          if (child.geometry.attributes.position.array[i3 + 1] < -5) {
            child.geometry.attributes.position.array[i3 + 1] = 5;
          }
          child.geometry.attributes.position.needsUpdate = true;
        }
      });
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};

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

      // Increased scale for bigger avatar
      mesh.scale.set(6, 6, 6);
      mesh.position.set(0, 0, 0); // Adjusted position to center

      // Apply materials
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (child.name.toLowerCase().includes('eye')) {
            child.material = new THREE.MeshPhongMaterial({
              color: new THREE.Color(0xffffff),
              emissive: new THREE.Color(0x111111),
              specular: new THREE.Color(0xffffff),
              shininess: 100,
            });
          } else {
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(0x0088ff),
              emissive: new THREE.Color(0x001133),
              metalness: 0.5,
              roughness: 0.2,
              transmission: 0.4,
              thickness: 0.5,
              opacity: 5,
              transparent: true,
              clearcoat: 1.0,
              clearcoatRoughness: 0.1
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

  // Enhanced mouth animation with proper stopping
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
            
            // If stopped speaking, immediately reset mouth position
            if (!isSpeaking) {
              if (mouthOpenIndex !== undefined) head.morphTargetInfluences[mouthOpenIndex] = 0;
              if (jawOpenIndex !== undefined) head.morphTargetInfluences[jawOpenIndex] = 0;
              if (mouthSmileIndex !== undefined) head.morphTargetInfluences[mouthSmileIndex] = 0.1;
            }
          }

          if (isSpeaking) {
            const time = state.clock.elapsedTime;
            const openAmount = Math.sin(time * 15) * 0.5 + 0.5;
            
            if (mouthOpenIndex !== undefined) {
              head.morphTargetInfluences[mouthOpenIndex] = openAmount * 0.5;
            }
            if (jawOpenIndex !== undefined) {
              head.morphTargetInfluences[jawOpenIndex] = openAmount * 0.3;
            }
            if (mouthSmileIndex !== undefined) {
              head.morphTargetInfluences[mouthSmileIndex] = 0.2;
            }
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
          position: [-1.5, 0.5, 2.5] // Adjusted for centered view
        }}
      >
        <color attach="background" args={['#000000']} />
        
        <MatrixBackground />
        
        {/* Adjusted lighting for centered avatar */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#0088ff" />
        <spotLight
          position={[0, 5, 0]}
          intensity={1}
          color="#00ffff"
          angle={0.5}
          penumbra={1}
        />
        <directionalLight
          position={[0, 10, 5]}
          intensity={0.8}
          color="#ffffff"
        />

        <Face isSpeaking={isSpeaking} />
        
        <OrbitControls
          enableDamping
          minDistance={2} // Adjusted for new scale
          maxDistance={4}
          minAzimuthAngle={-Math.PI / 2}
          maxAzimuthAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 1.8}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
};

export default VirtualAssistant; 
