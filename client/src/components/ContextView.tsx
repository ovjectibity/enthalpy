import React, { useState } from "react";
import MasterDetail from "./MasterDetail";
import InlineEditableText from "./InlineEditableText";
import TableView from "./TableView";
import useContext, {UseContextParams} from "../hooks/useContext";

const ContextView: React.FC<UseContextParams> = ({ userId, projectId, updateIndex }) => {
  const { contextData, loading, error } = useContext({ userId, projectId, updateIndex });

  // Local state for product context (editable)
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");

  // Update local state when context data is loaded
  React.useEffect(() => {
    if (contextData.productName) {
      setProductName(contextData.productName);
    }
    if (contextData.productUrl) {
      setProductUrl(contextData.productUrl);
    }
  }, [contextData]);

  const items = [
    { id: "objective", label: "Objective" },
    { id: "product-context", label: "Product context" },
  ];

  const renderMasterItem = (item: any) => {
    return (
      <div className={"master-list-item context-view-master-list"}>
        <div className="master-list-title">{item.label}</div>
      </div>
    );
  };

  const handleObjectiveSave = (value: string) => {
    // Placeholder: This won't actually save since editing is disabled
    console.log("Objective save:", value);
  };

  const handleObjectiveDiscard = () => {
    // Placeholder
    console.log("Objective discard");
  };

  const handleProductNameSave = (value: string) => {
    // Placeholder: Will be replaced with actual API call
    setProductName(value);
    console.log("Product name saved:", value);
  };

  const handleProductNameDiscard = () => {
    // Placeholder
    console.log("Product name discard");
  };

  const handleProductUrlSave = (value: string) => {
    // Placeholder: Will be replaced with actual API call
    setProductUrl(value);
    console.log("Product URL saved:", value);
  };

  const handleProductUrlDiscard = () => {
    // Placeholder
    console.log("Product URL discard");
  };

  // Placeholder data for table
  const tableData = [
    { feature: "User Authentication", status: "Active", priority: "High" },
    { feature: "Dashboard", status: "In Progress", priority: "Medium" },
    { feature: "Analytics", status: "Planned", priority: "Low" },
    { feature: "Notifications", status: "Active", priority: "Medium" },
  ];

  const tableColumns = [
    { header: "Feature", accessor: "feature", type: "text" as const },
    { header: "Status", accessor: "status", type: "tag" as const },
    { header: "Priority", accessor: "priority", type: "text" as const },
  ];

  const renderDetail = (item: any) => {
    if (item.id === "objective") {
      return (
        <>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error: {error}</div>
          ) : (
            <div className="detail-section">
              <InlineEditableText
                value={contextData.objective?.description || ""}
                onSave={handleObjectiveSave}
                onDiscard={handleObjectiveDiscard}
                placeholder="No objective available..."
                multiline={true}
                label="Objective"
                autoFocus={false}
                disabled={true}
              />
            </div>
          )}
        </>
      );
    }

    if (item.id === "product-context") {
      return (
        <>
          <div className="detail-section">
            <InlineEditableText
              value={productName}
              onSave={handleProductNameSave}
              onDiscard={handleProductNameDiscard}
              placeholder="Enter product name..."
              multiline={false}
              label="Product Name"
              autoFocus={false}
            />
          </div>

          <div className="detail-section">
            <InlineEditableText
              value={productUrl}
              onSave={handleProductUrlSave}
              onDiscard={handleProductUrlDiscard}
              placeholder="Enter product URL..."
              multiline={false}
              label="Product URL"
              autoFocus={false}
            />
          </div>

          <div className="detail-section">
            <TableView data={tableData} columns={tableColumns} />
          </div>
        </>
      );
    }

    return <div></div>;
  };

  return (
    <MasterDetail
      items={items}
      renderMasterItem={renderMasterItem}
      renderDetail={renderDetail}
    />
  );
};

export default ContextView;
