import React, { useState, useEffect } from "react";
import { Input } from "@base-ui-components/react/input";
import MasterDetail from "./MasterDetail";
import HyperlistView from "./HyperlistView";

const FeedbackComponent = require("./FeedbackComponent").default;

const HypothesesView: React.FC = () => {
  const [hypothesesList, setHypothesesList] = useState([]);

  useEffect(() => {
    fetch("/api/hypotheses?userId=yourUserId") // Replace 'yourUserId' with the actual user ID
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch hypotheses.");
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          setHypothesesList(data.hypotheses); // Assuming the response structure contains 'hypotheses'
        } else {
          console.error("Error fetching hypotheses:", data.error);
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="hypotheses-canvas">
      <MasterDetail
        items={hypothesesList}
        renderMasterItem={(item: any) => (
          <div className="hypothesis-list-item">
            <div className="hypothesis-title">{item.title}</div>
            <div className="hypothesis-preview">{item.action}</div>
          </div>
        )}
        renderDetail={(item: any) => (
          <div className="hypothesis-detail-view" key={item.id}>
            <h2 className="detail-title">{item.title}</h2>

            <div className="detail-section">
              <label className="detail-label">Action</label>
              <Input
                className="detail-input"
                value={item.action}
                placeholder="What action will you take?"
                readOnly
              />
            </div>

            <div className="detail-section">
              <label className="detail-label">Expected Outcome</label>
              <Input
                className="detail-input"
                value={item.expected_outcome}
                placeholder="What do you expect to happen?"
                readOnly
              />
            </div>

            <div className="detail-section">
              <label className="detail-label">Rationale</label>
              <Input
                className="detail-input"
                value={item.rationale}
                placeholder="Why do you believe this will work?"
                readOnly
              />
            </div>

            <div className="detail-section">
              <HyperlistView
                items={item.objectives}
                title="Target Objectives"
                showDescription={false}
                showStatus={false}
                linkTooltip="Goto Objectives View"
              />
            </div>

            <div className="detail-section">
              <HyperlistView
                items={item.experiments}
                title="Attached Experiments"
                showDescription={true}
                showStatus={true}
                linkTooltip="View experiment details"
              />
            </div>

            <div className="detail-section">
              <HyperlistView
                items={item.metrics}
                title="Target Metrics"
                showDescription={true}
                showStatus={true}
                linkTooltip="Goto Metrics View"
              />
            </div>

            <div className="detail-section">
              <HyperlistView
                items={item.contextItems}
                title="Context Used"
                showDescription={false}
                showStatus={true}
                linkTooltip={(contextItem: any) =>
                  contextItem.tag === "Context"
                    ? "Goto Context View"
                    : "Goto Journey Map View"
                }
              />
            </div>

            <div className="hypothesis-actions">
              <FeedbackComponent
                assetType="hypothesis"
                assetId={item.id.toString()}
                onFeedbackSubmit={(feedback: any) =>
                  console.log("Feedback submitted:", feedback)
                }
              />
              <button
                className="regenerate-button"
                onClick={() => console.log("Regenerating asset:", item.id)}
                aria-label="Regenerate asset"
              >
                Regenerate asset
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default HypothesesView;
