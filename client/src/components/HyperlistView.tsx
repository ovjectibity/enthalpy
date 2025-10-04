import React, { useState } from "react";
import linkIcon from "../assets/link-icon.svg";

interface Experiment {
  name: string;
  key: string;
  status: string;
}

interface HyperlistViewProps {
  experiments: Experiment[];
  title?: string;
  defaultExpanded?: boolean;
}

const HyperlistView: React.FC<HyperlistViewProps> = ({
  experiments,
  title = "Experiments",
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="hyperlist-view">
      <div className="hyperlist-header" onClick={toggleExpanded}>
        <h3 className="hyperlist-title">{title}</h3>
        <button
          className="hyperlist-toggle"
          aria-label="Toggle experiments list"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`hyperlist-chevron ${isExpanded ? "expanded" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      {isExpanded && (
        <div className="hyperlist-container">
          {experiments.map((experiment) => (
            <div key={experiment.key} className="hyperlist-item">
              <div className="hyperlist-content">
                <div className="hyperlist-main">
                  <h4 className="hyperlist-item-title">{experiment.name}</h4>
                  <p className="hyperlist-item-description">
                    Experiment Key: {experiment.key}
                  </p>
                </div>
                <div className="hyperlist-meta">
                  <span
                    className={`hyperlist-tag status-${experiment.status.toLowerCase().replace(" ", "-")}`}
                  >
                    {experiment.status}
                  </span>
                </div>
              </div>
              <div className="hyperlist-action">
                <button
                  className="hyperlist-link-icon"
                  onClick={() =>
                    console.log(`Opening experiment: ${experiment.key}`)
                  }
                  title="View experiment details"
                >
                  <img src={linkIcon} alt="Link" width="16" height="16" />
                </button>
              </div>
            </div>
          ))}
          {experiments.length === 0 && (
            <div className="hyperlist-empty">
              <p>No experiments found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HyperlistView;
