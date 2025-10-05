import React, { useState } from "react";
import linkIcon from "../assets/link-icon.svg";
import chevronDownIcon from "../assets/chevron-down-icon.svg";

interface HyperlistItem {
  id?: string;
  name?: string;
  key?: string;
  title?: string;
  status?: string;
  formula?: string;
  category?: string;
  tag?: string;
}

interface HyperlistViewProps {
  items: HyperlistItem[];
  title?: string;
  defaultExpanded?: boolean;
  showDescription?: boolean;
  showStatus?: boolean;
  linkTooltip?: string | ((item: HyperlistItem) => string);
}

const HyperlistView: React.FC<HyperlistViewProps> = ({
  items,
  title = "Items",
  defaultExpanded = true,
  showDescription = true,
  showStatus = true,
  linkTooltip = "View details",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="hyperlist-view">
      <div className="hyperlist-header" onClick={toggleExpanded}>
        <h3 className="hyperlist-title">{title}</h3>
        <button className="hyperlist-toggle" aria-label="Toggle list">
          <img
            src={chevronDownIcon}
            alt="Toggle"
            width="16"
            height="16"
            className={`hyperlist-chevron ${isExpanded ? "expanded" : ""}`}
          />
        </button>
      </div>
      {isExpanded && (
        <div className="hyperlist-container">
          {items.map((item) => (
            <div key={item.key || item.id} className="hyperlist-item">
              <div className="hyperlist-content">
                <div className="hyperlist-main">
                  <h4 className="hyperlist-item-title">
                    {item.name || item.title}
                  </h4>
                  {showDescription && (item.key || item.id || item.formula) && (
                    <p className="hyperlist-item-description">
                      {item.formula
                        ? item.formula
                        : item.key
                          ? `Experiment Key: ${item.key}`
                          : `ID: ${item.id}`}
                    </p>
                  )}
                </div>
                {showStatus && (item.status || item.category || item.tag) && (
                  <div className="hyperlist-meta">
                    <span
                      className={`hyperlist-tag status-${(item.tag || item.category || item.status || "").toLowerCase().replace(" ", "-")}`}
                    >
                      {item.tag || item.category || item.status}
                    </span>
                  </div>
                )}
              </div>
              <div className="hyperlist-action">
                <button
                  className="hyperlist-link-icon"
                  onClick={() =>
                    console.log(
                      `Opening item: ${item.key || item.id || item.name || item.title}`,
                    )
                  }
                  title={
                    typeof linkTooltip === "function"
                      ? linkTooltip(item)
                      : linkTooltip
                  }
                >
                  <img src={linkIcon} alt="Link" width="16" height="16" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="hyperlist-empty">
              <p>No items found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HyperlistView;
