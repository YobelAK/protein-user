"use client";
import React from 'react';
import { Box, Group, Table, Text } from '@mantine/core';
import { Download, CheckCircle } from 'lucide-react';

interface TransactionTableProps {
  fromDate: string;
  toDate: string;
}

export function TransactionTable({ fromDate, toDate }: TransactionTableProps) {
  const transactions = [
    {
      date: '15 Oct 2025',
      transactionId: 'TX-2391',
      product: 'Beach Club Day Pass',
      amount: 'Rp 850.000',
      status: 'Paid',
    },
    {
      date: '12 Oct 2025',
      transactionId: 'TX-2275',
      product: 'Speedboat Ticket',
      amount: 'Rp 115.000',
      status: 'Paid',
    },
    {
      date: '08 Oct 2025',
      transactionId: 'TX-2198',
      product: 'Snorkeling Tour',
      amount: 'Rp 650.000',
      status: 'Paid',
    },
    {
      date: '03 Oct 2025',
      transactionId: 'TX-2145',
      product: 'Island Hopping Package',
      amount: 'Rp 1.250.000',
      status: 'Paid',
    },
  ];

  const thStyle = {
    textAlign: 'left' as const,
    padding: '16px 24px',
    color: '#284361',
    fontWeight: 600,
    fontSize: 14,
  };

  const tdStyle = {
    padding: '16px 24px',
    color: '#374151',
    fontSize: 14,
    borderTop: '1px solid #e5e7eb',
  } as React.CSSProperties;

  return (
    <Box style={{ backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <Table w="100%">
        <thead style={{ backgroundColor: '#e8f1f5' }}>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Transaction ID</th>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Amount</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr
              key={index}
              style={{ transition: 'background-color 120ms ease' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
              }}
            >
              <td style={tdStyle}>{transaction.date}</td>
              <td style={tdStyle}>{transaction.transactionId}</td>
              <td style={tdStyle}>{transaction.product}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>{transaction.amount}</td>
              <td style={tdStyle}>
                <Group gap={8} align="center" style={{ color: '#2dbe8d', fontWeight: 500 }}>
                  <CheckCircle size={20} />
                  <Text c="#2dbe8d">{transaction.status}</Text>
                </Group>
              </td>
              <td style={tdStyle}>
                <Box
                  role="button"
                  aria-label="Download receipt"
                  style={{ cursor: 'pointer', color: '#2dbe8d' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#284361';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#2dbe8d';
                  }}
                >
                  <Download size={20} />
                </Box>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}