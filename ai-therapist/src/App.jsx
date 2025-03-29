import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import VirtualAssistant from './components/VirtualAssistant';
import { getAIResponse } from './services/ai-service';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Initialize speech synthesis
  const speechSynthesis = window.speechSynthesis;
  const speak = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    // Get available voices and set a neutral/robotic voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Zira') ||
      voice.name.includes('Google UK')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    } else {
      console.warn('Preferred voice not found, using default');
    }
    
    speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = async (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
      
      if (event.results[current].isFinal) {
        const aiResponse = await getAIResponse(transcriptText);
        setResponse(aiResponse);
        speak(aiResponse); // Speak the AI response
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    // Load voices when they're available
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };

    return () => {
      speechSynthesis.cancel(); // Cleanup any ongoing speech
    };
  }, [speak]);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      recognition.onend = () => { // Add this handler
        setIsListening(false);
        setTranscript('');
      };
    } else {
      recognition.start();
      setIsListening(true);
    }
  };
  useEffect(() => {
    // ... existing code ...
    return () => {
      recognition.stop(); // Force stop on unmount
      speechSynthesis.cancel();
    };
  }, [speak]);
  return (
    <div className="app-container">
      <header>
        <h1>AI Health Assistant</h1>
      </header>
      
      <main>
        <div className="assistant-container">
          <VirtualAssistant isSpeaking={isSpeaking} />
        </div>

        <div className="interaction-panel">
          <div className="transcript-box">
            <h3>Your Input:</h3>
            <p>{transcript}</p>
          </div>

          <div className="response-box">
            <h3>Assistant Response:</h3>
            <p>{response}</p>
          </div>

          <button 
            className={`mic-button ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App; 