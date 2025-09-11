import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trophy, Target, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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

interface ResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  predictionData: PredictionData | null;
  isLoading?: boolean;
  error?: string | null;
}

const ResultDialog = React.forwardRef<HTMLDivElement, ResultDialogProps>(
  ({ isOpen, onClose, predictionData, isLoading = false, error = null }, ref) => {
    
    console.log("ResultDialog render:", { isOpen, predictionData, isLoading, error });

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent ref={ref} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Prediction Results
            </DialogTitle>
          </DialogHeader>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Running Inference</h3>
                <p className="text-muted-foreground">
                  This may take a few seconds...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="py-6 text-center space-y-4">
              <div className="text-red-500 text-lg font-semibold">
                Prediction Failed
              </div>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          )}

          {/* Success State - Results */}
          {predictionData && !isLoading && !error && (
            <div className="space-y-6">
              
              {/* Match Title */}
              <div className="text-center">
                <h2 className="text-2xl font-bold">{predictionData.match}</h2>
                <p className="text-muted-foreground mt-2">
                  Models are predicting the probability of '{predictionData.team_one}' winning.
                </p>
              </div>

              <Separator />

              {/* Model Predictions */}
              <div className="bg-muted/50 p-6 rounded-lg font-mono text-sm space-y-2">
                <div className="flex justify-between">
                  <span>XGBoost Model Prediction:</span>
                  <span className="font-bold">{(predictionData.predictions.xgboost * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>CatBoost Model Prediction:</span>
                  <span className="font-bold">{(predictionData.predictions.catboost * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Neural Network Prediction:</span>
                  <span className="font-bold">{(predictionData.predictions.neural_network * 100).toFixed(2)}%</span>
                </div>
              </div>

              <Separator />

              {/* Final Ensemble Prediction */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg font-semibold">Final Ensemble Prediction</h3>
                </div>
                
                <div className="bg-primary/10 p-6 rounded-lg space-y-3">
                  <div>
                    <span className="text-muted-foreground">Predicted Winner:</span>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {predictionData.ensemble.predicted_winner}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <div className="text-xl font-semibold mt-1">
                      {predictionData.ensemble.confidence_display}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4">
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

ResultDialog.displayName = "ResultDialog";

export default ResultDialog;
