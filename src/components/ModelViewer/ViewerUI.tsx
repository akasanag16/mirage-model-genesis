
import { useState } from 'react';
import { Loader2, Download, Settings, Info } from 'lucide-react';
import { useModelViewer } from './ModelViewerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
            <p className="text-lg font-medium gradient-text">Generating High-Quality 3D Model...</p>
            <p className="text-sm text-muted-foreground">Using multiple AI APIs for best results</p>
          </div>
        </div>
      )}
      
      {!imageUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">Upload an image to generate a 3D model</p>
            <p className="text-sm text-muted-foreground">Powered by Meshy AI, Rodin, CSM, and advanced Hugging Face models</p>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="absolute top-4 right-4 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">API Info</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">API Priority:</p>
                  <div className="space-y-1 text-xs">
                    <p>1. Meshy AI (Premium)</p>
                    <p>2. Rodin AI (Free)</p>
                    <p>3. CSM AI (Free)</p>
                    <p>4. Hugging Face (Free)</p>
                    <p>5. Enhanced Local</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
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
                  Configure API keys for premium 3D model generation services.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="meshy-api">Meshy AI API Key (Premium)</Label>
                  <Input
                    id="meshy-api"
                    placeholder="Enter Meshy AI API key for highest quality"
                    value={meshyApiKey}
                    onChange={(e) => setMeshyApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key at <a href="https://www.meshy.ai" target="_blank" rel="noreferrer" className="text-primary hover:underline">www.meshy.ai</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Free APIs (No setup required):</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">Rodin AI</Badge>
                    <Badge variant="secondary">CSM AI</Badge>
                    <Badge variant="secondary">Hugging Face</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    These APIs are automatically used as fallbacks for free high-quality generation.
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
                      Export High-Quality Model
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
                <p>Download your high-quality 3D model</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </>
  );
};
