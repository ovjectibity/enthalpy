import React from "react";
import { Input } from "@base-ui-components/react/input";
import MasterDetail from "./MasterDetail";
import HyperlistView from "./HyperlistView";

const FeedbackComponent = require("./FeedbackComponent").default;

const HypothesesView: React.FC = () => {
  const hypothesesList = [
    {
      id: 1,
      title: "Onboarding Flow Optimization",
      action: "Implement user onboarding flow",
      rationale: "New users are dropping off during signup process",
      expected_outcome: "Increase user conversion rate by 25%",
      metrics: [
        {
          id: "met_1",
          name: "User Conversion Rate",
          formula: "(Converted Users / Total Signups) * 100",
          category: "Activation",
        },
        {
          id: "met_2",
          name: "Time to First Value",
          formula: "Average(Time from Signup to First Key Action)",
          category: "Activation",
        },
        {
          id: "met_3",
          name: "Signup Completion Rate",
          formula: "(Completed Signups / Started Signups) * 100",
          category: "Acquisition",
        },
      ],
      objectives: [
        {
          id: "obj_1",
          title: "Improve User Acquisition",
        },
        {
          id: "obj_2",
          title: "Reduce Signup Friction",
        },
        {
          id: "obj_3",
          title: "Increase Trial-to-Paid Conversion",
        },
      ],
      experiments: [
        {
          name: "A/B Test Welcome Screen",
          key: "onboarding_welcome_ab",
          status: "PENDING DESIGN",
        },
        {
          name: "Progressive Disclosure Test",
          key: "onboarding_progressive_disclosure",
          status: "PENDING DESIGN",
        },
        {
          name: "Social Proof Integration",
          key: "onboarding_social_proof",
          status: "PENDING DESIGN",
        },
      ],
      contextItems: [
        {
          id: "ctx_1",
          title: "User Drop-off Analysis",
          tag: "Context",
        },
        {
          id: "ctx_2",
          title: "Signup Funnel Journey",
          tag: "Journey Map",
        },
        {
          id: "ctx_3",
          title: "Competitor Onboarding Research",
          tag: "Context",
        },
      ],
    },
    {
      id: 2,
      title: "Payment Process Simplification",
      action: "Reduce checkout steps from 5 to 3",
      rationale: "Cart abandonment is high at payment stage",
      expected_outcome: "Decrease cart abandonment by 15%",
      metrics: [
        {
          id: "met_4",
          name: "Cart Abandonment Rate",
          formula: "1 - (Purchases / Cart Additions)",
          category: "Revenue",
        },
        {
          id: "met_5",
          name: "Average Order Value",
          formula: "Total Revenue / Number of Orders",
          category: "Revenue",
        },
      ],
      objectives: [
        {
          id: "obj_4",
          title: "Optimize Revenue Per User",
        },
        {
          id: "obj_5",
          title: "Streamline Purchase Experience",
        },
      ],
      experiments: [
        {
          name: "Single Page Checkout",
          key: "payment_single_page",
          status: "PENDING DESIGN",
        },
        {
          name: "Guest Checkout Option",
          key: "payment_guest_checkout",
          status: "PENDING DESIGN",
        },
      ],
      contextItems: [
        {
          id: "ctx_4",
          title: "Cart Abandonment Heat Maps",
          tag: "Context",
        },
        {
          id: "ctx_5",
          title: "Payment Flow Journey Map",
          tag: "Journey Map",
        },
      ],
    },
    {
      id: 3,
      title: "Mobile UX Enhancement",
      action: "Redesign mobile interface for key actions",
      rationale: "Mobile users report difficulty completing tasks",
      expected_outcome: "Improve mobile task completion rate by 30%",
      metrics: [
        {
          id: "met_6",
          name: "Mobile Task Completion Rate",
          formula: "(Completed Tasks / Started Tasks) * 100",
          category: "Retention",
        },
        {
          id: "met_7",
          name: "Mobile Session Duration",
          formula: "Average(Session End Time - Session Start Time)",
          category: "Retention",
        },
        {
          id: "met_8",
          name: "Cross-Device Consistency Score",
          formula: "1 - (Mobile Errors / Desktop Errors)",
          category: "Activation",
        },
      ],
      objectives: [
        {
          id: "obj_6",
          title: "Enhance Mobile User Experience",
        },
        {
          id: "obj_7",
          title: "Increase Mobile Engagement",
        },
        {
          id: "obj_8",
          title: "Improve Cross-Device Consistency",
        },
      ],
      experiments: [
        {
          name: "Touch-Friendly Button Sizing",
          key: "mobile_button_sizing",
          status: "PENDING DESIGN",
        },
        {
          name: "Gesture Navigation Test",
          key: "mobile_gesture_nav",
          status: "PENDING DESIGN",
        },
        {
          name: "Voice Input Integration",
          key: "mobile_voice_input",
          status: "PENDING DESIGN",
        },
      ],
      contextItems: [
        {
          id: "ctx_6",
          title: "Mobile Usability Study",
          tag: "Context",
        },
        {
          id: "ctx_7",
          title: "Mobile User Journey Analysis",
          tag: "Journey Map",
        },
        {
          id: "ctx_8",
          title: "Device Usage Patterns",
          tag: "Context",
        },
      ],
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
