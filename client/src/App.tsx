import React, { useState } from "react";
import "./App.css";
import ContextIcon from "./assets/context-icon.svg";
import HypothesesIcon from "./assets/hypotheses-icon.svg";
import JourneyMapsIcon from "./assets/journey-maps-icon.svg";
import MetricsIcon from "./assets/metrics-icon.svg";
import ObjectivesIcon from "./assets/objectives-icon.svg";
import SettingsIcon from "./assets/settings-icon.svg";

const TableView = (arg: { data: Array<any>; columns: Array<any> }) => {
  if (!arg.data || arg.data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {arg.columns.map((column, index) => (
              <th key={index} className="data-table-cell">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arg.data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {arg.columns.map((column, colIndex) => (
                <td key={colIndex} className="data-table-cell">
                  {column.accessor ? row[column.accessor] : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const hypothesesCard = () => {};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Design");

  const [selectedAgent, setSelectedAgent] = useState("Flow graph agent");
  const [activeContext, setActiveContext] = useState("Context");
  const [messages, setMessages] = useState([
    {
      id: 1,
      owner: "agent",
      text: "Tell me more about your objective.",
      isFinished: true,
    },
    {
      id: 2,
      owner: "agent",
      text: "Here's your objective based on what you've told me so far. I need more details to provide a comprehensive analysis.",
      isFinished: false,
    },
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

  const tableData = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Developer" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Designer" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Manager" },
  ];

  // Column configuration
  const columns = [
    { header: "ID", accessor: "action" },
    { header: "Proposed change", accessor: "action" },
    { header: "Expected outcome", accessor: "expected-outcome" },
    { header: "Rationale", accessor: "reasoning" },
    { header: "Mapped objectives", accessor: "objectives" },
    { header: "Test Experiments", accessor: "experiments" },
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
            {/*<div className="placeholder-text">{activeContext} Canvas</div>*/}
            <TableView data={tableData} columns={columns} />
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
              <option>Master agent</option>
              <option>Flow graph agent</option>
              <option>UI agent</option>
            </select>
          </div>
          <div className="terminal">
            <div className="terminal-content">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-container ${message.owner}`}
                >
                  <div
                    className={`message ${message.owner} ${message.isFinished ? "finished" : "in-progress"}`}
                  >
                    <div className="message-text">
                      {message.text}
                      {!message.isFinished && <span className="cursor">|</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="terminal-input">
              <input
                type="text"
                className="input-field"
                placeholder="Prompt the enthalpy agent — @ to include context"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      const newUserMessage = {
                        id: Date.now(),
                        owner: "user",
                        text: input.value,
                        isFinished: true,
                      };
                      const newAgentMessage = {
                        id: Date.now() + 1,
                        owner: "agent",
                        text: "Processing your request...",
                        isFinished: false,
                      };
                      setMessages([
                        ...messages,
                        newUserMessage,
                        newAgentMessage,
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
