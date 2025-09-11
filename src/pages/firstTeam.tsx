import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/searchBar";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const EXIT_ANIMATION_DURATION = 0.7;
const ENTRANCE_ANIMATION_DURATION = 0.7;
const NAVIGATION_DELAY = EXIT_ANIMATION_DURATION * 1000;

const preloadSecondTeam = () => import("./SecondTeam");

export default function FirstTeam() {
    const navigate = useNavigate();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            preloadSecondTeam()
                .then(() => console.log("SecondTeam preloaded"))
                .catch((err) => console.log("Preload failed:", err));
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleTeamASelect = (value: any) => {
        console.log("Team A selected:", value);
        setIsExiting(true);

        setTimeout(() => {
            navigate("/secondTeam", { state: { teamA: value } });
        }, NAVIGATION_DELAY);
    };

    const handleNavigation = () => navigate("/");

    return (
        <motion.div
            className="flex flex-col h-screen w-full overflow-hidden bg-background"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: ENTRANCE_ANIMATION_DURATION, ease: "easeInOut" }}
        >
            <div className="flex flex-col flex-1 items-center justify-center gap-12 px-4">
                <motion.div
                    initial={{ y: -80, opacity: 0 }}
                    animate={isExiting ? { y: -150, opacity: 0 } : { y: 0, opacity: 1 }}
                    transition={{ duration: EXIT_ANIMATION_DURATION, ease: "easeInOut" }}
                    className="text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Make a prediction
                    </h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isExiting ? { opacity: 0, y: -100 } : { opacity: 1, y: 0 }}
                        transition={{ delay: isExiting ? 0 : 0.2, duration: EXIT_ANIMATION_DURATION }}
                        className="text-muted-foreground mt-3 text-lg"
                    >
                        Select your first team to begin
                    </motion.p>
                </motion.div>

                <motion.div
                    initial={{ x: 200, opacity: 0 }}
                    animate={isExiting ? { x: -400, opacity: 0 } : { x: 0, opacity: 1 }}
                    transition={{ duration: EXIT_ANIMATION_DURATION, ease: "easeInOut" }}
                    className="w-full max-w-md"
                >
                    <SearchBar onSelect={handleTeamASelect} />
                </motion.div>
            </div>

            <div className="absolute bottom-4 right-4">
                <Button onClick={handleNavigation}>Go Landing</Button>
            </div>
        </motion.div>
    );
}
