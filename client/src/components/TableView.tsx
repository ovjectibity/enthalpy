import React from "react";

interface Column {
  header: string;
  accessor: string;
}

interface TableViewProps {
  data: Array<any>;
  columns: Array<Column>;
}

const TableView: React.FC<TableViewProps> = ({ data, columns }) => {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="data-table-cell">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="data-table-cell">
                  {column.accessor ? row[column.accessor] : ""}
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
