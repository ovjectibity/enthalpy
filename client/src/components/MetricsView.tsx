import React from "react";
import TableView from "./TableView";
import InlineEditableText from "./InlineEditableText";
import { Metric } from "@enthalpy/shared";

interface MetricsDetailCardProps {
  metric: Metric;
}

const MetricsDetailCard: React.FC<MetricsDetailCardProps> = ({ metric }) => {
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
            value={metric.formula}
            onSave={handleSave}
            onDiscard={handleDiscard}
            placeholder="Enter formula..."
            label="Formula"
          />
        </div>
        <div style={{ flex: "1" }}>
          <InlineEditableText
            value={metric.metricTimeframe || ""}
            onSave={handleSave}
            onDiscard={handleDiscard}
            placeholder="Enter timeframe..."
            label="Timeframe"
          />
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <InlineEditableText
          value={metric.description}
          onSave={handleSave}
          onDiscard={handleDiscard}
          placeholder="Enter description..."
          label="Description"
          multiline
        />
      </div>
      <div>
        <InlineEditableText
          value={metric.retrievalPolicy || ""}
          onSave={handleSave}
          onDiscard={handleDiscard}
          placeholder="Enter retrieval policy..."
          label="Retrieval Policy"
        />
      </div>
    </div>
  );
};

const tableColumns = [
  { header: "Metric", accessor: "metric", type: "text" as const },
  { header: "Priority", accessor: "priority", type: "tag" as const },
];

interface MetricsProp {
  metrics: Metric[]
}

const MetricsView: React.FC<MetricsProp> = ({ metrics }) => {
  const tableData = metrics.map((metric) => ({
    metric: metric.name,
    priority: metric.priority,
    expansionComponent: <MetricsDetailCard metric={metric} />
  }));

  return <TableView data={tableData} columns={tableColumns} />;
};

export default MetricsView;
