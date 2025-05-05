
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { useModelViewer } from './ModelViewerContext';

interface SceneSetupProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const SceneSetup: React.FC<SceneSetupProps> = ({ containerRef }) => {
  const {
    setScene,
    setCamera,
    setRenderer,
    setControls,
    setMousePosition,
    setFrameId,
    scene,
    camera,
    renderer,
    controls,
    model,
    isModelReady,
    mousePosition,
    backgroundColor
  } = useModelViewer();

  const animationRef = useRef<number>(0);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const newScene = new THREE.Scene();
    newScene.background = backgroundColor;
    setScene(newScene);

    // Create camera
    const newCamera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    newCamera.position.z = 5;
    setCamera(newCamera);

    // Create renderer
    const newRenderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    newRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    newRenderer.setPixelRatio(window.devicePixelRatio);
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(newRenderer.domElement);
    setRenderer(newRenderer);

    // Create orbit controls
    const newControls = new OrbitControls(newCamera, newRenderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.rotateSpeed = 0.7;
    setControls(newControls);

    // Create lights
    setupLights(newScene);

    // Handle window resize
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (newRenderer && containerRef.current) {
        containerRef.current.removeChild(newRenderer.domElement);
      }
    };
  }, []);

  // Handle background color changes
  useEffect(() => {
    if (scene) {
      scene.background = backgroundColor;
    }
  }, [backgroundColor, scene]);

  // Setup animation loop
  useEffect(() => {
    if (!scene || !camera || !renderer) return;

    // Add event listeners for interaction
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

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Apply interactive movement based on mouse position if model exists
      if (model && isModelReady) {
        // Apply rotation based on mouse position
        const targetRotationY = mousePosition.x * 0.5;
        const targetRotationX = mousePosition.y * 0.5;
        
        model.rotation.y += (targetRotationY - model.rotation.y) * 0.05;
        model.rotation.x += (targetRotationX - model.rotation.x) * 0.05;
        
        // Add floating animation
        model.position.y = Math.sin(Date.now() * 0.001) * 0.1;
      }

      if (controls) controls.update();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    animate();
    setFrameId(animationRef.current);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      cancelAnimationFrame(animationRef.current);
    };
  }, [scene, camera, renderer, controls, model, isModelReady, mousePosition]);

  const setupLights = (scene: THREE.Scene) => {
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
  };

  const handleResize = () => {
    if (containerRef.current && camera && renderer) {
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    }
  };

  return null;
};
