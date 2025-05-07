
import * as THREE from 'three';

/**
 * Cleans up existing models from the scene to prevent memory leaks
 * @param scene The THREE.Scene to clean
 */
export function cleanupScene(scene: THREE.Scene, newModel: THREE.Object3D) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object !== newModel) {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
  });
  
  scene.clear();
}
