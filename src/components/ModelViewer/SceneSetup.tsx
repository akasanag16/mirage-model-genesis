
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
    backgroundColor,
    cleanupScene
  } = useModelViewer();

  const animationRef = useRef<number | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Initialize scene - only once
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    console.log('Initializing 3D scene');

    // Create scene
    const newScene = new THREE.Scene();
    // Convert number to THREE.Color
    if (typeof backgroundColor === 'number') {
      newScene.background = new THREE.Color(backgroundColor);
    } else {
      newScene.background = backgroundColor;
    }
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

    // Create renderer - with memory leak prevention
    const newRenderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    newRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    newRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
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
    const handleResizeEvent = () => handleResize();
    window.addEventListener('resize', handleResizeEvent);

    return () => {
      console.log('Cleaning up 3D scene');
      window.removeEventListener('resize', handleResizeEvent);
      
      // Stop animation loop
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Clean up renderer and remove from DOM
      if (newRenderer && containerRef.current) {
        // Force renderer to dispose all resources
        newRenderer.forceContextLoss();
        newRenderer.dispose();
        
        // Remove from DOM
        if (containerRef.current.contains(newRenderer.domElement)) {
          containerRef.current.removeChild(newRenderer.domElement);
        }
      }
      
      // Dispose all controls
      if (newControls) {
        newControls.dispose();
      }
    };
  }, []);

  // Handle background color changes
  useEffect(() => {
    if (scene) {
      // Convert number to THREE.Color
      if (typeof backgroundColor === 'number') {
        scene.background = new THREE.Color(backgroundColor);
      } else {
        scene.background = backgroundColor;
      }
    }
  }, [backgroundColor, scene]);

  // Setup animation loop - with proper cleanup and single animation frame management
  useEffect(() => {
    if (!scene || !camera || !renderer || animationRef.current !== null) return;

    console.log('Setting up animation loop');

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

    // Animation loop with throttling for performance
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    const animate = (timestamp: number) => {
      // Throttle frames for consistent performance
      const elapsed = timestamp - lastFrameTime;
      
      if (elapsed > frameInterval) {
        lastFrameTime = timestamp - (elapsed % frameInterval);
        
        // Apply interactive movement based on mouse position if model exists
        if (model && isModelReady && mousePosition) {
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
      }
      
      // Only continue the loop if we haven't been unmounted
      if (!animationRef.current) return;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationRef.current = requestAnimationFrame(animate);
    setFrameId(animationRef.current);

    // Cleanup
    return () => {
      console.log('Cleaning up animation and event listeners');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        setFrameId(null);
      }
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
      // Ensure camera is a PerspectiveCamera before accessing aspect property
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    }
  };

  return null;
};
