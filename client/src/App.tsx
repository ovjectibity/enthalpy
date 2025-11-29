import React, { useState } from "react";
import "./App.css";
import { HypothesesView, TableView, Terminal } from "./components";
import ContextView from "./components/ContextView";
import useThreads from "./hooks/useThreads";
import MetricsView from "./components/MetricsView";
import { 
  Agent, 
  AgentServerToClientEvents, 
  AgentClientToServerEvents, 
  ThreadMessage
} from "@enthalpy/shared";
import {io, Socket} from "socket.io-client";
import ContextIcon from "./assets/context-icon.svg";
import HypothesesIcon from "./assets/hypotheses-icon.svg";
import JourneyMapsIcon from "./assets/journey-maps-icon.svg";
import MetricsIcon from "./assets/metrics-icon.svg";
import ObjectivesIcon from "./assets/objectives-icon.svg";
import SettingsIcon from "./assets/settings-icon.svg";
import ExperimentsIcon from "./assets/experiments-icon.svg";

const agent_socket: Socket<AgentServerToClientEvents, AgentClientToServerEvents> =
  io("http://localhost:3000/agent", {
  transports: ['websocket'], // Force WebSocket
  auth: { role: "user" },
});

const App: React.FC = () => {
  const [agentMessage, setAgentMessage] = useState(0);
  const [activeTab, setActiveTab] = useState("Design");
  const [selectedAgent, setSelectedAgent] = useState("mc" as Agent);
  const [activeThread, setActiveThread] = useState(1); //TODO: Handle initiation
  const [activeContext, setActiveContext] = useState("Context");
  const [contextUpdateIndex, setContextUpdateIndex] = useState(0);
  const [currentThreadState, setCurrentThreadState] = useState<"running" | "ready-for-input">("ready-for-input");
  const { threads, loading, error } = useThreads({
    projectId: 1, //TODO: Handle different projects
    userId: 1 //TODO: Handle different user IDs
  });
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

  React.useEffect(() => {
    const connectH = () => {
      agent_socket.emit("activate_thread",{
        threadId: activeThread,
        agentName: selectedAgent,
        projectId: 1 //TODO: Handle different projects
      });
    };
    const addUserMessageH = (msg: ThreadMessage) => {
      console.log("Finalise user message from agent:", msg);
      if(threads.get(msg.threadId)) {
        threads.get(msg.threadId)?.messages.push(msg);
      }
    };
    const connectErrorH = (err: Error) => {
      console.error("Connection failed:", err);
    };
    const agentMH = (msg: ThreadMessage) => {
      console.log("Message from agent:", msg);
      if(threads.has(msg.threadId)) {
        console.log("Adding the agent message to threads map");
        threads.get(msg.threadId)?.messages.push(msg);
      }
      setAgentMessage(msg.index);
    };
    const updateCB = (msg: string) => {
      if(msg === "contexts") {
        setContextUpdateIndex(contextUpdateIndex+1);
      }
    }

    agent_socket.on("update_state", updateCB);
    agent_socket.on("connect", connectH);
    agent_socket.on("agent_message", agentMH);
    agent_socket.on("add_user_message", addUserMessageH);
    agent_socket.on("connect_error", connectErrorH);

    return () => {
      agent_socket.on("update_state", updateCB);
      agent_socket.off("connect", connectH);
      agent_socket.off("agent_message", agentMH);
      agent_socket.off("add_user_message", addUserMessageH);
      agent_socket.off("connect_error", connectErrorH);
    }
  });

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
            ) : activeContext === "Context" ? (
              <ContextView userId={1} projectId={1} updateIndex={contextUpdateIndex} />
            ) : activeContext === "Metrics" ? (
              <MetricsView metrics={[]}/>
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
            newAgentMessage={agentMessage}
            currentThreadState={currentThreadState}
            selectedThreadId={activeThread}
            onAgentChange={(agent: Agent): number => {
              console.log("Changed agent to:", agent);
              // TODO: Here use the last available thread for the selected agent
              return 1;
            }}
            threads={threads}
            onSelectThread={(threadId: number) => {
              console.log("Selected thread:", threadId);
              // TODO: Here you would load the selected thread's messages
            }}
            onSendMessage={(threadId: number, message: string) => {
              console.log("Sending message:", message);
              agent_socket.emit("user_message",{
                message: message,
                threadId: activeThread,
                agentName: selectedAgent,
                role: "user",
                messageType: "static",
                projectId: 1 //TODO: Handle different projects
              });
              setCurrentThreadState("running");
            }}
            onStopAgent={() => {
              setCurrentThreadState("ready-for-input");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
