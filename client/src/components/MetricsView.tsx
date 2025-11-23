import React from "react";
import TableView from "./TableView";
import { Metric } from "@enthalpy/shared";

const useMetrics = {
    tableData : [
    { metric: "Number of users landing on homepage", class: "Active", priority: "P2", type: "Activation"},
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
