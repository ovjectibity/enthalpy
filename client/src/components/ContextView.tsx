import React, { useState } from "react";
import MasterDetail from "./MasterDetail";
import InlineEditableText from "./InlineEditableText";

const ContextView: React.FC = () => {
  // State for objective
  const [objective, setObjective] = useState("");

  // State for product context
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");

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

  const renderDetail = (item: any) => {
    if (item.id === "objective") {
      return (
        <div className="context-detail-content">
          <InlineEditableText
            value={objective}
            onSave={handleObjectiveSave}
            onDiscard={handleObjectiveDiscard}
            placeholder="Enter objective..."
            multiline={true}
            label="Objective"
            autoFocus={false}
            disabled={true}
          />
        </div>
      );
    }

    if (item.id === "product-context") {
      return (
        <div className="context-detail-content">
          <InlineEditableText
            value={productName}
            onSave={handleProductNameSave}
            onDiscard={handleProductNameDiscard}
            placeholder="Enter product name..."
            multiline={false}
            label="Product Name"
            autoFocus={false}
          />
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
