
import { Loader2 } from 'lucide-react';
import { useModelViewer } from './ModelViewerContext';

interface ViewerUIProps {
  imageUrl: string | null;
}

export const ViewerUI: React.FC<ViewerUIProps> = ({ imageUrl }) => {
  const { isLoading } = useModelViewer();

  return (
    <>
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
    </>
  );
};
