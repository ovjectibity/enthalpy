import React from "react";
import { Input } from "@base-ui-components/react/input";
import MasterDetail from "./MasterDetail";

const HypothesesView: React.FC = () => {
  const hypothesesList = [
    {
      id: 1,
      title: "Onboarding Flow Optimization",
      action: "Implement user onboarding flow",
      rationale: "New users are dropping off during signup process",
      expected_outcome: "Increase user conversion rate by 25%",
    },
    {
      id: 2,
      title: "Payment Process Simplification",
      action: "Reduce checkout steps from 5 to 3",
      rationale: "Cart abandonment is high at payment stage",
      expected_outcome: "Decrease cart abandonment by 15%",
    },
    {
      id: 3,
      title: "Mobile UX Enhancement",
      action: "Redesign mobile interface for key actions",
      rationale: "Mobile users report difficulty completing tasks",
      expected_outcome: "Improve mobile task completion rate by 30%",
    },
  ];

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
          </div>
        )}
      />
    </div>
  );
};

export default HypothesesView;
