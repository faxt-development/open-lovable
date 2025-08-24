import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface LocalPreviewProps {
  projectName: string;
  port?: number;
  output?: string;
  isLoading?: boolean;
}

export default function LocalPreview({
  projectName,
  port = 5173,
  output = '',
  isLoading = false
}: LocalPreviewProps) {
  const [showConsole, setShowConsole] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (port) {
      setPreviewUrl(`http://localhost:${port}`);
    }
  }, [port]);

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">
            {projectName} {port ? `(Port: ${port})` : ''}
          </span>
          {isLoading && (
            <span className="text-xs text-gray-500">Loading...</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConsole(!showConsole)}
          >
            {showConsole ? 'Hide Console' : 'Show Console'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPreview}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className={`flex-grow ${showConsole ? 'h-1/2' : 'h-full'}`}>
        {previewUrl ? (
          <iframe
            key={iframeKey}
            src={previewUrl}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms"
            allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <p className="text-gray-500">Preview not available</p>
          </div>
        )}
      </div>

      {showConsole && (
        <div className="h-1/2 border-t overflow-auto bg-gray-900 text-gray-200 p-2">
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {output || 'No output available'}
          </pre>
        </div>
      )}
    </div>
  );
}
