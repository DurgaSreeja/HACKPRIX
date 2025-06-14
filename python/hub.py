from flask import Flask, request, jsonify,render_template,send_file
from flask_cors import CORS
import pyttsx3
import os
from playsound import playsound
import torch
from torchvision import transforms
from PIL import Image
import base64
import google.generativeai as genai
import numpy as np
import librosa
from keras.models import load_model
import joblib
import warnings
warnings.filterwarnings("ignore")
import re
import requests
import json
# so 
app = Flask(__name__)
CORS(app) 

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


genai.configure(api_key="AIzaSyBWG53DzCscQUFgUhYp1Nufa3tw9NfsfmA")
model = genai.GenerativeModel('gemini-1.5-flash')

# Load the best saved model1
model1 = torch.load('.\\best_vit_fer2013_model.pt', map_location=torch.device('cpu'))  # Change 'cpu' to 'cpu' if using GPU
model1.eval()  # Set the model1 to evaluation mode


# Define the emotion labels (FER-2013 dataset has 7 emotions)
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']

# Define the image transformation (same as used during training)
transform = transforms.Compose([
    transforms.Resize((224, 224)),  # Resizing the image to match model1 input
    transforms.Grayscale(num_output_channels=3),  # Convert to 3-channel grayscale (if needed)
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalization
])

# Load and preprocess the image
def preprocess_image(image_path):
    image = Image.open(image_path)
    image = transform(image)
    image = image.unsqueeze(0)  # Add batch dimension
    return image

# Predict emotion
def predict_emotion(image_path):
    image = preprocess_image(image_path)
    with torch.no_grad():
        image = image.to('cpu')  # If you use GPU, change to .to('cpu')
        outputs = model1(image).logits  # Forward pass
        _, predicted = torch.max(outputs, 1)  # Get the class with the highest score
        predicted_class = predicted.item()

    emotion_label = emotion_labels[predicted_class]  # Map the predicted index to the class label
    return emotion_label

@app.route("/upload", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]

    if file.filename == "":    
        return jsonify({"error": "No selected file"}), 400

    # Save the file to the upload folder
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    emotion = predict_emotion(file_path)
    print(f'Predicted emotion: {emotion}')
    return {'resopnse': emotion}


# model2 = load_model(r"C:\Users\Durga Sreeja\EmbraceMindApp\python\content\model (1).h5")
# enc = joblib.load(r"C:\Users\Durga Sreeja\EmbraceMindApp\python\content\encoder.pkl")

# def extract_mfcc(filename):
#     converted_file = convert_audio(filename)
#     y, sr = librosa.load(converted_file, duration=3, offset=0.5)
#     mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
#     return mfcc

# from pydub import AudioSegment

# def convert_audio(file_path):
#     sound = AudioSegment.from_file(file_path)
#     new_file_path = "converted_audio.wav"
#     sound.export(new_file_path, format="wav")
#     return new_file_path



# @app.route('/analyze-audio', methods=['POST'])
# def analyze_audio():
#     if 'audio' not in request.files:
#         return jsonify({"response": "No audio file uploaded"}), 400

#     audio_file = request.files['audio']
    
#     if audio_file:
#         # Save the file for further processing (if needed)
#         audio_file.save("uploaded_audio.wav")
#         print("Success: Audio file received and saved.") 
#         mfcc = extract_mfcc("uploaded_audio.wav")
#         mfcc = mfcc.reshape(1, -1)
#         prediction = model.predict(mfcc)
#         emotion_index = np.argmax(prediction, axis=1)[0]
#         one_hot_encoded = np.zeros((1, len(enc.categories_[0])))
#         one_hot_encoded[0, emotion_index] = 1  # Set the predicted index to 1

#         # # Decode the predicted emotion using the loaded encoder
#         predicted_emotion = enc.inverse_transform(one_hot_encoded)[0][0]


#         return jsonify({"response": predicted_emotion}), 200
#     else:
#         return jsonify({"response": "Failed to receive audio"}), 400

@app.route('/analyze-audio', methods=['POST'])
def analyze_audio():
    if 'audio' not in request.files:
        return jsonify({"response": "No audio file uploaded"}), 400

    audio_file = request.files['audio']
    
    if audio_file:
        # Save the file for further processing (if needed)
        audio_file.save("uploaded_audio.wav")
        print("Success: Audio file received and saved.") 
        DEEPGRAM_API_KEY = "8208c1d1439b94074a4703cc7277f9969414655e"
        url = "https://api.deepgram.com/v1/listen?detect_language=true&model=enhanced"
        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/wav"
        }
        try:
            audio_file = "uploaded_audio.wav"
            with open(audio_file, "rb") as f:
                response = requests.post(url, headers=headers, data=f)
        
            response.raise_for_status()
            result = response.json()
        
        # Extract transcript
            if "results" in result and "channels" in result["results"]:
                transcript = result["results"]["channels"][0]["alternatives"][0].get("transcript", "")
                
                # Simple sentiment analysis based on keywords
                happy_words = ['happy', 'joy', 'glad', 'excited', 'wonderful', 'great', 'love', 'smile']
                sad_words = ['sad', 'upset', 'unhappy', 'depressed', 'miserable', 'cry', 'disappointed']
                
                # Count occurrences of emotion words
                happy_count = sum(1 for word in happy_words if re.search(r'\b' + word + r'\b', transcript.lower()))
                sad_count = sum(1 for word in sad_words if re.search(r'\b' + word + r'\b', transcript.lower()))
                
                # Determine emotion
                if happy_count > sad_count:
                    emotion = "happy"
                elif sad_count > happy_count:
                    emotion = "sad"
                else:
                    emotion = "neutral"
                    
                print("\n🎭 *Detected Transcript:*")
                print(f'"{transcript}"')
                print("\n🎭 *Emotion Analysis:*")
                print(json.dumps({"emotion": emotion}, indent=2))
                
                return jsonify({"response": emotion}), 200
            
            else:
                print("\n❓ Transcript data not found in expected structure.")
                
        except Exception as e:
            print(f"\n❌ Error: {e}")
            
    else:
        return jsonify({"response": "Failed to receive audio"}), 400



@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get("text")
    print(user_input)

    if not user_input:
        return jsonify({"error": "No text input provided"}), 400

    try:
        print(user_input)
        # Get chat response from Gemini
        chat = model.start_chat(history=[])
        response = chat.send_message(user_input)
        print(response.text)
        
        return jsonify({
            "text": response.text
        })

    except Exception as e:
        print("Error in processing:", e)
        return jsonify({"error": "Failed to process the request"}), 500




@app.route("/generate-story", methods=["POST"])
def story():
    return { "data": { "story": "Generated story text" } }





if __name__ == "__main__":
    app.run(debug=True,port=7000)