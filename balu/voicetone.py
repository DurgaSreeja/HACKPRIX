from transformers import pipeline

# Load the speech emotion recognition pipeline
emotion_pipeline = pipeline(
    task="audio-classification",
    model="superb/hubert-large-superb-er"
)

# Run on your audio file (ensure it's mono, 16kHz wav)
result = emotion_pipeline("nethaji.wav")

# Display results
for r in result:
    print(f"Label: {r['label']}, Score: {r['score']:.4f}")