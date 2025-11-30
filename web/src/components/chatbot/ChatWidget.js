import React, { useState } from "react";
import "./ChatWidget.css";
import { getAIResponse } from "../../utils/aiService"; // API AI của bạn

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const toggleChat = () => setOpen(!open);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const reply = await getAIResponse(input);

    const botMsg = { sender: "bot", text: reply };
    setMessages((prev) => [...prev, botMsg]);

    setInput("");
  };

  return (
    <div className="chatbot-wrapper">
      {/* Nút chat nổi */}
      <button className="chatbot-fab" onClick={toggleChat}>
        💬
      </button>

      {/* Khung chat */}
      {open && (
        <div className="chatbot-window fadeIn">
          <div className="chatbot-header">
            <div>
              <span className="chat-title">Hỗ trợ </span>
              <p className="chat-sub">Tư vấn NFT – xe máy – blockchain</p>
            </div>
            <button className="close-btn" onClick={toggleChat}>✖</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.sender}`}>{m.text}</div>
            ))}
          </div>

          <div className="chatbot-input">
            <input
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
