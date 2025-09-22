// src/components/details/TransactionRow.jsx
import React from "react";
import { THEME } from "../../theme";

const { colors, divider } = THEME;

/**
 * TransactionRow
 * - data: object with values (e.g. { date, amount, source, account })
 * - index: row index (for zebra striping)
 * - columns: number of columns (used to avoid right-border on last cell)
 */
function TransactionRow({ data, index = 0, columns = 4 }) {
  const isEven = index % 2 === 0;
  const rowBg = isEven ? "rgba(0,0,0,0.09)" : "rgba(0,0,0,0.05)";
  const textColor = colors.navy;

  // Preserve ordering of object keys (or customize keys order if needed)
  const values = Object.keys(data).filter((k) => k !== "id").map((k) => data[k]);

  return (
    <tr style={{ backgroundColor: rowBg }}>
      {values.map((value, idx) => (
        <td
          key={idx}
          style={{
            padding: "10px 12px",
            color: textColor,
            fontSize: 16,
            borderRight: idx < columns - 1 ? `1px solid ${divider}` : "none",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}

export default TransactionRow;
