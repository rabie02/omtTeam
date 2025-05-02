import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

export default function VirtualAgent({ onClose }) {
  const [messages, setMessages] = useState([
    { from: 'agent', text: "👋 Hello! I'm your virtual assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { from: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: 'agent',
          text: "🤖 I'm still learning! Your message was: " + userMessage.text,
        },
      ]);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-20 right-6 w-96 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 flex flex-col">
      <div className="bg-[#0098C2] text-white px-4 py-3 rounded-t-xl flex justify-between items-center">
        <h2 className="font-semibold">Virtual Agent</h2>
        <button onClick={onClose} className="text-xl hover:text-gray-200">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
              msg.from === 'agent'
                ? 'bg-[#E0F7FA] text-gray-800 self-start'
                : 'bg-[#0098C2] text-white self-end ml-auto'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex items-center p-3 border-t bg-white">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0098C2]"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          className="ml-2 bg-[#0098C2] text-white p-2 rounded-full hover:bg-[#007fae] transition"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
