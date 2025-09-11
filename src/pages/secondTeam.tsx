import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { SearchBar } from "@/components/searchBar";
import { motion } from "framer-motion";
import { useState } from "react";
import ResultDialog from "@/components/resultDialog";


declare global {
    interface Window {
        predictionAPI: {
            predictTeams: (teamOne: string, teamTwo: string) => Promise<{ output: any }>;
        }
    }
}

interface LocationState {
    teamOne: string;
}

// Match the exit animation duration from firstTeam
const EXIT_ANIMATION_DURATION = 0.7; // seconds
const NAVIGATION_DELAY = EXIT_ANIMATION_DURATION * 1000; // convert to milliseconds

export default function SecondTeam() {
    const navigate = useNavigate();
    const [isExiting, setIsExiting] = useState(false);
    const location = useLocation();
    const state = location.state as LocationState; // Type casting
    const teamOne = state?.teamOne;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [predictionData, setPredictionData] = useState(null);

    const handleTeamBSelect = async (teamTwo: string) => {
        setIsLoading(true);
        setIsDialogOpen(true);

        try {
            const result = await window.ipcRenderer.invoke('predict-teams', teamOne!, teamTwo);
            console.log("Prediction successful:", result.output);
            console.log("API returned filepath:", result.filePath);

            if (result.success) {
                const fileResponse = await window.ipcRenderer.invoke('read-prediction-file', result.filePath!);
                if (fileResponse.success) {
                    setPredictionData(fileResponse.data);
                    setIsLoading(false);
                }
            }
        } catch (error: any) {
            console.error("Prediction failed:", error?.error || error);
            if (error?.timeout) {
            console.log("Process timed out - check your Python script performance");
            }
        } finally {
            setIsLoading(false);
        }
    }
    


    const handleBackToTeamA = () => {
        // Start exit animation FIRST
        setIsExiting(true);
        
        // Navigate AFTER exit animation completes
        setTimeout(() => {
            navigate("/firstTeam");
        }, NAVIGATION_DELAY);
    }
    

    return (
        <><motion.div
            className="flex flex-col h-screen w-full overflow-hidden bg-background"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{
                duration: 0.4,
                ease: "easeInOut"
            }}
        >
            <div className="flex flex-col flex-1 items-center justify-center gap-12 px-4">

                {/* Title with upward exit animation matching firstTeam */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={isExiting ? { y: -150, opacity: 0 } : { y: 0, opacity: 1 }}
                    transition={{
                        duration: EXIT_ANIMATION_DURATION,
                        ease: "easeInOut"
                    }}
                    className="text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Select Team B
                    </h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isExiting ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }}
                        transition={{
                            delay: isExiting ? 0 : 0.2,
                            duration: EXIT_ANIMATION_DURATION,
                            ease: "easeInOut"
                        }}
                        className="text-muted-foreground mt-3 text-lg"
                    >
                        Choose your second team for comparison
                    </motion.p>
                </motion.div>

                {/* SearchBar with leftward exit animation matching firstTeam */}
                <motion.div
                    initial={{ x: 200, opacity: 0 }}
                    animate={isExiting ? { x: -400, opacity: 0 } : { x: 0, opacity: 1 }}
                    transition={{
                        duration: EXIT_ANIMATION_DURATION,
                        ease: "easeInOut"
                    }}
                    className="w-full max-w-md"
                >
                    <SearchBar onSelect={handleTeamBSelect} />
                </motion.div>
            </div>

            <div className="absolute bottom-4 right-4">
                <Button onClick={handleBackToTeamA}>Back to Team A</Button>
            </div>
        </motion.div>
            <ResultDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                predictionData={predictionData}
                isLoading={isLoading} 
            />
        </>
    );
}
