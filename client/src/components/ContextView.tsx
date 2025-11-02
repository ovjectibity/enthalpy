import React from "react";
import MasterDetail from "./MasterDetail";

const ContextView: React.FC = () => {
  const items = [
    { id: "objective", label: "Objective" },
    { id: "product-context", label: "Product context" },
  ];

  const renderMasterItem = (item: any) => {
    return <div>{item.label}</div>;
  };

  const renderDetail = (item: any) => {
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
