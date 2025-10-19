import React, { useEffect, useRef, useState } from "react";
import sendIcon from "../assets/send-icon.svg";
import stopIcon from "../assets/stop-icon.svg";
import attachmentIcon from "../assets/attachment-icon.svg";
import threadHistoryIcon from "../assets/thread-history-icon.svg";
import ThreadHistoryMenu from "./ThreadHistoryMenu";
import {TerminalMessageProps, TerminalMessage} from "./TerminalMessage";

export interface Agent {
  state: "running" | "ready-for-input";
}

interface ThreadHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
}

interface TerminalProps {
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  messages: TerminalMessageProps[];
  onSendMessage: (message: string) => void;
  agent: Agent;
  onStopAgent: () => void;
  threadHistory?: ThreadHistoryItem[];
  onSelectThread?: (threadId: string) => void;
  collapsibleMessages?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({
  selectedAgent,
  onAgentChange,
  messages,
  onSendMessage,
  agent,
  onStopAgent,
  threadHistory = [],
  onSelectThread = () => {},
  collapsibleMessages = true,
}) => {
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const threadIconRef = useRef<HTMLButtonElement>(null);
  const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (terminalContentRef.current) {
      terminalContentRef.current.scrollTop =
        terminalContentRef.current.scrollHeight;
    }
  }, [messages]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      if (textarea.value.trim()) {
        onSendMessage(textarea.value);
        textarea.value = "";
        // Reset height after clearing
        textarea.style.height = "auto";
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Calculate the height needed, with max of 5 lines
    const lineHeight = 20; // Approximate line height in pixels
    const maxHeight = lineHeight * 5;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSendClick = () => {
    const textarea = document.querySelector(
      ".input-field",
    ) as HTMLTextAreaElement;
    if (textarea && textarea.value.trim()) {
      onSendMessage(textarea.value);
      textarea.value = "";
      textarea.style.height = "auto";
    }
  };

  const handleAttachmentClick = () => {
    console.log("Attachment clicked");
  };

  const handleActionClick = () => {
    if (agent.state === "running") {
      onStopAgent();
    } else {
      const textarea = document.querySelector(
        ".input-field",
      ) as HTMLTextAreaElement;
      if (textarea && textarea.value.trim()) {
        onSendMessage(textarea.value);
        textarea.value = "";
        textarea.style.height = "auto";
      }
    }
  };

  return (
    <div className="terminal">
      <div className="chat-header">
        <select
          className="agent-selector"
          value={selectedAgent}
          onChange={(e) => onAgentChange(e.target.value)}
        >
          <option>Master of Ceremonies</option>
          <option>Flow graph agent</option>
          <option>UI agent</option>
        </select>
        <button
          ref={threadIconRef}
          className="thread-history-button"
          onClick={() => setIsThreadHistoryOpen(!isThreadHistoryOpen)}
          aria-label="Thread history"
          title="Thread history"
        >
          <img
            src={threadHistoryIcon}
            alt="Thread history"
            width="13"
            height="13"
          />
        </button>
      </div>
      <div
        ref={terminalContentRef}
        className={`terminal-content ${agent.state === "running" ? "agent-running" : ""}`}
      >
        {messages.map((message) => (
          <TerminalMessage
            key={message.message.threadId}
            message={message.message}
            isFinished={true}
            isCollapsible={
              collapsibleMessages && message.message.message_type === "thinking"
            }
          />
        ))}
      </div>
      <div className="terminal-input">
        <div className="input-area">
          <textarea
            className="input-field"
            placeholder="prompt the enthalpy agent / use shift+enter to send"
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            style={{ resize: "none", overflow: "auto" }}
          />
        </div>
        <div className="input-controls">
          <button
            className="attachment-button"
            onClick={handleAttachmentClick}
            aria-label="Add attachment"
            title="Add attachment"
          >
            <img src={attachmentIcon} alt="Attachment" width="12" height="12" />
          </button>
          <button
            className={
              agent.state === "running" ? "stop-button" : "send-button"
            }
            onClick={handleActionClick}
            aria-label={
              agent.state === "running" ? "Stop agent" : "Send message"
            }
            title={
              agent.state === "running"
                ? "Stop agent"
                : "Send message (Shift+Enter)"
            }
          >
            <img
              src={agent.state === "running" ? stopIcon : sendIcon}
              alt={agent.state === "running" ? "Stop" : "Send"}
              width="12"
              height="12"
            />
          </button>
        </div>
      </div>
      <ThreadHistoryMenu
        isOpen={isThreadHistoryOpen}
        onClose={() => setIsThreadHistoryOpen(false)}
        onSelectThread={onSelectThread}
        threads={threadHistory}
        anchorRef={threadIconRef}
      />
    </div>
  );
};

export default Terminal;
