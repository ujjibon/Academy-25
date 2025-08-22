import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ConnectionErrorProps {
  error: string;
  onRetry: () => Promise<void>;
  isLoading?: boolean;
}

export function ConnectionError({ error, onRetry, isLoading = false }: ConnectionErrorProps) {
  const isConnectionError = error.includes('connection') || error.includes('unavailable') || error.includes('offline');
  
  return (
    <Alert variant="destructive" className="border-orange-200 bg-orange-50 text-orange-800">
      <div className="flex items-start gap-3">
        {isConnectionError ? (
          <WifiOff className="h-5 w-5 mt-0.5 text-orange-600" />
        ) : (
          <AlertCircle className="h-5 w-5 mt-0.5 text-orange-600" />
        )}
        <div className="flex-1">
          <AlertTitle className="text-orange-800">
            {isConnectionError ? 'Connection Error' : 'Error'}
          </AlertTitle>
          <AlertDescription className="text-orange-700 mt-1">
            {error}
          </AlertDescription>
          <div className="mt-3">
            <Button
              onClick={onRetry}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Retrying...' : 'Retry Connection'}
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
}
