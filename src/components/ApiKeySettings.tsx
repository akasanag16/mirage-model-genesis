import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { apiKeyManager, type ApiKeys } from '../utils/apiKeyManager';
import { toast } from 'sonner';

const API_SERVICES: { key: keyof ApiKeys; name: string; description: string }[] = [
  {
    key: 'meshyAi',
    name: 'Meshy AI',
    description: 'Premium 3D model generation with high quality textures'
  },
  {
    key: 'csmAi',
    name: 'CSM AI',
    description: 'Fast and reliable 3D model creation'
  },
  {
    key: 'rodinAi',
    name: 'Hyper3D (Rodin)',
    description: 'Advanced 3D generation with detailed geometry'
  },
  {
    key: 'huggingFace',
    name: 'Hugging Face',
    description: 'Open-source AI models with various capabilities'
  }
];

export const ApiKeySettings: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeys>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<ApiKeys>({});

  useEffect(() => {
    // Load existing keys
    const loadedKeys: ApiKeys = {};
    API_SERVICES.forEach(service => {
      const key = apiKeyManager.getKey(service.key);
      if (key) {
        loadedKeys[service.key] = key;
      }
    });
    setKeys(loadedKeys);
    setTempKeys(loadedKeys);
  }, []);

  const toggleShowKey = (serviceKey: string) => {
    setShowKeys(prev => ({
      ...prev,
      [serviceKey]: !prev[serviceKey]
    }));
  };

  const saveKey = (serviceKey: keyof ApiKeys) => {
    const key = tempKeys[serviceKey]?.trim();
    if (key) {
      apiKeyManager.setKey(serviceKey, key);
      setKeys(prev => ({ ...prev, [serviceKey]: key }));
    } else {
      toast.error('Please enter a valid API key');
    }
  };

  const clearKey = (serviceKey: keyof ApiKeys) => {
    apiKeyManager.clearKey(serviceKey);
    setKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[serviceKey];
      return newKeys;
    });
    setTempKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[serviceKey];
      return newKeys;
    });
  };

  const updateTempKey = (serviceKey: keyof ApiKeys, value: string) => {
    setTempKeys(prev => ({ ...prev, [serviceKey]: value }));
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          API Key Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure API keys for enhanced 3D model generation. Keys are stored locally in your browser.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {API_SERVICES.map(service => (
          <div key={service.key} className="space-y-3 p-4 border rounded-lg">
            <div>
              <Label htmlFor={service.key} className="text-base font-medium">
                {service.name}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {service.description}
              </p>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id={service.key}
                  type={showKeys[service.key] ? 'text' : 'password'}
                  placeholder={`Enter ${service.name} API key`}
                  value={tempKeys[service.key] || ''}
                  onChange={(e) => updateTempKey(service.key, e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleShowKey(service.key)}
                >
                  {showKeys[service.key] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => saveKey(service.key)}
                disabled={!tempKeys[service.key]?.trim()}
              >
                <Save className="h-4 w-4" />
              </Button>
              
              {keys[service.key] && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clearKey(service.key)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {keys[service.key] && (
              <p className="text-sm text-green-600">
                ✓ API key configured
              </p>
            )}
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              apiKeyManager.clearAllKeys();
              setKeys({});
              setTempKeys({});
            }}
          >
            Clear All Keys
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};