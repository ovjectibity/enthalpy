import React from "react";
import TableView from "./TableView";
import InlineEditableText from "./InlineEditableText";
import { Metric } from "@enthalpy/shared";

const MetricsDetailCard: React.FC = () => {
  const handleSave = () => {
    // No-op placeholder
  };

  const handleDiscard = () => {
    // No-op placeholder
  };

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <div style={{ flex: "2" }}>
          <InlineEditableText
            value="SUM(active_users) / COUNT(total_visitors)"
            onSave={handleSave}
            onDiscard={handleDiscard}
            placeholder="Enter formula..."
            label="Formula"
          />
        </div>
        <div style={{ flex: "1" }}>
          <InlineEditableText
            value="Last 30 days"
            onSave={handleSave}
            onDiscard={handleDiscard}
            placeholder="Enter timeframe..."
            label="Timeframe"
          />
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <InlineEditableText
          value="This metric tracks the conversion rate of users who visit the homepage and complete signup"
          onSave={handleSave}
          onDiscard={handleDiscard}
          placeholder="Enter description..."
          label="Description"
          multiline
        />
      </div>
      <div>
        <InlineEditableText
          value="Real-time from analytics database"
          onSave={handleSave}
          onDiscard={handleDiscard}
          placeholder="Enter retrieval policy..."
          label="Retrieval Policy"
        />
      </div>
    </div>
  );
};

const useMetrics = {
    tableData : [
    { metric: "Number of users landing on homepage", class: "Active", priority: "P2", type: "Activation",
      expansionComponent: <MetricsDetailCard />
    },
    { metric: "Signup CTR", class: "In Progress", priority: "P1", type: "Engagement" },
    { metric: "Median time spent on page", class: "Planned", priority: "P1", type: "Engagement" },
  ],
  tableColumns: [
    { header: "Metric", accessor: "metric", type: "text" as const },
    { header: "Class", accessor: "class", type: "text" as const },
    { header: "Priority", accessor: "priority", type: "tag" as const },
    { header: "Type", accessor: "type", type: "text" as const }
  ]
};

interface MetricsProp {
  metrics: Metric[]
}

const MetricsView: React.FC<MetricsProp> = (metrics: MetricsProp) => {
  const { tableData, tableColumns } = useMetrics;

  return <TableView data={tableData} columns={tableColumns} />;
};

export default MetricsView;
