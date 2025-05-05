
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelViewerProps {
  imageUrl: string | null;
  className?: string;
}

export const ModelViewer = ({ imageUrl, className }: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const frameIdRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x111827);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.7;
    controlsRef.current = controls;

    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create directional lights
    const directionalLight1 = new THREE.DirectionalLight(0x8b5cf6, 1);
    directionalLight1.position.set(2, 2, 2);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xec4899, 1);
    directionalLight2.position.set(-2, -2, 2);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0x06b6d4, 1);
    directionalLight3.position.set(0, 0, -5);
    scene.add(directionalLight3);

    // Add event listener for mouse movements
    const handleMouseMove = (event: MouseEvent) => {
      // Normalized mouse coordinates (-1 to 1)
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      });
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta && event.gamma) {
        // Beta represents front-to-back tilt
        // Gamma represents left-to-right tilt
        const tiltX = event.gamma / 30; // -1 to 1
        const tiltY = event.beta / 30; // -1 to 1 
        setMousePosition({ x: tiltX, y: tiltY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      // Apply subtle interactive movement based on mouse position if model exists
      if (modelRef.current && isModelReady) {
        // Apply subtle rotation based on mouse position
        const targetRotationY = mousePosition.x * 0.5;
        const targetRotationX = mousePosition.y * 0.5;
        
        modelRef.current.rotation.y += (targetRotationY - modelRef.current.rotation.y) * 0.05;
        modelRef.current.rotation.x += (targetRotationX - modelRef.current.rotation.x) * 0.05;
        
        // Add a gentle floating animation
        modelRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      }

      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    // Handle window resize
    function handleResize() {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    }

    // Start animation loop
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Load or update 3D model when imageUrl changes
  useEffect(() => {
    if (!imageUrl || !sceneRef.current) return;
    
    setIsLoading(true);
    setIsModelReady(false);

    // Mock API call to generate 3D model from image
    const generateModel = () => {
      return new Promise<void>((resolve) => {
        // Simulate loading delay - would be replaced with actual API call
        setTimeout(() => {
          resolve();
        }, 2000); // 2 second mock delay
      });
    };

    // Clear previous model if any
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    // Generate and load model
    generateModel().then(() => {
      // Load placeholder humanoid model
      const loader = new GLTFLoader();
      loader.load(
        // Use a placeholder model URL - in a real app, this would be the result from the API
        'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/anime-girl/model.gltf',
        (gltf) => {
          const model = gltf.scene;
          
          // Center and scale the model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
          
          model.position.sub(center.multiplyScalar(scale));
          
          // Enable shadows
          model.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.castShadow = true;
              node.receiveShadow = true;
              
              // Apply improved materials
              if (node.material) {
                const material = node.material as THREE.MeshStandardMaterial;
                material.roughness = 0.7;
                material.metalness = 0.3;
              }
            }
          });
          
          // Add the model to the scene
          if (sceneRef.current) {
            sceneRef.current.add(model);
            modelRef.current = model;
            setIsModelReady(true);
          }
          
          setIsLoading(false);
        },
        (xhr) => {
          // Show loading progress if needed
          console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
          console.error('An error happened loading the model', error);
          setIsLoading(false);
        }
      );
    });
    
    return () => {
      // Cleanup if component unmounts during loading
    };
  }, [imageUrl]);

  return (
    <Card className={cn('relative overflow-hidden h-full', className)}>
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[400px]"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 text-neon-purple animate-spin" />
            <p className="text-lg font-medium gradient-text">Generating 3D Model...</p>
          </div>
        </div>
      )}
      
      {!imageUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Upload an image to generate a 3D model</p>
        </div>
      )}
    </Card>
  );
};
