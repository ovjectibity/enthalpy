import React, { useState } from "react";
import "./App.css";
import { HypothesesView, Terminal, Message, Agent } from "./components";
import ContextIcon from "./assets/context-icon.svg";
import HypothesesIcon from "./assets/hypotheses-icon.svg";
import JourneyMapsIcon from "./assets/journey-maps-icon.svg";
import MetricsIcon from "./assets/metrics-icon.svg";
import ObjectivesIcon from "./assets/objectives-icon.svg";
import SettingsIcon from "./assets/settings-icon.svg";
import ExperimentsIcon from "./assets/experiments-icon.svg";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Design");

  const [selectedAgent, setSelectedAgent] = useState("Flow graph agent");
  const [activeContext, setActiveContext] = useState("Context");
  const [agent, setAgent] = useState<Agent>({ state: "ready-for-input" });
  const [threadHistory] = useState([
    {
      id: "thread-1",
      title: "Onboarding Flow Analysis",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      messageCount: 12,
    },
    {
      id: "thread-2",
      title: "Payment Process Optimization",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      messageCount: 8,
    },
    {
      id: "thread-3",
      title: "Mobile UX Enhancement Discussion",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      messageCount: 15,
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      owner: "agent",
      text: "Here's your objective based on what you've told me so far. I need more details to provide a comprehensive analysis.",
      isFinished: false,
      messageType: "thinking",
    },
    {
      id: 2,
      owner: "agent",
      text: "Here's your objective based on what you've told me so far. I need more details to provide a comprehensive analysis.",
      isFinished: false,
      messageType: "static",
    },
    {
      id: 3,
      owner: "agent",
      text: "Here's your objective based on what you've told me so far. I need more details to provide a comprehensive analysis.",
      isFinished: false,
      messageType: "tool-use",
    },
    {
      id: 4,
      owner: "agent",
      text: "Here's your objective based on what you've told me so far. I need more details to provide a comprehensive analysis.",
      isFinished: false,
      messageType: "enth-actions",
    },
  ]);
  const [chatWidth, setChatWidth] = useState(500);
  const [isDragging, setIsDragging] = useState(false);

  const tabs = ["Design", "Impl", "Execution"];
  const contextMenuItems = [
    { id: "Journey Maps", label: "Journey Maps", icon: JourneyMapsIcon },
    { id: "Context", label: "Context", icon: ContextIcon },
    { id: "Hypotheses", label: "Hypotheses", icon: HypothesesIcon },
    { id: "Experiments", label: "Experiments", icon: ExperimentsIcon },
    { id: "Metrics", label: "Metrics", icon: MetricsIcon },
    { id: "Objectives", label: "Objectives", icon: ObjectivesIcon },
    { id: "Settings", label: "Settings", icon: SettingsIcon },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    document.body.classList.add("resizing");
    e.preventDefault();
  };

  React.useEffect(() => {
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
            {activeContext === "Hypotheses" ? (
              <HypothesesView />
            ) : (
              <div className="placeholder-text">{activeContext} Canvas</div>
            )}
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className={`resizer ${isDragging ? "resizing" : ""}`}
          onMouseDown={handleMouseDown}
        />

        {/* Right Panel - Terminal Interface */}
        <div className="right-panel" style={{ width: chatWidth }}>
          <Terminal
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
            messages={messages}
            agent={agent}
            threadHistory={threadHistory}
            collapsibleMessages={true}
            onSelectThread={(threadId: string) => {
              console.log("Selected thread:", threadId);
              // Here you would load the selected thread's messages
            }}
            onSendMessage={(message: string) => {
              const newUserMessage: Message = {
                id: Date.now(),
                owner: "user" as const,
                text: message,
                isFinished: true,
                messageType: "static",
              };
              const newAgentMessage: Message = {
                id: Date.now() + 1,
                owner: "agent" as const,
                text: "Processing your request...",
                isFinished: false,
                messageType: "static",
              };
              setMessages([...messages, newUserMessage, newAgentMessage]);
              setAgent({ state: "running" });

              // Simulate agent processing - after 3 seconds, set back to ready
              setTimeout(() => {
                setAgent({ state: "ready-for-input" });
              }, 3000);
            }}
            onStopAgent={() => {
              setAgent({ state: "ready-for-input" });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
