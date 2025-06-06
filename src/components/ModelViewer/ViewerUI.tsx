
import { useState, useEffect } from 'react';
import { Loader2, Download, Settings, Info, RotateCcw, Repeat, Award, X } from 'lucide-react';
import { useModelViewer } from './ModelViewerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress'; 
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
  const { 
    isLoading, 
    isModelReady, 
    exportAsGLB, 
    exportAsGLTF,
    modelSource,
    cancelAllRequests,
    cleanupScene,
    apiPriority,
    setApiPriority,
    activeApi
  } = useModelViewer();
  
  const [meshyApiKey, setMeshyApiKey] = useState<string>(
    localStorage.getItem('meshyApiKey') || ''
  );
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Simulated progress for better user experience
  useEffect(() => {
    let intervalId: number;
    
    if (isLoading) {
      setProgress(10); // Start at 10%
      
      intervalId = window.setInterval(() => {
        setProgress(prevProgress => {
          // Slower progress increase as we get higher
          if (prevProgress < 30) return prevProgress + 3;
          if (prevProgress < 60) return prevProgress + 2;
          if (prevProgress < 85) return prevProgress + 0.5;
          return prevProgress;
        });
      }, 1000);
    } else {
      setProgress(0);
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isLoading]);

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
  
  const handleRetry = () => {
    setRetryLoading(true);
    
    // Clean up existing model and scene
    cleanupScene();
    
    // Force page refresh
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  const handleCancel = () => {
    cancelAllRequests();
    cleanupScene();
    toast.info('3D Generation cancelled');
  };
  
  const getApiStatus = (apiName: string): string => {
    if (activeApi === apiName) return 'Processing...';
    if (modelSource === apiName) return 'Success';
    
    const apiIndex = apiPriority.indexOf(apiName);
    const currentApiIndex = apiPriority.indexOf(activeApi || '');
    
    if (apiIndex < currentApiIndex) return 'Failed';
    if (apiIndex > currentApiIndex) return 'Waiting...';
    
    return 'Waiting...';
  };
  
  const getModelSourceBadge = () => {
    if (!modelSource) return null;
    
    let color = "";
    let icon = null;
    let label = "";
    
    switch (modelSource) {
      case 'meshy':
        color = "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
        icon = <Award className="h-3 w-3 mr-1" />;
        label = "Premium Meshy AI";
        break;
      case 'rodin':
        color = "bg-blue-500 text-white";
        label = "Rodin AI";
        break;
      case 'csm':
        color = "bg-green-500 text-white";
        label = "CSM AI";
        break;
      case 'huggingface':
        color = "bg-yellow-500 text-white";
        label = "Hugging Face";
        break;
      case 'local':
        color = "bg-gray-500 text-white";
        label = "Local Generation";
        break;
      default:
        color = "bg-gray-500 text-white";
        label = modelSource;
    }
    
    return (
      <div className="absolute top-4 left-4 flex gap-2">
        <Badge className={`${color} px-2 py-1 flex items-center`}>
          {icon}
          {label}
        </Badge>
      </div>
    );
  };

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-6 max-w-md px-6">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-neon-purple animate-spin" />
              {activeApi && (
                <Button 
                  variant="destructive"
                  size="icon" 
                  className="h-6 w-6 absolute -top-2 -right-2 rounded-full" 
                  onClick={handleCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="space-y-2 w-full">
              <p className="text-lg font-medium gradient-text text-center">
                Generating High-Quality 3D Model
              </p>
              <Progress value={progress} className="h-2 w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Trying multiple AI services in sequence for best results
              </p>
            </div>
            
            <div className="flex flex-col gap-2 w-full">
              <div className={`flex items-center justify-between px-3 py-2 rounded-md ${activeApi === 'meshy' ? 'bg-primary/20' : 'bg-black/30'}`}>
                <span className="text-xs flex items-center">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 mr-2 h-5 w-5 flex items-center justify-center p-0">1</Badge>
                  Meshy AI (Premium)
                </span>
                <span className={`text-xs ${activeApi === 'meshy' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {meshyApiKey ? getApiStatus('meshy') : 'Skipped (No API key)'}
                </span>
              </div>
              <div className={`flex items-center justify-between px-3 py-2 rounded-md ${activeApi === 'rodin' ? 'bg-primary/20' : 'bg-black/30'}`}>
                <span className="text-xs flex items-center">
                  <Badge className="bg-blue-500 mr-2 h-5 w-5 flex items-center justify-center p-0">2</Badge>
                  Rodin AI
                </span>
                <span className={`text-xs ${activeApi === 'rodin' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {getApiStatus('rodin')}
                </span>
              </div>
              <div className={`flex items-center justify-between px-3 py-2 rounded-md ${activeApi === 'csm' ? 'bg-primary/20' : 'bg-black/30'}`}>
                <span className="text-xs flex items-center">
                  <Badge className="bg-green-500 mr-2 h-5 w-5 flex items-center justify-center p-0">3</Badge>
                  CSM AI
                </span>
                <span className={`text-xs ${activeApi === 'csm' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {getApiStatus('csm')}
                </span>
              </div>
              <div className={`flex items-center justify-between px-3 py-2 rounded-md ${activeApi === 'huggingface' ? 'bg-primary/20' : 'bg-black/30'}`}>
                <span className="text-xs flex items-center">
                  <Badge className="bg-yellow-500 mr-2 h-5 w-5 flex items-center justify-center p-0">4</Badge>
                  Hugging Face
                </span>
                <span className={`text-xs ${activeApi === 'huggingface' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {getApiStatus('huggingface')}
                </span>
              </div>
              <div className={`flex items-center justify-between px-3 py-2 rounded-md ${activeApi === 'local' ? 'bg-primary/20' : 'bg-black/30'}`}>
                <span className="text-xs flex items-center">
                  <Badge className="bg-gray-500 mr-2 h-5 w-5 flex items-center justify-center p-0">5</Badge>
                  Local Fallback
                </span>
                <span className={`text-xs ${activeApi === 'local' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {getApiStatus('local')}
                </span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="mt-2"
            >
              Cancel Generation
            </Button>
          </div>
        </div>
      )}
      
      {!imageUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <p className="text-lg text-white">Upload an image to generate a 3D model</p>
            <p className="text-sm text-muted-foreground">
              We use multiple AI services for highest quality results:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500">
                <Award className="h-3 w-3 mr-1" />
                Meshy AI (Premium)
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 border-blue-500">Rodin AI</Badge>
              <Badge variant="outline" className="bg-green-500/10 border-green-500">CSM AI</Badge>
              <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500">Hugging Face</Badge>
            </div>
          </div>
        </div>
      )}

      {getModelSourceBadge()}

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
                <div className="space-y-2">
                  <p className="font-medium">API Priority:</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">1</Badge>
                      <span>Meshy AI (Premium)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">2</Badge>
                      <span>Rodin AI (Free)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">3</Badge>
                      <span>CSM AI (Free)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500">4</Badge>
                      <span>Hugging Face (Free)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-500">5</Badge>
                      <span>Enhanced Local</span>
                    </div>
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
                  <p className="text-sm font-medium">Model Quality Settings:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <span className="mr-2">🔍</span> Standard
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start bg-secondary/40">
                      <span className="mr-2">✨</span> High Quality
                    </Button>
                  </div>
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
          
          {imageUrl && !isLoading && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full" 
                    onClick={handleRetry}
                    disabled={retryLoading}
                  >
                    {retryLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Repeat className="h-4 w-4" />
                    )}
                    <span className="sr-only">Retry Generation</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Try generating the model again</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {isModelReady && !isLoading && (
        <>
          <div className="absolute bottom-4 right-4 flex gap-2">
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
                  <p>Download your 3D model</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="absolute bottom-4 left-4">
            <p className="text-xs text-muted-foreground">
              Drag to rotate • Scroll to zoom • Double-click to reset
            </p>
          </div>
        </>
      )}
    </>
  );
};
