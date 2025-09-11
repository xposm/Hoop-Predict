import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Settings, CheckCircle, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    electronAPI: {
      clearDirectory: (dirPath: string) => Promise<{
        success: boolean;
        filesDeleted?: number;
        error?: string;
      }>;
    };
  }
}

function SettingsPage() {
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const clearResultsHistory = async (): Promise<void> => {
    setIsClearing(true);
    setMessage('');
    setMessageType('');

    try {
      // Pass the results directory path as a parameter
      const result = await window.ipcRenderer.invoke('clear-directory', './results/');

      if (result.success) {
        setMessage(`Successfully cleared ${result.filesDeleted || 0} result files.`);
        setMessageType('success');
      } else {
        setMessage(result.error || 'Failed to clear results history.');
        setMessageType('error');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <motion.div 
        className="flex items-center gap-4 mb-6"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage application settings and data
          </p>
        </div>
      </motion.div>

      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Clear Results History
            </CardTitle>
            <CardDescription>
              Remove all prediction results from the results directory. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              variant="destructive" 
              onClick={clearResultsHistory}
              disabled={isClearing}
              className="w-full"
            >
              {isClearing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Clearing History...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Results
                </>
              )}
            </Button>

            {message && (
              <Alert className={messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {messageType === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={messageType === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default SettingsPage;
