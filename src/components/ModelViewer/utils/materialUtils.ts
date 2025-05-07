
import * as THREE from 'three';

/**
 * Creates a high quality material using the provided textures
 * @param texture Base color texture
 * @param displacementMap Displacement map texture
 * @param normalMap Normal map texture
 * @returns A configured MeshStandardMaterial
 */
export function createHighQualityMaterial(
  texture: THREE.Texture,
  displacementMap: THREE.Texture,
  normalMap: THREE.Texture
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    roughness: 0.4,
    metalness: 0.3,
    displacementMap: displacementMap,
    displacementScale: 0.5,
    bumpMap: displacementMap,
    bumpScale: 0.05,
    normalMap: normalMap,
    normalScale: new THREE.Vector2(1.5, 1.5),
    envMapIntensity: 1.0
  });
}

/**
 * Adds an environment map to the scene for better reflections
 * @param scene The THREE.Scene to add the environment to
 * @param material The material to apply the environment map to
 */
export function addEnvironmentMap(scene: THREE.Scene, material: THREE.MeshStandardMaterial) {
  // Create a simple environment map
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
  const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
  
  // Add a simple skybox
  const cubeTexture = new THREE.CubeTexture([]);
  cubeTexture.format = THREE.RGBAFormat;
  cubeTexture.needsUpdate = true;
  
  // Simple procedural environment mapping
  const colors = [
    new THREE.Color(0x111122), // right
    new THREE.Color(0x112211), // left
    new THREE.Color(0x221111), // top
    new THREE.Color(0x111122), // bottom
    new THREE.Color(0x112211), // front
    new THREE.Color(0x221111)  // back
  ];
  
  // Create canvas textures for each cube face
  cubeTexture.image = [];
  for (let i = 0; i < 6; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      // Create a simple gradient for each face
      const gradient = context.createLinearGradient(0, 0, 128, 128);
      gradient.addColorStop(0, colors[i].getStyle());
      gradient.addColorStop(1, '#000000');
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
    }
    cubeTexture.image.push(canvas);
  }
  
  // Set the environment map
  scene.background = new THREE.Color(0x111827); // Keep original background
  material.envMap = cubeRenderTarget.texture;
  material.envMapIntensity = 0.5; // Subtle reflection
  material.needsUpdate = true;
}
