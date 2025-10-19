import React, { useEffect, useRef } from "react";
import { Thread } from "@enthalpy/shared";

interface ThreadHistoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectThread: (threadId: number) => void;
  //Only threads of the relevant agent to be shown here
  threads: Map<number,Thread>;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const ThreadHistoryMenu: React.FC<ThreadHistoryMenuProps> = (state: ThreadHistoryMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        state.isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        state.anchorRef?.current &&
        !state.anchorRef?.current.contains(event.target as Node)
      ) {
        state.onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && state.isOpen) {
        state.onClose();
      }
    };

    if (state.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [state.isOpen, state.onClose, state.anchorRef]);

  const handleThreadClick = (threadId: number) => {
    state.onSelectThread(threadId);
    state.onClose();
  };

  if (!state.isOpen) return null;

  return (
    <div className="thread-history-overlay">
      <div ref={menuRef} className="thread-history-menu">
        <div className="thread-history-header">
          <h3>Thread History</h3>
        </div>
        <div className="thread-history-list">
          {state.threads.values.length > 0 ? (
            Array.from(state.threads.values()).map((thread) => (
              <div
                key={thread.threadId}
                className="thread-history-item"
                onClick={() => handleThreadClick(thread.threadId)}
              >
                <div className="thread-title">{thread.summary}</div>
                <div className="thread-meta">
                  <span className="thread-timestamp">
                    {thread.messages[thread.messages.length - 1].timestamp.toDateString()}
                  </span>
                  <span className="thread-message-count">
                    {thread.messages.length} messages
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="thread-history-empty">
              <p>No thread history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadHistoryMenu;
