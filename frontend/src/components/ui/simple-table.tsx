import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
}

interface TableCaptionProps {
  children: React.ReactNode;
  className?: string;
}

const Root: React.FC<TableProps> = ({ children, className = "" }) => (
  <table className={`min-w-full ${className}`}>
    {children}
  </table>
);

const Caption: React.FC<TableCaptionProps> = ({ children, className = "" }) => (
  <caption className={`text-lg font-semibold mb-4 ${className}`}>
    {children}
  </caption>
);

const Head: React.FC<TableProps> = ({ children, className = "" }) => (
  <thead className={className}>
    {children}
  </thead>
);

const Body: React.FC<TableProps> = ({ children, className = "" }) => (
  <tbody className={className}>
    {children}
  </tbody>
);

const Foot: React.FC<TableProps> = ({ children, className = "" }) => (
  <tfoot className={className}>
    {children}
  </tfoot>
);

const Row: React.FC<TableRowProps> = ({ children, className = "" }) => (
  <tr className={className}>
    {children}
  </tr>
);

const Header: React.FC<TableHeaderProps> = ({ children, className = "", textAlign = "left" }) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[textAlign];

  return (
    <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${alignClass} ${className}`}>
      {children}
    </th>
  );
};

const Cell: React.FC<TableCellProps> = ({ 
  children, 
  className = "", 
  colSpan,
  textAlign = "left",
  fontWeight = "normal"
}) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[textAlign];

  const weightClass = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }[fontWeight];

  return (
    <td 
      className={`px-6 py-4 ${alignClass} ${weightClass} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

export const Table = {
  Root,
  Caption,
  Head,
  Body,
  Foot,
  Row,
  Header,
  Cell
};
