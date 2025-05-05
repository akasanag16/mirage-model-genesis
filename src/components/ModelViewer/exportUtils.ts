
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { toast } from 'sonner';

/**
 * Exports the given model as a GLB file and triggers a download
 */
export const exportModelAsGLB = (
  model: THREE.Object3D | null,
  fileName: string = 'model'
): void => {
  if (!model) {
    toast.error("No model to export");
    return;
  }

  try {
    const exporter = new GLTFExporter();
    
    // Clone the model to avoid modifying the original
    const modelToExport = model.clone();
    
    // Export as GLB (binary)
    exporter.parse(
      modelToExport,
      (binary) => {
        // Create a blob from the binary data
        const blob = new Blob([binary as BlobPart], { type: 'application/octet-stream' });
        
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.glb`;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        toast.success("Model exported successfully");
      },
      (error) => {
        console.error('An error occurred while exporting the model:', error);
        toast.error("Failed to export model");
      },
      { binary: true }
    );
  } catch (error) {
    console.error('Error exporting model:', error);
    toast.error("Failed to export model");
  }
};

/**
 * Exports the given model as a GLTF file and triggers a download
 */
export const exportModelAsGLTF = (
  model: THREE.Object3D | null,
  fileName: string = 'model'
): void => {
  if (!model) {
    toast.error("No model to export");
    return;
  }

  try {
    const exporter = new GLTFExporter();
    
    // Clone the model to avoid modifying the original
    const modelToExport = model.clone();
    
    // Export as GLTF (JSON)
    exporter.parse(
      modelToExport,
      (gltf) => {
        // Create a JSON string from the data
        const output = JSON.stringify(gltf, null, 2);
        
        // Create a blob with the JSON data
        const blob = new Blob([output], { type: 'text/plain' });
        
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.gltf`;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        toast.success("Model exported successfully");
      },
      (error) => {
        console.error('An error occurred while exporting the model:', error);
        toast.error("Failed to export model");
      },
      { binary: false }
    );
  } catch (error) {
    console.error('Error exporting model:', error);
    toast.error("Failed to export model");
  }
};
