import React, { useState } from "react";
import chevronDownIcon from "../assets/chevron-down-icon.svg";
import { ThreadMessage } from "@enthalpy/shared";

export interface TerminalMessageProps {
  message: ThreadMessage;
  isCollapsible?: boolean;
  isFinished?: boolean;
}

export const TerminalMessage: React.FC<TerminalMessageProps> = ({
  message,
  isCollapsible = false,
  isFinished = true,
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
      <div className={`message-container ${message.role}`}>
        <div
          className={`message ${message.role} ${
            isFinished ? "finished" : "in-progress"
          } ${message.messageType}`}
        >
          <div className="message-text">
            {message.message}
            {!isFinished && <span className="cursor">|</span>}
          </div>
        </div>
      </div>
    );
  }

  // Collapsible design for thinking messages
  return (
    <div className={`message-container ${message.role}`}>
      <div
        className={`message ${message.role} ${
          isFinished ? "finished" : "in-progress"
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
            {isCollapsed ? getPreviewText(message.message) : message.message}
            {!isFinished && !isCollapsed && <span className="cursor">|</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
