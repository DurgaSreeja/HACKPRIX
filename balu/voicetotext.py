from flask import Flask, request, jsonify
import warnings
warnings.filterwarnings("ignore")
import re
import requests
import json

app = Flask(__name__)

@app.route('/analyze-audio', methods=['POST'])
def analyze_audio():
    DEEPGRAM_API_KEY = "4b842252acb1e9eab2c4c10b0ea6e4b36a60bb93"
    url = "https://api.deepgram.com/v1/listen?detect_language=true&model=enhanced"
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "audio/wav"
    }

    try:
        audio_file = "pondu.opus"  # You can also get this from request.files if uploading
        with open(audio_file, "rb") as f:
            response = requests.post(url, headers=headers, data=f)
        response.raise_for_status()

        result = response.json()

        # Extract transcript
        if "results" in result and "channels" in result["results"]:
            transcript = result["results"]["channels"][0]["alternatives"][0].get("transcript", "")
            happy_words = ['happy', 'joy', 'glad', 'excited', 'wonderful', 'great', 'love', 'smile']
            sad_words = ['sad', 'upset', 'unhappy', 'depressed', 'miserable', 'cry', 'disappointed']

            happy_count = sum(1 for word in happy_words if re.search(r'\b' + word + r'\b', transcript.lower()))
            sad_count = sum(1 for word in sad_words if re.search(r'\b' + word + r'\b', transcript.lower()))

            # Determine emotion
            if happy_count > sad_count:
                emotion = "happy"
            elif sad_count > happy_count:
                emotion = "sad"
            else:
                emotion = "neutral"

            return jsonify({
                "transcript": transcript,
                "emotion": emotion
            }), 200

        else:
            return jsonify({"error": "Transcript structure not found"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
