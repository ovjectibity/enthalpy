import React from "react";
import MasterDetail from "./MasterDetail";
import HyperlistView from "./HyperlistView";
import InlineEditableText from "./InlineEditableText";
import useHypotheses from "../hooks/useHypotheses";

const FeedbackComponent = require("./FeedbackComponent").default;

const HypothesesView: React.FC = () => {
  const { hypothesesList, loading, error } = useHypotheses();

  if (loading) {
    return <div className="hypotheses-canvas">Loading hypotheses...</div>;
  }

  if (error) {
    return <div className="hypotheses-canvas">Error: {error}</div>;
  }

  if (!hypothesesList || hypothesesList.length === 0) {
    return <div className="hypotheses-canvas">No hypotheses found.</div>;
  }

  return (
    <div className="hypotheses-canvas">
      <MasterDetail
        items={hypothesesList}
        renderMasterItem={(item: any) => (
          <div className="master-list-item">
            <div className="master-list-title">{item.title}</div>
            <div className="master-list-preview">{item.action}</div>
          </div>
        )}
        renderDetail={(item: any) => (
          <div className="hypothesis-detail-view" key={item.id}>
            <h2 className="detail-title">{item.title}</h2>

            <div className="detail-section">
              <InlineEditableText
                label="Action"
                value={item.action}
                placeholder="What action will you take?"
                multiline={true}
                onSave={(value) => console.log("Action saved:", value)}
                onDiscard={() => console.log("Action edit discarded")}
              />
            </div>

            <div className="detail-section">
              <InlineEditableText
                label="Expected Outcome"
                value={item.expectedOutcome}
                placeholder="What do you expect to happen?"
                multiline={true}
                onSave={(value) => console.log("Expected Outcome saved:", value)}
                onDiscard={() => console.log("Expected Outcome edit discarded")}
              />
            </div>

            <div className="detail-section">
              <InlineEditableText
                label="Rationale"
                value={item.rationale}
                placeholder="Why do you believe this will work?"
                multiline={true}
                onSave={(value) => console.log("Rationale saved:", value)}
                onDiscard={() => console.log("Rationale edit discarded")}
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
                items={item.contextItems ? item.contextItems : []}
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
