import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import VirtualAssistant from './components/VirtualAssistant';
import { getAIResponse } from './services/ai-service';
import { FaMicrophone, FaUser, FaRobot } from 'react-icons/fa';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Create a ref to store the recognition instance
  const recognitionRef = useRef(null);

  // Initialize speech synthesis
  const speechSynthesis = window.speechSynthesis;
  const speak = useCallback((text) => {
    if (!text) return;
    
    speechSynthesis.cancel(); // Stop any previous speech
    
    // Small delay to ensure previous speech is cancelled
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
      };
      
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
    }, 100);
  }, []);

  // Load chat history from localStorage on initial render
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

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
        // Create context from previous messages
        const contextMessages = chatHistory
          .slice(-4) // Get last 4 messages for context
          .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n');

        // Add user message to chat history
        const newUserMessage = { type: 'user', text: transcriptText };
        setChatHistory(prev => [...prev, newUserMessage]);
        
        // Get AI response with context
        const aiResponse = await getAIResponse(transcriptText, contextMessages);
        setResponse(aiResponse);
        
        // Add bot message to chat history
        const newBotMessage = { type: 'bot', text: aiResponse };
        setChatHistory(prev => [...prev, newBotMessage]);
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
  }, [speak, chatHistory]);

  const toggleListening = useCallback(() => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        setTranscript('');
        setResponse('');
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Failed to start recognition:', error);
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        }
      }
    }
  }, [isListening]);

  const messageContainerRef = useRef(null);

  return (
    <div className="app-container">
      <header>
        <h1>AI Health Assistant</h1>
      </header>
      
      <main>
        <div className="chat-panel">
          <div className="transcript-box">
            <h3>Conversation History</h3>
            <div 
              className="message-container"
              ref={messageContainerRef}
            >
              {chatHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${message.type}-message`}
                >
                  <div className="message-label">
                    {message.type === 'user' ? (
                      <>
                        <FaUser size={14} />
                        <span>You</span>
                      </>
                    ) : (
                      <>
                        <FaRobot size={14} />
                        <span>Assistant</span>
                      </>
                    )}
                  </div>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="assistant-section">
          <div className="assistant-container">
            <VirtualAssistant isSpeaking={isSpeaking} />
          </div>
          <button 
            className={`mic-button ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
            aria-label={isListening ? 'Stop Listening' : 'Start Listening'}
          >
            <FaMicrophone />
          </button>
        </div>
      </main>
    </div>
  );
}

export default App; 
