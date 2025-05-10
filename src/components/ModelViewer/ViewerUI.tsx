
import { useState } from 'react';
import { Loader2, Download, Settings } from 'lucide-react';
import { useModelViewer } from './ModelViewerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface ViewerUIProps {
  imageUrl: string | null;
}

export const ViewerUI: React.FC<ViewerUIProps> = ({ imageUrl }) => {
  const { isLoading, isModelReady, exportAsGLB, exportAsGLTF } = useModelViewer();
  const [meshyApiKey, setMeshyApiKey] = useState<string>(
    localStorage.getItem('meshyApiKey') || ''
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleExportGLB = () => {
    exportAsGLB();
    toast.success('3D Model exported as GLB');
  };

  const handleExportGLTF = () => {
    exportAsGLTF();
    toast.success('3D Model exported as GLTF');
  };
  
  const saveApiSettings = () => {
    if (meshyApiKey) {
      localStorage.setItem('meshyApiKey', meshyApiKey);
      toast.success('API settings saved successfully');
    } else {
      localStorage.removeItem('meshyApiKey');
      toast.info('Meshy API key removed');
    }
    setSettingsOpen(false);
  };

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

      {!isLoading && (
        <div className="absolute top-4 right-4">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>API Settings</DialogTitle>
                <DialogDescription>
                  Enter your API keys to enhance 3D model quality.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="meshy-api">Meshy AI API Key</Label>
                  <Input
                    id="meshy-api"
                    placeholder="Enter Meshy AI API key"
                    value={meshyApiKey}
                    onChange={(e) => setMeshyApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key at <a href="https://www.meshy.ai" target="_blank" rel="noreferrer" className="text-primary hover:underline">www.meshy.ai</a>
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                <Button onClick={saveApiSettings}>Save Settings</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                      Export 3D Model
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleExportGLB}>
                      Export as GLB
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportGLTF}>
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
