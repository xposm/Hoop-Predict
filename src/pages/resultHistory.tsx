// src/pages/resultHistory.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import ResultDialog from '@/components/resultDialog'; // Reuse existing dialog!
import { motion } from 'framer-motion';

interface PredictionFile {
  filename: string;
  filepath: string;
  timestamp: number;
  date: string;
}

interface PredictionData {
  match: string;
  team_one: string;
  team_two: string;
  predictions: {
    xgboost: number;
    catboost: number;
    neural_network: number;
  };
  ensemble: {
    predicted_winner: string;
    confidence: number;
    confidence_display: string;
  };
}

interface ListFilesApiResponse {
  success: boolean;
  files?: PredictionFile[];
  count?: number;
  error?: string;
  code?: string;
}

interface ReadFileApiResponse {
  success: boolean;
  data?: PredictionData;
  error?: string;
  code?: string;
}

export default function ResultHistory(): JSX.Element {
  const navigate = useNavigate();
  
  // File list state
  const [predictionFiles, setPredictionFiles] = useState<PredictionFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog state - reuse existing ResultDialog component!
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [dialogLoading, setDialogLoading] = useState<boolean>(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionData | null>(null);

  useEffect((): void => {
    loadPredictionFileList();
  }, []);

  const loadPredictionFileList = async (): Promise<void> => {
    try {
      console.log('Loading prediction file list...');
      const response: ListFilesApiResponse = await window.ipcRenderer.invoke('list-prediction-files');
      
      if (response.success && response.files) {
        setPredictionFiles(response.files);
        console.log(`Loaded ${response.files.length} prediction files`);
      } else {
        setError(response.error || 'Failed to load prediction files');
      }
    } catch (err: unknown) {
      const errorMessage: string = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading prediction files:', err);
      setError(`Failed to load prediction history: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredictionClick = async (file: PredictionFile): Promise<void> => {
    console.log(`Loading prediction: ${file.filename}`);
    
    // Open dialog immediately and start loading
    setIsDialogOpen(true);
    setDialogLoading(true);
    setDialogError(null);
    setSelectedPrediction(null);
    
    try {
      const response: ReadFileApiResponse = await window.ipcRenderer.invoke('read-prediction-file', file.filepath);

      if (response.success && response.data) {
        setSelectedPrediction(response.data);
        console.log('Prediction loaded successfully');
      } else {
        setDialogError(response.error || 'Failed to load prediction data');
      }
    } catch (err: unknown) {
      const errorMessage: string = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading prediction:', err);
      setDialogError(`Failed to load prediction: ${errorMessage}`);
    } finally {
      setDialogLoading(false);
    }
  };

  const closeDialog = (): void => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setSelectedPrediction(null);
      setDialogError(null);
      setDialogLoading(false);
    }, 300);
  };

  const formatDate = (timestamp: number): string => {
    const date: Date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseMatchFromFilename = (filename: string): string => {
    // Try to extract match info from filename if available
    // Format might be: prediction_TeamA_vs_TeamB_timestamp.json
    const parts: string[] = filename.replace('prediction_', '').replace('.json', '').split('_');
    if (parts.length >= 3) {
      const timestamp: string = parts[parts.length - 1];
      const matchParts: string[] = parts.slice(0, -1);
      return matchParts.join(' ').replace(/_vs_/g, ' vs ');
    }
    return 'Match Details'; // Fallback
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading prediction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                Go Home
              </Button>
              <Button onClick={loadPredictionFileList}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (predictionFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>No Prediction History</CardTitle>
            <CardDescription>You haven't made any predictions yet</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/firstTeam')}>
              Make Your First Prediction
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
  <div className="container mx-auto py-4 px-4">
    
    {/* Header - slides in from left */}
    <motion.div 
      className="flex items-center gap-4 mb-4"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.6, 
        ease: "easeOut"
      }}
    >
      <div>
        <h1 className="text-3xl font-bold">Prediction History</h1>
        <p className="text-muted-foreground">
          {predictionFiles.length} prediction{predictionFiles.length !== 1 ? 's' : ''} found
        </p>
      </div>
    </motion.div>

    {/* Carousel - slides up from way down at bottom of screen */}
    <motion.div 
      className="max-w-2xl mx-auto"
      initial={{ opacity: 0, y: "100vh" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 1.2, 
        delay: 0.3,
        ease: "easeOut"
      }}
    >
      <Carousel orientation="vertical" className="w-full">
        <CarouselContent className="-mt-1 h-[calc(100vh-200px)]">
          {predictionFiles.map((file: PredictionFile, index: number) => (
            <CarouselItem key={file.filename} className="pt-1 basis-auto">
              
              {/* Clickable Card Button */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                onClick={() => handlePredictionClick(file)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-4 w-4" />
                        {formatDate(file.timestamp)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {parseMatchFromFilename(file.filename)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    Click to view detailed results
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {/* Pagination Info */}
      <div className="flex justify-center mt-4">
      </div>
    </motion.div>

    {/* Reuse Existing ResultDialog Component */}
    <ResultDialog
      isOpen={isDialogOpen}
      onClose={closeDialog}
      predictionData={selectedPrediction}
      isLoading={dialogLoading}
      error={dialogError}
    />
  </div>
)}
