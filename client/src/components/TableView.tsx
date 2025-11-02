import React from "react";

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
  if (!data || data.length === 0) {
    return <div className="table-view-empty">No data available</div>;
  }

  const renderCell = (row: any, column: Column) => {
    const value = column.accessor ? row[column.accessor] : "";

    if (column.type === "tag" && value) {
      return <span className="table-view-tag">{value}</span>;
    }

    return value;
  };

  return (
    <div className="table-view-container">
      <table className="table-view">
        <thead>
          <tr className="table-view-header-row">
            {columns.map((column, index) => (
              <th key={index} className="table-view-header-cell">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="table-view-row">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="table-view-cell">
                  {renderCell(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
