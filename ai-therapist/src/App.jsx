import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import VirtualAssistant from './components/VirtualAssistant';
import { getAIResponse } from './services/ai-service';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  // Create a ref to store the recognition instance
  const recognitionRef = useRef(null);

  // Initialize speech synthesis
  const speechSynthesis = window.speechSynthesis;
  const speak = useCallback((text) => {
    speechSynthesis.cancel(); // Stop any previous speech
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
    }
    
    speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = async (event) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);
      
      if (event.results[current].isFinal) {
        const aiResponse = await getAIResponse(transcriptText);
        setResponse(aiResponse);
        speak(aiResponse);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      setIsListening(false);
    };

    // Cleanup function
    return () => {
      if (recognition) {
        recognition.stop();
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
      speechSynthesis.cancel();
    };
  }, [speak]);

  const toggleListening = useCallback(() => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
        setTranscript('');
      } else {
        setTranscript('');
        setResponse('');
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Failed to start recognition:', error);
          // If recognition is already started, stop it and start again
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
      }
    }
  }, [isListening]);

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
