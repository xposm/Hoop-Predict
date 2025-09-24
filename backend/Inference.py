import os
import argparse 
import pandas as pd
import numpy as np
import onnxruntime as rt
from joblib import load
from sklearn.metrics import accuracy_score
import warnings
import json
import sys
from datetime import datetime

# Suppress warnings for a cleaner output
warnings.filterwarnings('ignore')

# --- 1. SCRIPT SETUP AND ARGUMENT PARSING ---
print("--- Initializing Prediction Script ---")
parser = argparse.ArgumentParser(description="NCAA Basketball Match Outcome Prediction")
parser.add_argument("--teamOne", type=str, required=True, help="The name of the first team.")
parser.add_argument("--teamTwo", type=str, required=True, help="The name of the second team.")
parser.add_argument("--cuda", action='store_true', help="Flag to use CUDA for inference if available.")
parser.add_argument("--debug", action='store_true', help="Flag to run validation checks on the models.")
args = parser.parse_args()

# --- 2. PATHS AND DATA LOADING ---
PATH = "./"
model_directory = os.path.join(PATH, 'trained_models')
data_path = os.path.join(PATH, 'testing_data')

# Load the trained ONNX models
try:
    print("Loading ONNX models...")
    xgb_model_path = os.path.join(model_directory, "xgboost_model.onnx")
    cat_model_path = os.path.join(model_directory, "catboost_model.onnx")
    nn_model_path = os.path.join(model_directory, "NN_checkpoint.onnx")

    providers = ["CUDAExecutionProvider"] if args.cuda else ['CPUExecutionProvider']
    print(f"Using ONNX Runtime provider: {providers[0]}")
    
    xgb_session = rt.InferenceSession(xgb_model_path, providers=providers)
    cat_session = rt.InferenceSession(cat_model_path, providers=providers)
    nn_session = rt.InferenceSession(nn_model_path, providers=providers)
    print("All models loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    exit()

# Load datasets
print("Loading team data and statistics...")
try:
    mteams_path = os.path.join(data_path, 'MTeams.csv')
    stats_path = os.path.join(data_path, 'DataSource.csv')
    validation_data_path = os.path.join(data_path, 'validation.csv')
    
    Mteams = pd.read_csv(mteams_path)
    TeamStats = pd.read_csv(stats_path)
    validate_df = pd.read_csv(validation_data_path)
    
    TeamStats_2025 = TeamStats[TeamStats['Season'] == 2025].copy()
except FileNotFoundError as e:
    print(f"Data file not found: {e}. Please check your paths.")
    exit()

# --- 3. DATA PREPARATION ---
features = [c for c in validate_df.columns if c not in ['Match', 'Label', 'Unnamed: 0']]
#Just incase the index column screws me over again

# Get common stats for feature engineering
common_stats = [c for c in TeamStats_2025.columns if c not in ['Season', 'TeamID', 'TeamName', 'Unnamed: 0', '7OT', 'JJK', 'RT', 'LMC']]

# Pre-process stats data
TeamStats_2025[common_stats] = TeamStats_2025[common_stats].apply(pd.to_numeric, errors='coerce')
TeamStats_2025.fillna(0, inplace=True)

# Load the scaler
print("Loading data scaler for the Neural Network...")
try:
    scaler_path = os.path.join(model_directory, "std_scaler.joblib")
    scaler = load(scaler_path)
    print("Scaler was successfully loaded.")
except FileNotFoundError:
    print(f'Warning: The scaler was not found at {scaler_path}. NN predictions will not be available.')
    scaler = None
except Exception as e:
    print(f'An error occurred loading the scaler: {e}')
    scaler = None

# --- 4. TEAM ID LOOKUP AND FEATURE ENGINEERING FOR INFERENCE ---
print(f"Looking up Team IDs for '{args.teamOne}' and '{args.teamTwo}' for the 2025 season...")
try:
    TeamOneID = Mteams.loc[Mteams['TeamName'] == args.teamOne, 'TeamID'].iloc[0]
    TeamTwoID = Mteams.loc[Mteams['TeamName'] == args.teamTwo, 'TeamID'].iloc[0]
    print(f"-> {args.teamOne} ID: {TeamOneID}")
    print(f"-> {args.teamTwo} ID: {TeamTwoID}")
except IndexError:
    print(f"Error: Could not find one or both teams for the 2025 season. Please check team names.")
    exit()

# Fetch stats for each team
team_one_stats = TeamStats_2025[TeamStats_2025['TeamID'] == TeamOneID].iloc[0]
team_two_stats = TeamStats_2025[TeamStats_2025['TeamID'] == TeamTwoID].iloc[0]

# Construct the feature row
print("Constructing feature vector for the match...")
new_row = {}
for column in common_stats:
    new_row[f"dif_{column}"] = team_one_stats[column] - team_two_stats[column]
new_row.update(team_one_stats[common_stats].add_prefix("team_a_"))
new_row.update(team_two_stats[common_stats].add_prefix("team_b_"))

input_df = pd.DataFrame([new_row])
input_df = input_df[features] # This is the critical step
X_input = input_df.to_numpy(dtype=np.float32)

# --- 5. RUN INFERENCE ---
print("\n--- Running Inference on All Models ---")
# Get input/output names
xgb_input_name = xgb_session.get_inputs()[0].name
cat_input_name = cat_session.get_inputs()[0].name
nn_input_name = nn_session.get_inputs()[0].name

# Run predictions
xgb_onnx_preds = xgb_session.run(None, {xgb_input_name: X_input})
cat_onnx_preds = cat_session.run(None, {cat_input_name: X_input})

if scaler:
    X_input_scaled = scaler.transform(X_input)
    nn_onnx_preds = nn_session.run(None, {nn_input_name: X_input_scaled})
    prob_nn = float(nn_onnx_preds[0][0][0])
else:
    prob_nn = "N/A (Scaler not found)"

# Extract probabilities
prob_xgb = xgb_onnx_preds[1][0][1]
prob_cat = cat_onnx_preds[1][0][1]

# --- 6. DISPLAY INFERENCE RESULTS ---
print("\n--- Prediction Results ---")
print(f"Match: {args.teamOne} vs. {args.teamTwo}\n")
print(f"Models are predicting the probability of '{args.teamOne}' winning.")
print("-" * 50)
print(f"XGBoost Model Prediction:    {prob_xgb:.2%}")
print(f"CatBoost Model Prediction:   {prob_cat:.2%}")
if isinstance(prob_nn, float):
    print(f"Neural Network Prediction:   {prob_nn:.2%}")
else:
    print(f"Neural Network Prediction:   {prob_nn}")
print("-" * 50)

# Calculate Ensemble Prediction
valid_probs = [p for p in [prob_xgb, prob_cat] if isinstance(p, float)]
if isinstance(prob_nn, float):
    valid_probs.append(prob_nn)

if valid_probs:
    ensemble_prob = sum(valid_probs) / len(valid_probs)
    winner = args.teamOne if ensemble_prob > 0.5 else args.teamTwo
    confidence = ensemble_prob if ensemble_prob > 0.5 else 1 - ensemble_prob
    print("\n--- Final Ensemble Prediction ---")
    print(f"Predicted Winner: {winner}")
    print(f"Confidence:       {confidence:.2%}")
else:
    print("\nCould not calculate an ensemble prediction.")

# ===== JSON OUTPUT CODE =====
# Create structured output data
output_data = {
    "match": f"{args.teamOne} vs. {args.teamTwo}",
    "team_one": args.teamOne,
    "team_two": args.teamTwo,
    "timestamp": datetime.now().isoformat(),
    "predictions": {
        "xgboost": float(prob_xgb),
        "catboost": float(prob_cat),
        "neural_network": float(prob_nn)
    }
}

if valid_probs:
    output_data["ensemble"] = {
        "predicted_winner": winner,
        "confidence": float(confidence),
        "confidence_display": f"{confidence:.2%}",
        "ensemble_probability": float(ensemble_prob)
    }
else:
    output_data["ensemble"] = {
        "error": "Could not calculate ensemble prediction",
        "model_count": 0
    }


# Create a directory to save
timestamp = int(datetime.now().timestamp())

backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
results_dir = os.path.join(parent_dir, "results")
os.makedirs(results_dir, exist_ok=True)

json_filename = f"prediction_{timestamp}.json"
json_output_path = os.path.join(results_dir, json_filename)


print(f"Attempting to save to: {json_output_path}")

# Write JSON to file
try:
    with open(json_output_path, "w", encoding='utf-8') as json_file:
        json.dump(output_data, json_file, indent=4, ensure_ascii=False)
    
    print(f"JSON output saved successfully to: {json_output_path}")
    sys.stdout.flush()
    
except Exception as e:
    print(f"Error saving JSON output: {e}")
    print(f"Attempted path: {json_output_path}")

# --- 7. DEBUG MODE: RUN VALIDATION ---
if args.debug:
    print("\n\n--- RUNNING DEBUG MODE: VALIDATING MODELS ---")
    X_valid = validate_df[features].to_numpy(dtype=np.float32)
    y_valid = validate_df['Label'].values

    # XGBoost Validation
    xgb_val_preds = xgb_session.run(None, {xgb_input_name: X_valid})[0]
    xgb_acc = accuracy_score(y_valid, xgb_val_preds)
    print(f"XGBoost Re-Validated Accuracy: {xgb_acc:.4f}")

    # CatBoost Validation
    cat_val_preds = cat_session.run(None, {cat_input_name: X_valid})[0]
    cat_acc = accuracy_score(y_valid, cat_val_preds)
    print(f"CatBoost Re-Validated Accuracy: {cat_acc:.4f}")

    # Neural Network Validation
    if scaler:
        X_valid_scaled = scaler.transform(X_valid)
        nn_val_preds = nn_session.run(None, {nn_input_name: X_valid_scaled})[0]
        nn_predicted_labels = (nn_val_preds > 0.5).astype(int)
        nn_acc = accuracy_score(y_valid, nn_predicted_labels)
        print(f"NN Re-Validated Accuracy:      {nn_acc:.4f}")
    else:
        print("NN Re-Validation skipped: Scaler not available.")

print("\n--- Script Finished ---")











# import onnxruntime as rt 
# import os
# import argparse 
# import pandas as pd

# PATH = r"D:\NCAA\Final_deployment_seal"
# parser = argparse.ArgumentParser(description="Basketball result (gambling) prediction.")
# parser.add_argument("--teamOne", type=str, help="Who is the first team?")
# parser.add_argument("--teamTwo", type=str, help="Who is the second team?")
# args = parser.parse_args()



# model_directory = os.path.join(PATH,'trained_models')
# xgb_model_path = os.path.join(model_directory, "xgboost_model.onnx")
# cat_model_path = os.path.join(model_directory, "catboost_model.onnx")
# xgb_session = rt.InferenceSession(xgb_model_path, providers=['CPUExecutionProvider'])
# cat_session = rt.InferenceSession(cat_model_path, providers=['CPUExecutionProvider'])
# print("Models loaded successfully.")




# data_path = os.path.join(PATH, 'testing_data')
# Mteams_path = os.path.join(data_path,'MTeams.csv')
# stats_path = os.path.join(data_path,'DataSource.csv')
# Mteams = pd.read_csv(Mteams_path)
# TeamStats = pd.read_csv(stats_path)
# TeamStats = TeamStats[TeamStats['Season'] == 2025]

# TeamOneID = Mteams.loc[
#     (Mteams['TeamName'] == args.teamOne) & (Mteams['Year'] == 2025),
#     'TeamID'
# ].iloc[0]

# TeamTwoID = Mteams.loc[
#     (Mteams['TeamName'] == args.teamTwo) & (Mteams['Year'] == 2025),
#     'TeamID'
# ].iloc[0]

# print(f'{args.teamOne}:{TeamOneID}')
# print(f'{args.teamTwo}:{TeamTwoID}')

# if TeamOneID in TeamStats['TeamID'].values and TeamTwoID in TeamStats['TeamID'].values:
#     exist = True
#     print("Both IDs are in the database.")
# else:
#     print("ERORR. The IDs are not found in the source file. It should not happen.")
#     print("\nCheck string formatting")








# xgb_input_name = xgb_session.get_inputs()[0].name
# xgb_output_names = [output.name for output in xgb_session.get_outputs()]

# cat_input_name = cat_session.get_inputs()[0].name
# cat_output_names = [output.name for output in cat_session.get_outputs()]

# # Run predictions
# xgb_onnx_preds = xgb_session.run(xgb_output_names, {xgb_input_name: X_valid_numpy})
# cat_onnx_preds = cat_session.run(cat_output_names, {cat_input_name: X_valid_numpy})