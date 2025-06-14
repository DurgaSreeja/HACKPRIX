from flask import Flask, request, jsonify
import numpy as np
import librosa
from keras.models import load_model
import joblib



model = load_model('model (1).h5')
enc = joblib.load('encoder.pkl')

def extract_mfcc(filename):
    y, sr = librosa.load(filename, duration=3, offset=0.5)
    mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40).T, axis=0)
    return mfcc

def predict_emotion(audio_file):
    # Extract MFCC features from the audio file
    mfcc = extract_mfcc(audio_file)
    mfcc = mfcc.reshape(1, -1)  # Reshape for the model input (1, 40)

    # Make a prediction
    prediction = model.predict(mfcc)

    # Get the emotion index
    emotion_index = np.argmax(prediction, axis=1)[0]

    # Create a one-hot encoded array for inverse transformation
    one_hot_encoded = np.zeros((1, len(enc.categories_[0])))
    one_hot_encoded[0, emotion_index] = 1  # Set the predicted index to 1

    # Decode the predicted emotion using the loaded encoder
    predicted_emotion = enc.inverse_transform(one_hot_encoded)[0][0]

    return emotion_index, predicted_emotion



app = Flask(__name__)

@app.route('/predict-emotion', methods=['POST'])
def predict_emotion_endpoint():
    if 'audio_file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    audio_file = request.files['audio_file']
    try:
        emotion_index, predicted_emotion = predict_emotion(audio_file)
        return jsonify({"predicted_emotion": predicted_emotion})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)
