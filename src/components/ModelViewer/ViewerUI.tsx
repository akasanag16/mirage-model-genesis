
import { Loader2, Download } from 'lucide-react';
import { useModelViewer } from './ModelViewerContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ViewerUIProps {
  imageUrl: string | null;
}

export const ViewerUI: React.FC<ViewerUIProps> = ({ imageUrl }) => {
  const { isLoading, isModelReady, exportAsGLB, exportAsGLTF } = useModelViewer();

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

      {isModelReady && !isLoading && (
        <div className="absolute bottom-4 right-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="gradient-border shadow-lg" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export Model
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportAsGLB()}>
                      Export as GLB
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAsGLTF()}>
                      Export as GLTF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download 3D Model</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );
};
