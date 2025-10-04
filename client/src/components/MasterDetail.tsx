import React, { useState, useEffect } from "react";

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

  // Update selectedId if items change and current selection is invalid
  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
    } else if (
      selectedId === null ||
      !items.find((item) => item.id === selectedId)
    ) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

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
        {(() => {
          const selectedItem = items.find(
            (item: any) => item.id === selectedId,
          );
          return selectedItem ? renderDetail(selectedItem) : null;
        })()}
      </div>
    </div>
  );
};

export default MasterDetail;
