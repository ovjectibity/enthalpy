import React, { useEffect, useRef } from "react";

interface ThreadHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
}

interface ThreadHistoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectThread: (threadId: string) => void;
  threads: ThreadHistoryItem[];
  anchorRef: React.RefObject<HTMLElement | null>;
}

const ThreadHistoryMenu: React.FC<ThreadHistoryMenuProps> = ({
  isOpen,
  onClose,
  onSelectThread,
  threads,
  anchorRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef?.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, anchorRef]);

  const handleThreadClick = (threadId: string) => {
    onSelectThread(threadId);
    onClose();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return "Just now";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="thread-history-overlay">
      <div ref={menuRef} className="thread-history-menu">
        <div className="thread-history-header">
          <h3>Thread History</h3>
        </div>
        <div className="thread-history-list">
          {threads.length > 0 ? (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="thread-history-item"
                onClick={() => handleThreadClick(thread.id)}
              >
                <div className="thread-title">{thread.title}</div>
                <div className="thread-meta">
                  <span className="thread-timestamp">
                    {formatTimestamp(thread.timestamp)}
                  </span>
                  <span className="thread-message-count">
                    {thread.messageCount} messages
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
