
import * as THREE from 'three';

/**
 * Sets up the lighting configuration for a 3D scene
 * @param scene The THREE.Scene to add lights to
 */
export const setupLights = (scene: THREE.Scene) => {
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
