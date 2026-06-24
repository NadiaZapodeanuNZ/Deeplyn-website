from transformers import AutoTokenizer, AutoModelForSequenceClassification
from deep_translator import GoogleTranslator
import torch
import os
import re

EMOTIONS = ["anger", "disappointment", "disgust", "embarrassment", "excitement",
"fear", "gratitude", "guilt", "happiness", "hope", "jealousy", "joy",
"loneliness", "love", "neutral", "pride", "relief", "sadness", "surprise"]

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "emotion_model")

tokenizer = None
model = None
emotion_id_map = None

def load_model():
    global tokenizer, model
    if model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        model.eval()

def get_emotion_id_map():
    global emotion_id_map
    if emotion_id_map is None:
        from journal.models import Emotion
        emotion_id_map = {}
        for e in Emotion.objects.all():
            emotion_id_map[e.name] = e.id
    return emotion_id_map

def translate_to_english(text):
    try:
        return GoogleTranslator(source='auto', target='en').translate(text)
    except:
        return text

def split_into_chunks(text, max_length=126):
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence_tokens = len(tokenizer.encode(sentence, add_special_tokens=False))

        if sentence_tokens > max_length:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_length = 0
            chunks.append(sentence)
            continue

        if current_length + sentence_tokens > max_length:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_length = sentence_tokens
        else:
            current_chunk.append(sentence)
            current_length += sentence_tokens

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def detect_emotions(text):
    load_model()

    id_map = get_emotion_id_map()

    text = translate_to_english(text)
    chunks = split_into_chunks(text)

    all_probs = []
    for chunk in chunks:
        inputs = tokenizer(chunk, return_tensors="pt", truncation=True, max_length=128)
        with torch.no_grad():
            logits = model(**inputs).logits
            probs = torch.sigmoid(logits / 5.0)
            all_probs.append(probs[0])

    avg_probs = torch.stack(all_probs).mean(dim=0)
    avg_probs = torch.pow(avg_probs, 0.3)

    scores = []
    for index, score in enumerate(avg_probs.tolist()):
        scores.append((EMOTIONS[index], score))

    scores.sort(key=lambda x: x[1], reverse=True)
    top3 = scores[:3]

    result = []
    for name, score in top3:
        result.append({
            "emotion_id": id_map[name],
            "emotion": name,
            "intensity": round(score, 4)
        })

    return result