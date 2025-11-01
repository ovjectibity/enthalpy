import React, { useState, useEffect, useRef } from "react";

interface InlineEditableTextProps {
  value: string;
  onSave: (value: string) => void;
  onDiscard: () => void;
  placeholder?: string;
  multiline?: boolean;
  label?: string;
  minHeight?: string;
  autoFocus?: boolean;
}

const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onSave,
  onDiscard,
  placeholder = "Enter text...",
  multiline = false,
  label,
  minHeight = "80px",
  autoFocus = true,
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea based on content
  const adjustHeight = () => {
    if (multiline && inputRef.current) {
      const textarea = inputRef.current as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [currentValue, multiline]);

  const handleSave = () => {
    onSave(currentValue);
    setIsFocused(false);
  };

  const handleDiscard = () => {
    setCurrentValue(value);
    onDiscard();
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if the blur is caused by clicking on the action buttons
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('.inline-editable-actions')) {
      return; // Don't handle blur if clicking on action buttons
    }

    // Treat blur as discard
    handleDiscard();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleDiscard();
    }
  };

  return (
    <div className="inline-editable-container">
      {label && <label className="inline-editable-label">{label}</label>}
      <div className="inline-editable-wrapper">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="inline-editable-input"
            value={currentValue}
            onChange={(e) => {
              setCurrentValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={1}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            className="inline-editable-input"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
          />
        )}
        {isFocused && (
          <div className="inline-editable-actions">
            <button
            className="inline-editable-button save"
            onClick={handleSave}
            aria-label="Save changes"
            title="Save"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5 4L6 11.5L2.5 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
            <button
              className="inline-editable-button discard"
            onClick={handleDiscard}
            aria-label="Discard changes"
            title="Discard"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineEditableText;
