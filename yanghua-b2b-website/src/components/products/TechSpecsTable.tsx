'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TechSpecsTableProps {
  items: { label: string; value: string }[];
  title?: string;
  className?: string;
}

export default function TechSpecsTable({
  items,
  title = 'Technical Specifications',
  className = '',
}: TechSpecsTableProps) {
  if (!items || items.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="sr-only">
            <TableRow>
              <TableHead>Specification</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={`${item.label}-${idx}`}>
                <TableCell className="w-1/2 font-medium text-foreground py-3.5">
                  {item.label}
                </TableCell>
                <TableCell className="w-1/2 text-muted-foreground py-3.5">
                  {item.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
