import React, { useState } from "react";
import "./App.css";
import ContextIcon from "./assets/context-icon.svg";
import HypothesesIcon from "./assets/hypotheses-icon.svg";
import JourneyMapsIcon from "./assets/journey-maps-icon.svg";
import MetricsIcon from "./assets/metrics-icon.svg";
import ObjectivesIcon from "./assets/objectives-icon.svg";
import SettingsIcon from "./assets/settings-icon.svg";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Design");

  const [selectedAgent, setSelectedAgent] = useState("Flow graph agent");
  const [activeContext, setActiveContext] = useState("Context");
  const [messages, setMessages] = useState([
    { type: "prompt", text: "> Tell me more about your objective." },
    { type: "response", text: "> Here's your objective _" },
  ]);
  const [chatWidth, setChatWidth] = useState(500);
  const [isDragging, setIsDragging] = useState(false);

  const tabs = ["Design", "Impl", "Execution"];
  const contextMenuItems = [
    { id: "Journey Maps", label: "Journey Maps", icon: JourneyMapsIcon },
    { id: "Context", label: "Context", icon: ContextIcon },
    { id: "Hypotheses", label: "Hypotheses", icon: HypothesesIcon },
    { id: "Metrics", label: "Metrics", icon: MetricsIcon },
    { id: "Objectives", label: "Objectives", icon: ObjectivesIcon },
    { id: "Settings", label: "Settings", icon: SettingsIcon },
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
                <img
                  src={item.icon}
                  alt={item.label}
                  className="sidebar-icon"
                />
                {/*<span className="sidebar-label">{item.label}</span>*/}
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
