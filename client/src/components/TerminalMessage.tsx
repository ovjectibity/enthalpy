import React, { useState } from "react";
import chevronDownIcon from "../assets/chevron-down-icon.svg";
import { Message } from "./Terminal";

interface TerminalMessageProps {
  message: Message;
  isCollapsible?: boolean;
}

const TerminalMessage: React.FC<TerminalMessageProps> = ({
  message,
  isCollapsible = false,
}) => {
  // Only make "thinking" messages collapsible and collapsed by default
  const shouldBeCollapsible =
    isCollapsible && message.messageType === "thinking";
  const [isCollapsed, setIsCollapsed] = useState(shouldBeCollapsible);

  const handleToggleCollapse = () => {
    if (shouldBeCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const getPreviewText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // If not collapsible, use simple design
  if (!shouldBeCollapsible) {
    return (
      <div className={`message-container ${message.owner}`}>
        <div
          className={`message ${message.owner} ${
            message.isFinished ? "finished" : "in-progress"
          } ${message.messageType}`}
        >
          <div className="message-text">
            {message.text}
            {/*{!message.isFinished && <span className="cursor">|</span>}*/}
            {!message.isFinished}
          </div>
        </div>
      </div>
    );
  }

  // Collapsible design for thinking messages
  return (
    <div className={`message-container ${message.owner}`}>
      <div
        className={`message ${message.owner} ${
          message.isFinished ? "finished" : "in-progress"
        } ${message.messageType} collapsible`}
      >
        <div className="message-header" onClick={handleToggleCollapse}>
          <img
            src={chevronDownIcon}
            alt="Toggle"
            width="12"
            height="12"
            className={`collapse-icon ${isCollapsed ? "" : "expanded"}`}
          />
          <span className="message-type-label">
            {message.messageType.replace("-", " ")}
          </span>
        </div>
        <div
          className={`message-content ${isCollapsed ? "collapsed" : "expanded"}`}
        >
          <div className="message-text">
            {isCollapsed ? getPreviewText(message.text) : message.text}
            {!message.isFinished && !isCollapsed}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalMessage;
