import React from "react";
import { useLocation } from "react-router-dom";

type ModelPrediction = { name: string; probability: number };
type MatchPrediction = {
    teamA: string;
    teamB: string;
    modelsA: ModelPrediction[];
    modelsB: ModelPrediction[];
};

const horizontalScale = 1.5;
const verticalScale = 0.7;
const verticalOffset = 40;

export default function ResultPage() {
    const location = useLocation();
    const { teamA, teamB } = location.state || { teamA: "Team A", teamB: "Team B" };

    // Dummy models for demonstration
    const match: MatchPrediction = {
        teamA,
        teamB,
        modelsA: [
            { name: "XGBoost", probability: 60 },
            { name: "CatBoost", probability: 65 },
            { name: "Neural Network", probability: 63 },
        ],
        modelsB: [
            { name: "XGBoost", probability: 40 },
            { name: "CatBoost", probability: 35 },
            { name: "Neural Network", probability: 37 },
        ],
    };

    const calculateAverage = (models: ModelPrediction[]) =>
        Math.round(models.reduce((sum, m) => sum + m.probability, 0) / models.length);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                fontFamily: "sans-serif",
                backgroundImage: "url('/kobe.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
            }}
        >
            <div
                style={{
                    padding: `${2 * verticalScale}rem ${2.5 * horizontalScale}rem`,
                    width: "90%",
                    maxWidth: `${400 * horizontalScale}px`,
                    borderRadius: `${8 * verticalScale}px`,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                    textAlign: "center",
                    transform: `translateY(${verticalOffset}px)`,
                    color: "#000", // All text inside black
                }}
            >
                <h1
                    style={{
                        marginBottom: `${2 * verticalScale}rem`,
                        fontSize: `${1.5 * verticalScale}rem`,
                        color: "#000",
                    }}
                >
                    Prediction Result
                </h1>

                {[match.teamA, match.teamB].map((team, index) => {
                    const models = index === 0 ? match.modelsA : match.modelsB;
                    const color = index === 0 ? "#4caf50" : "#f44336";
                    const average = calculateAverage(models);

                    return (
                        <div key={team} style={{ marginBottom: `${2 * verticalScale}rem`, color: "#000" }}>
                            <h2 style={{ marginBottom: `${0.5 * verticalScale}rem`, color: "#000" }}>{team}</h2>

                            {/* Overall probability */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: `${0.5 * verticalScale}rem`,
                                    fontSize: `${1 * verticalScale}rem`,
                                    fontWeight: "bold",
                                    color: "#000",
                                }}
                            >
                                <span>Overall</span>
                                <span>{average}%</span>
                            </div>
                            <div
                                style={{
                                    background: "#ccc",
                                    borderRadius: `${4 * verticalScale}px`,
                                    height: `${20 * verticalScale}px`,
                                    width: "100%",
                                    marginBottom: `${1 * verticalScale}rem`,
                                }}
                            >
                                <div
                                    style={{
                                        width: `${average}%`,
                                        background: color,
                                        height: "100%",
                                        borderRadius: `${4 * verticalScale}px`,
                                        transition: "width 0.5s ease-in-out",
                                    }}
                                />
                            </div>

                            {/* Individual models */}
                            {models.map((model) => (
                                <div key={model.name} style={{ marginBottom: `${0.5 * verticalScale}rem`, color: "#000" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: `${0.3 * verticalScale}rem`,
                                            fontSize: `${1 * verticalScale}rem`,
                                            color: "#000",
                                        }}
                                    >
                                        <span>{model.name}</span>
                                        <span>{model.probability}%</span>
                                    </div>
                                    <div
                                        style={{
                                            background: "#eee",
                                            borderRadius: `${4 * verticalScale}px`,
                                            height: `${20 * verticalScale}px`,
                                            width: "100%",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${model.probability}%`,
                                                background: color,
                                                height: "100%",
                                                borderRadius: `${4 * verticalScale}px`,
                                                transition: "width 0.5s ease-in-out",
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
