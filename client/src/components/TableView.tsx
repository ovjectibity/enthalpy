import React, { useState } from "react";
import ChevronDownIcon from "../assets/chevron-down-icon.svg";

interface Column {
  header: string;
  accessor: string;
  type?: "text" | "tag";
}

interface TableViewProps {
  data: Array<any>;
  columns: Array<Column>;
}

const TableView: React.FC<TableViewProps> = ({ data, columns }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (!data || data.length === 0) {
    return <div className="table-view-empty">No data available</div>;
  }

  const toggleRow = (rowIndex: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowIndex)) {
      newExpandedRows.delete(rowIndex);
    } else {
      newExpandedRows.add(rowIndex);
    }
    setExpandedRows(newExpandedRows);
  };

  const renderCell = (row: any, column: Column) => {
    const value = column.accessor ? row[column.accessor] : "";

    if (column.type === "tag" && value) {
      return <span className="table-view-tag">{value}</span>;
    }

    return value;
  };

  const hasAnyExpandableRows = data.some(row => row.expansionComponent);

  return (
    <div className="table-view-container">
      <table className="table-view">
        <thead>
          <tr className="table-view-header-row">
            {hasAnyExpandableRows && <th className="table-view-header-cell" style={{ width: '40px' }}></th>}
            {columns.map((column, index) => (
              <th key={index} className="table-view-header-cell">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => {
            const isExpandable = !!row.expansionComponent;
            const isExpanded = expandedRows.has(rowIndex);

            return (
              <React.Fragment key={rowIndex}>
                <tr
                  className="table-view-row"
                  onClick={() => isExpandable && toggleRow(rowIndex)}
                  style={isExpandable ? { cursor: 'pointer' } : undefined}
                >
                  {hasAnyExpandableRows && (
                    <td className="table-view-cell" style={{ width: '40px', textAlign: 'center' }}>
                      {isExpandable && (
                        <img
                          src={ChevronDownIcon}
                          alt="expand"
                          style={{
                            width: '16px',
                            height: '16px',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      )}
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="table-view-cell">
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
                {isExpandable && isExpanded && (
                  <tr>
                    <td colSpan={hasAnyExpandableRows ? columns.length + 1 : columns.length}>
                      <div>{row.expansionComponent}</div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
