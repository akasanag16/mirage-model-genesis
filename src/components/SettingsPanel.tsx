import React, { useState } from 'react';
import { Settings, Key, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ApiKeySettings } from './ApiKeySettings';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const SettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            3D Model Generator Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Information
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="mt-6">
            <ApiKeySettings />
          </TabsContent>
          
          <TabsContent value="info" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This 3D model generator uses multiple AI services in sequence to convert your 2D images into 3D models:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">1. Hugging Face (Free)</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Open-source AI models - no API key required
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">2. Hyper3D (Rodin) - Optional API Key</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Advanced 3D generation with detailed geometry
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">3. CSM AI - Optional API Key</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fast and reliable 3D model creation
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">4. Meshy AI - Optional API Key</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Premium service with high-quality textures
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">5. Enhanced Local Generation (Fallback)</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Advanced displacement mapping - always available
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      💡 Pro Tip
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      For best results, use high-contrast images with clear subjects. 
                      API keys are optional but provide better quality results.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• API keys are stored locally in your browser</li>
                    <li>• No data is sent to our servers</li>
                    <li>• Images are processed directly by AI services</li>
                    <li>• You can clear your API keys at any time</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};