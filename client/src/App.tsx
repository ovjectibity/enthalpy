import React, { useState } from "react";
import "./App.css";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Design");
  const [selectedArtefact, setSelectedArtefact] = useState("Artefacts");
  const [selectedAgent, setSelectedAgent] = useState("Flow graph agent");
  const [activeContext, setActiveContext] = useState("Flow");
  const [messages, setMessages] = useState([
    { type: "prompt", text: "> Tell me more about your objective." },
    { type: "response", text: "> Here's your objective _" },
  ]);
  const [chatWidth, setChatWidth] = useState(500);
  const [isDragging, setIsDragging] = useState(false);

  const tabs = ["Design", "Impl", "Execution"];
  const contextMenuItems = [
    { id: "Flow", label: "Flow", icon: "📊" },
    { id: "Components", label: "Components", icon: "🔧" },
    { id: "Data", label: "Data", icon: "📋" },
    { id: "Settings", label: "Settings", icon: "⚙️" },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    document.body.classList.add("resizing");
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const containerWidth = window.innerWidth;
      const newChatWidth = containerWidth - e.clientX;
      // Set minimum and maximum widths
      const minWidth = 300;
      const maxWidth = containerWidth - 200;
      const constrainedWidth = Math.max(
        minWidth,
        Math.min(maxWidth, newChatWidth),
      );
      setChatWidth(constrainedWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove("resizing");
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="app">
      {/* Top Header Bar */}
      <header className="top-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-text">ΔH</span>
          </div>
          <span className="project-name">&lt;project name&gt;</span>
        </div>
        <div className="header-right">
          <select
            className="artefacts-dropdown"
            value={selectedArtefact}
            onChange={(e) => setSelectedArtefact(e.target.value)}
          >
            <option>Artefacts</option>
            <option>Components</option>
            <option>Services</option>
          </select>
          <div className="tabs-wrapper">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Left Panel */}
        <div className="left-panel">
          {/* Sidebar Menu */}
          <div className="sidebar">
            {contextMenuItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${activeContext === item.id ? "active" : ""}`}
                onClick={() => setActiveContext(item.id)}
                title={item.label}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="canvas-area">
            {/* This would be where the visual canvas/diagram goes */}
            <div className="placeholder-text">{activeContext} Canvas</div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className={`resizer ${isDragging ? "resizing" : ""}`}
          onMouseDown={handleMouseDown}
        />

        {/* Right Panel - Terminal Interface */}
        <div className="right-panel" style={{ width: chatWidth }}>
          <div className="chat-header">
            <select
              className="agent-selector"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option>Flow graph agent</option>
              <option>Code agent</option>
              <option>UI agent</option>
            </select>
          </div>
          <div className="terminal">
            <div className="terminal-content">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <span className="message-text">{message.text}</span>
                  {message.type === "response" &&
                    index === messages.length - 1 && (
                      <span className="cursor">|</span>
                    )}
                </div>
              ))}
            </div>
            <div className="terminal-input">
              <span className="prompt-symbol">&gt;</span>
              <input
                type="text"
                className="input-field"
                placeholder="Type your message..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      setMessages([
                        ...messages,
                        { type: "user", text: `> ${input.value}` },
                        { type: "response", text: "> Processing..." },
                      ]);
                      input.value = "";
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
