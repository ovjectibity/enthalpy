import React, { useEffect, useRef, useState } from "react";
import sendIcon from "../assets/send-icon.svg";
import stopIcon from "../assets/stop-icon.svg";
import attachmentIcon from "../assets/attachment-icon.svg";
import threadHistoryIcon from "../assets/thread-history-icon.svg";
import ThreadHistoryMenu from "./ThreadHistoryMenu";
import {TerminalMessage} from "./TerminalMessage";
import { Agent, Thread, ThreadMessage } from "@enthalpy/shared";

interface TerminalProps {
  onAgentChange: (agent: Agent) => number;
  onSendMessage: (threadId: number, message: string) => void;
  onSelectThread: (threadId: number) => void;
  onStopAgent: (threadId: number) => void;
  selectedThreadId: number;
  threads: Map<number, Thread>;
  currentThreadState: "running" | "ready-for-input";
  newAgentMessage: number;
}

const Terminal: React.FC<TerminalProps> = (state: TerminalProps) => {
  const terminalContentRef = useRef<HTMLDivElement>(null);
  const threadIconRef = useRef<HTMLButtonElement>(null);
  const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);

  const agentName: {
    [key: string]: string
  } = {
    "mc": "Master of Ceremonies",
    "flow-graph": "User journey mapper",
    "exp-design": "Experiment generator",
    "hypotheses": "Hypotheses generator"
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (terminalContentRef.current) {
      terminalContentRef.current.scrollTop =
        terminalContentRef.current.scrollHeight;
    }
  }, [state.threads.get(state.selectedThreadId)]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      if (textarea.value.trim()) {
        state.onSendMessage(state.selectedThreadId, textarea.value);
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

  const handleAttachmentClick = () => {
    console.log("Attachment clicked");
  };

  const handleActionClick = () => {
    if (state.currentThreadState === "running") {
      state.onStopAgent(state.selectedThreadId);
    } else {
      const textarea = document.querySelector(
        ".input-field",
      ) as HTMLTextAreaElement;
      if (textarea && textarea.value.trim()) {
        state.onSendMessage(state.selectedThreadId, textarea.value);
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
          value={agentName[(state.threads.get(state.selectedThreadId)?.agentName ?? ("mc")) as string]}
          onChange={(e) => state.onAgentChange(e.target.value as Agent)}
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
        className={`terminal-content ${state.currentThreadState === "running" ? "agent-running" : ""}`}
      >
        {state.threads.get(state.selectedThreadId)?.messages.map((message) => (
          <TerminalMessage
            key={message.threadId}
            message={message}
            isFinished={true}
            isCollapsible={
              message.messageType === "thinking"
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
              state.currentThreadState === "running" ? "stop-button" : "send-button"
            }
            onClick={handleActionClick}
            aria-label={
              state.currentThreadState === "running" ? "Stop agent" : "Send message"
            }
            title={
              state.currentThreadState === "running"
                ? "Stop agent"
                : "Send message (Shift+Enter)"
            }
          >
            <img
              src={state.currentThreadState === "running" ? stopIcon : sendIcon}
              alt={state.currentThreadState === "running" ? "Stop" : "Send"}
              width="12"
              height="12"
            />
          </button>
        </div>
      </div>
      <ThreadHistoryMenu
        isOpen={isThreadHistoryOpen}
        onClose={() => setIsThreadHistoryOpen(false)}
        onSelectThread={state.onSelectThread}
        threads={state.threads}
        anchorRef={threadIconRef}
      />
    </div>
  );
};

export default Terminal;
