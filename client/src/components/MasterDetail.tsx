import React, { useState } from "react";

interface MasterDetailProps {
  items: any[];
  renderMasterItem: (item: any) => React.ReactNode;
  renderDetail: (item: any) => React.ReactNode;
}

const MasterDetail: React.FC<MasterDetailProps> = ({
  items,
  renderMasterItem,
  renderDetail,
}) => {
  const [selectedId, setSelectedId] = useState(
    items.length ? items[0].id : null,
  );

  return (
    <div className="master-detail-root">
      <div className="master-list">
        {items.map((item: any) => (
          <button
            key={item.id}
            className={`master-item${selectedId === item.id ? " selected" : ""}`}
            onClick={() => setSelectedId(item.id)}
          >
            {renderMasterItem(item)}
          </button>
        ))}
      </div>
      <div className="detail-pane">
        {selectedId &&
          renderDetail(
            items.find((item: any) => item.id === selectedId),
          )}
      </div>
    </div>
  );
};

export default MasterDetail;
