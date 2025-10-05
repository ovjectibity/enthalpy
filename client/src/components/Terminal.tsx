import React from "react";

interface Message {
  id: number;
  owner: "user" | "agent";
  text: string;
  isFinished: boolean;
}

interface TerminalProps {
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({
  selectedAgent,
  onAgentChange,
  messages,
  onSendMessage,
}) => {
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

  return (
    <div className="terminal">
      <div className="chat-header">
        <select
          className="agent-selector"
          value={selectedAgent}
          onChange={(e) => onAgentChange(e.target.value)}
        >
          <option>Master agent</option>
          <option>Flow graph agent</option>
          <option>UI agent</option>
        </select>
      </div>
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
        <textarea
          className="input-field"
          placeholder="Prompt the enthalpy agent — / to include context"
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          style={{ resize: "none", overflow: "auto" }}
        />
      </div>
    </div>
  );
};

export default Terminal;
