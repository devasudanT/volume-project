import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Plus, Trash2, Grid3X3, Merge, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Visual Table Data Interface with Merge Support
export interface MergedCell {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
  id: string;
}

export interface VisualTableData {
  type: "table";
  id: string;
  title?: string;
  headers: string[];
  data: string[][];
  mergedCells?: MergedCell[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    generatedAt: string;
  };
}

export interface TableStylingConfig {
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  headerBackgroundColor: string;
  headerTextColor: string;
  rowStriping: boolean;
  stripeColor: string;
  customTextColor: string;
  customBackgroundColor: string;
  customBorderColor: string;
  customHeaderBackgroundColor: string;
  customHeaderTextColor: string;
  customStripeColor: string;
}

interface TableInterfaceProps {
  setJsonOutputs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function TableCompiler({ setJsonOutputs }: TableInterfaceProps) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [tableId, setTableId] = useState('');
  const [tableTitle, setTableTitle] = useState('');
  const [useTableTitle, setUseTableTitle] = useState(true);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergedCells, setMergedCells] = useState<MergedCell[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedTable, setGeneratedTable] = useState<VisualTableData | null>(null);
  const [tableCreated, setTableCreated] = useState(false);
  const [tableStyling, setTableStyling] = useState<TableStylingConfig>({
    textColor: 'text-foreground',
    backgroundColor: 'bg-background',
    borderColor: 'border-border',
    borderWidth: 1,
    headerBackgroundColor: 'bg-muted',
    headerTextColor: 'text-foreground',
    rowStriping: false,
    stripeColor: 'bg-muted/50',
    customTextColor: '#000000',
    customBackgroundColor: '#ffffff',
    customBorderColor: '#e5e5e5',
    customHeaderBackgroundColor: '#f5f5f5',
    customHeaderTextColor: '#000000',
    customStripeColor: '#f0f0f0'
  });

  const { toast } = useToast();

  // Initialize empty table data only when component mounts or when table is empty
  React.useEffect(() => {
    if (tableData.length === 0 && tableCreated) {
      const newData = Array(rows).fill(null).map(() =>
        Array(columns).fill('')
      );
      setTableData(newData);
    }
  }, [rows, columns, tableData.length, tableCreated]);

  // Generate headers (Column 1, Column 2, etc.)
  const headers = useMemo(() => {
    return Array(columns).fill('').map((_, i) => `Column ${i + 1}`);
  }, [columns]);

  // Handle cell click - edit or select based on merge mode
  const handleCellClick = (rowIndex: number, colIndex: number) => {
    // If already editing a cell, finish editing first
    if (editingCell) {
      setEditingCell(null);
    }

    if (mergeMode) {
      // Merge mode: select cells for merging
      if (selectedCells.length === 0) {
        // First cell selection
        setSelectedCells([{ row: rowIndex, col: colIndex }]);
      } else if (selectedCells.length === 1) {
        // Second cell selection - check if adjacent
        const firstCell = selectedCells[0];
        const secondCell = { row: rowIndex, col: colIndex };

        // Check if cells are adjacent (same row or same column)
        const isAdjacent = (firstCell.row === secondCell.row && Math.abs(firstCell.col - secondCell.col) === 1) ||
                          (firstCell.col === secondCell.col && Math.abs(firstCell.row - secondCell.row) === 1);

        if (isAdjacent) {
          setSelectedCells([...selectedCells, secondCell]);
        } else {
          // Not adjacent, start new selection
          setSelectedCells([secondCell]);
        }
      } else {
        // Multiple cells selected, start new selection
        setSelectedCells([{ row: rowIndex, col: colIndex }]);
      }
    } else {
      // Normal mode: start editing the clicked cell
      setEditingCell({ row: rowIndex, col: colIndex });
      setSelectedCells([]);
    }
  };

  // Handle cell value change
  const handleCellChange = (value: string) => {
    if (editingCell) {
      const newData = [...tableData];
      newData[editingCell.row][editingCell.col] = value;
      setTableData(newData);
    }
  };

  // Handle Enter key in cell input
  const handleCellKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    }
  };

  // Merge selected cells
  const handleMergeCells = () => {
    if (selectedCells.length < 2) {
      toast({ title: "Error", description: "Please select at least two cells to merge.", variant: "destructive" });
      return;
    }

    const minRow = Math.min(...selectedCells.map(c => c.row));
    const maxRow = Math.max(...selectedCells.map(c => c.row));
    const minCol = Math.min(...selectedCells.map(c => c.col));
    const maxCol = Math.max(...selectedCells.map(c => c.col));

    const rowspan = maxRow - minRow + 1;
    const colspan = maxCol - minCol + 1;

    // Check if the selection forms a rectangle
    if (selectedCells.length !== rowspan * colspan) {
      toast({ title: "Error", description: "Selected cells must form a rectangle to be merged.", variant: "destructive" });
      return;
    }

    const mergedValue = selectedCells
      .map(cell => tableData[cell.row][cell.col])
      .join(' ')
      .trim();

    const newData = [...tableData];
    newData[minRow][minCol] = mergedValue;

    const newMergedCell: MergedCell = {
      row: minRow,
      col: minCol,
      rowspan,
      colspan,
      id: `merged-${minRow}-${minCol}`,
    };

    setMergedCells(prev => [...prev, newMergedCell]);
    setTableData(newData);
    setSelectedCells([]);
    toast({ title: "Cells Merged", description: "Selected cells have been merged." });
  };

  // Compile table
  const handleCompileTable = () => {
    if (!tableId.trim()) {
      toast({ title: "Error", description: "Please enter a table ID.", variant: "destructive" });
      return;
    }

    // Use first row as headers if they're filled, otherwise use default headers
    const firstRow = tableData[0] || [];
    const hasCustomHeaders = firstRow.some(cell => cell.trim() !== '');

    const finalHeaders = hasCustomHeaders ? firstRow : headers;
    const finalData = hasCustomHeaders ? tableData.slice(1) : tableData;

    // Filter out empty rows
    const filteredData = finalData.filter(row =>
      row.some(cell => cell.trim() !== '')
    );

    if (filteredData.length === 0) {
      toast({ title: "Error", description: "Please enter some data in the table.", variant: "destructive" });
      return;
    }

    const generatedData: VisualTableData = {
      type: "table",
      id: tableId.trim(),
      ...(useTableTitle && { title: tableTitle.trim() || `Table ${tableId}` }),
      headers: finalHeaders,
      data: filteredData,
      mergedCells: mergedCells,
      metadata: {
        totalRows: filteredData.length,
        totalColumns: finalHeaders.length,
        generatedAt: new Date().toISOString()
      }
    };

    setGeneratedTable(generatedData);
    toast({ title: "Table Compiled!", description: `Table "${generatedData.title}" ready!` });
  };

  // Add compiled table to main output
  const handleAddTableToMain = () => {
    if (!generatedTable) {
      toast({ title: "Error", description: "Please compile the table first.", variant: "destructive" });
      return;
    }

    setJsonOutputs(prev => [...prev, JSON.stringify(generatedTable, null, 2)]);
    toast({ title: "Table Added!", description: `Table "${generatedTable.title}" added to main output.` });
  };

  // Delete specific column
  const handleDeleteColumn = (columnIndex: number) => {
    if (columns <= 1) {
      toast({ title: "Error", description: "Cannot delete the last column.", variant: "destructive" });
      return;
    }

    // Remove column data while preserving other data
    setTableData(prev => prev.map(row => {
      const newRow = [...row];
      newRow.splice(columnIndex, 1); // Remove the specific column
      return newRow;
    }));

    // Update columns count
    setColumns(columns - 1);

    toast({ title: "Column Deleted", description: `Column ${columnIndex + 1} removed.` });
  };

  // Delete specific row
  const handleDeleteRow = (rowIndex: number) => {
    if (rows <= 1) {
      toast({ title: "Error", description: "Cannot delete the last row.", variant: "destructive" });
      return;
    }

    // Remove row data while preserving other data
    setTableData(prev => {
      const newData = [...prev];
      newData.splice(rowIndex, 1); // Remove the specific row
      return newData;
    });

    // Update rows count
    setRows(rows - 1);

    toast({ title: "Row Deleted", description: `Row ${rowIndex + 1} removed.` });
  };

  // Clear everything
  const handleClearTable = () => {
    setTableId('');
    setTableTitle('');
    setUseTableTitle(true);
    setGeneratedTable(null);
    setEditingCell(null);
    setSelectedCells([]);
    setMergeMode(false);
    setMergedCells([]);
    toast({ title: "Cleared", description: "Table data cleared." });
  };

  // Update table styling configuration
  const updateTableStyling = (newStyling: Partial<TableStylingConfig>) => {
    setTableStyling(prev => ({ ...prev, ...newStyling }));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline flex items-center">
          <Grid3X3 className="h-6 w-6 mr-2" /> Visual Table JSON Compiler
        </CardTitle>
        <CardDescription>
          Click on cells to edit! Super simple visual table editor for vibe coders.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Table Configuration */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-lg mb-3 flex items-center">
            <Grid3X3 className="h-5 w-5 mr-2 text-primary" />
            Table Dimensions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows-count" className="flex items-center">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">R</span>
                Rows
              </Label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-r-none border-r-0"
                  onClick={() => setRows(Math.max(1, rows - 1))}
                  disabled={rows <= 1}
                >
                  -
                </Button>
                <Input
                  id="rows-count"
                  type="number"
                  min="1"
                  max="20"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                  className="rounded-none text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0"
                  onClick={() => setRows(Math.min(20, rows + 1))}
                  disabled={rows >= 20}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Min: 1, Max: 20</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="columns-count" className="flex items-center">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">C</span>
                Columns
              </Label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-r-none border-r-0"
                  onClick={() => setColumns(Math.max(1, columns - 1))}
                  disabled={columns <= 1}
                >
                  -
                </Button>
                <Input
                  id="columns-count"
                  type="number"
                  min="1"
                  max="10"
                  value={columns}
                  onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                  className="rounded-none text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0"
                  onClick={() => setColumns(Math.min(10, columns + 1))}
                  disabled={columns >= 10}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Min: 1, Max: 10</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium text-lg mb-3 flex items-center">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">#</span>
            Table Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="table-id">Table ID</Label>
              <Input
                id="table-id"
                placeholder="e.g., users-table"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Unique identifier for the table</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-table-title"
                  checked={useTableTitle}
                  onChange={(e) => setUseTableTitle(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="table-title" className="cursor-pointer">Table Title</Label>
              </div>
              {useTableTitle && (
                <Input
                  id="table-title"
                  placeholder="e.g., User Information"
                  value={tableTitle}
                  onChange={(e) => setTableTitle(e.target.value)}
                />
              )}
              <p className="text-xs text-muted-foreground">Display title for the table</p>
            </div>
          </div>
        </div>

        {/* Styling Controls */}
        {tableCreated && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium text-lg mb-3 flex items-center">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">S</span>
              Styling Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Text Color */}
              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="text-color"
                    value={tableStyling.customTextColor}
                    onChange={(e) => updateTableStyling({ customTextColor: e.target.value })}
                    className="w-12 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={tableStyling.customTextColor}
                    onChange={(e) => updateTableStyling({ customTextColor: e.target.value })}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="bg-color"
                    value={tableStyling.customBackgroundColor}
                    onChange={(e) => updateTableStyling({ customBackgroundColor: e.target.value })}
                    className="w-12 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={tableStyling.customBackgroundColor}
                    onChange={(e) => updateTableStyling({ customBackgroundColor: e.target.value })}
                    className="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Border Color */}
              <div className="space-y-2">
                <Label htmlFor="border-color">Border Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="border-color"
                    value={tableStyling.customBorderColor}
                    onChange={(e) => updateTableStyling({ customBorderColor: e.target.value })}
                    className="w-12 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={tableStyling.customBorderColor}
                    onChange={(e) => updateTableStyling({ customBorderColor: e.target.value })}
                    className="flex-1"
                    placeholder="#e5e5e5"
                  />
                </div>
              </div>

              {/* Border Width */}
              <div className="space-y-2">
                <Label htmlFor="border-width">Border Width</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="border-width"
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={tableStyling.borderWidth}
                    onChange={(e) => updateTableStyling({ borderWidth: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-10 text-center">{tableStyling.borderWidth}px</span>
                </div>
              </div>

              {/* Header Background */}
              <div className="space-y-2">
                <Label htmlFor="header-bg">Header Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="header-bg"
                    value={tableStyling.customHeaderBackgroundColor}
                    onChange={(e) => updateTableStyling({ customHeaderBackgroundColor: e.target.value })}
                    className="w-12 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={tableStyling.customHeaderBackgroundColor}
                    onChange={(e) => updateTableStyling({ customHeaderBackgroundColor: e.target.value })}
                    className="flex-1"
                    placeholder="#f5f5f5"
                  />
                </div>
              </div>

              {/* Header Text Color */}
              <div className="space-y-2">
                <Label htmlFor="header-text">Header Text Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="header-text"
                    value={tableStyling.customHeaderTextColor}
                    onChange={(e) => updateTableStyling({ customHeaderTextColor: e.target.value })}
                    className="w-12 h-10 rounded-md border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={tableStyling.customHeaderTextColor}
                    onChange={(e) => updateTableStyling({ customHeaderTextColor: e.target.value })}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Row Striping */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="row-striping"
                    checked={tableStyling.rowStriping}
                    onChange={(e) => updateTableStyling({ rowStriping: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="row-striping" className="cursor-pointer">
                    Enable Row Striping
                  </Label>
                </div>
                {tableStyling.rowStriping && (
                  <div className="mt-2">
                    <Label htmlFor="stripe-color">Stripe Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        id="stripe-color"
                        value={tableStyling.customStripeColor}
                        onChange={(e) => updateTableStyling({ customStripeColor: e.target.value })}
                        className="w-12 h-10 rounded-md border border-input cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={tableStyling.customStripeColor}
                        onChange={(e) => updateTableStyling({ customStripeColor: e.target.value })}
                        className="flex-1"
                        placeholder="#f0f0f0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Preset Styling Options */}
            <div className="mt-4 pt-4 border-t border-muted">
              <h4 className="font-medium text-md mb-2">Preset Styles</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTableStyling({
                    textColor: 'text-foreground',
                    backgroundColor: 'bg-background',
                    borderColor: 'border-border',
                    borderWidth: 1,
                    headerBackgroundColor: 'bg-muted',
                    headerTextColor: 'text-foreground',
                    rowStriping: false,
                    stripeColor: 'bg-muted/50',
                    customTextColor: '#333333',
                    customBackgroundColor: '#F5F5F5',
                    customBorderColor: '#D9D9D9',
                    customHeaderBackgroundColor: '#E6E6E6',
                    customHeaderTextColor: '#333333',
                    customStripeColor: '#EDEDED'
                  })}
                >
                  Default
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTableStyling({
                    textColor: 'text-primary-foreground',
                    backgroundColor: 'bg-primary',
                    borderColor: 'border-primary',
                    borderWidth: 2,
                    headerBackgroundColor: 'bg-primary/90',
                    headerTextColor: 'text-primary-foreground',
                    rowStriping: true,
                    stripeColor: 'bg-primary/80',
                    customTextColor: '#D8BFD8',
                    customBackgroundColor: '#D8BFD8',
                    customBorderColor: '#D8BFD8',
                    customHeaderBackgroundColor: '#C7AEC7',
                    customHeaderTextColor: '#D8BFD8',
                    customStripeColor: '#E0CCE0'
                  })}
                >
                  Primary Theme
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTableStyling({
                    textColor: 'text-secondary-foreground',
                    backgroundColor: 'bg-secondary',
                    borderColor: 'border-secondary',
                    borderWidth: 1,
                    headerBackgroundColor: 'bg-secondary/90',
                    headerTextColor: 'text-secondary-foreground',
                    rowStriping: false,
                    stripeColor: 'bg-secondary/50',
                    customTextColor: '#E6E6FA',
                    customBackgroundColor: '#E6E6FA',
                    customBorderColor: '#D4D4F0',
                    customHeaderBackgroundColor: '#D4D4F0',
                    customHeaderTextColor: '#E6E6FA',
                    customStripeColor: '#ECECFA'
                  })}
                >
                  Secondary Theme
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTableStyling({
                    textColor: 'text-card-foreground',
                    backgroundColor: 'bg-card',
                    borderColor: 'border-card',
                    borderWidth: 4,
                    headerBackgroundColor: 'bg-card/90',
                    headerTextColor: 'text-card-foreground',
                    rowStriping: true,
                    stripeColor: 'bg-card/50',
                    customTextColor: '#333333',
                    customBackgroundColor: '#ffffff',
                    customBorderColor: '#D9D9D9',
                    customHeaderBackgroundColor: '#f0f0f0',
                    customHeaderTextColor: '#333333',
                    customStripeColor: '#f8f8f8'
                  })}
                >
                  Card Style
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Table Button */}
        {!tableCreated && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Button
              onClick={() => setTableCreated(true)}
              className="w-full max-w-xs"
              disabled={rows < 1 || columns < 1}
            >
              <Grid3X3 className="h-4 w-4 mr-2" /> Create Table
            </Button>
            <p className="text-sm text-muted-foreground">
              Enter rows and columns above, then click "Create Table" to proceed
            </p>
          </div>
        )}

        {/* Visual Table Editor */}
        {tableCreated && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <Label>Click cells to edit:</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="merge-mode"
                    checked={mergeMode}
                    onChange={(e) => {
                      setMergeMode(e.target.checked);
                      setSelectedCells([]);
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="merge-mode" className="text-sm cursor-pointer">
                    Merge Mode
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                {mergeMode && selectedCells.length === 2 && (
                  <Button onClick={handleMergeCells} size="sm" variant="outline">
                    <Merge className="h-4 w-4 mr-2" /> Merge Selected
                  </Button>
                )}
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  size="sm"
                  disabled={!tableId}
                >
                  <Eye className="h-4 w-4 mr-2" /> {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
            </div>
          <div className="mt-2 border rounded-lg overflow-hidden shadow-sm">
           <Table className="w-full caption-bottom text-sm" style={{
             backgroundColor: tableStyling.customBackgroundColor,
             borderColor: tableStyling.customBorderColor,
             borderWidth: tableStyling.borderWidth,
             borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
           }}>
             <TableHeader style={{ backgroundColor: tableStyling.customHeaderBackgroundColor }}>
               <TableRow>
                 <TableHead className="w-12 text-center p-2 font-medium border-r" style={{
                   color: tableStyling.customHeaderTextColor,
                   borderColor: tableStyling.customBorderColor,
                   borderWidth: tableStyling.borderWidth,
                   borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
                 }}>#</TableHead>
                 {headers.map((header, colIndex) => (
                   <TableHead
                     key={colIndex}
                     className="text-center p-2 min-w-[100px] relative font-medium border-r last:border-r-0"
                     style={{
                       color: tableStyling.customHeaderTextColor,
                       borderColor: tableStyling.customBorderColor,
                       borderWidth: tableStyling.borderWidth,
                       borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
                     }}
                   >
                     <div className="flex items-center justify-between">
                       <span className="truncate text-xs">{header}</span>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDeleteColumn(colIndex);
                         }}
                         className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                         disabled={columns <= 1}
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                   </TableHead>
                 ))}
               </TableRow>
             </TableHeader>
             <TableBody>
               {tableData.map((row, rowIndex) => (
                 <TableRow
                   key={rowIndex}
                   style={{
                     backgroundColor: tableStyling.rowStriping && rowIndex % 2 === 1 ? tableStyling.customStripeColor : 'transparent'
                   }}
                   className="hover:bg-muted/30"
                 >
                   <TableCell className="w-12 text-center p-1 border-r" style={{
                     borderColor: tableStyling.customBorderColor,
                     borderWidth: tableStyling.borderWidth,
                     borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
                   }}>
                     <div className="flex items-center justify-center">
                       <span className="text-xs font-medium w-4" style={{ color: tableStyling.customTextColor }}>{rowIndex + 1}</span>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleDeleteRow(rowIndex)}
                         className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full ml-1"
                         disabled={rows <= 1}
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                   </TableCell>
                   {row.map((cell, colIndex) => {
                     // Check if this cell is a merged cell
                     const mergedCell = mergedCells.find(mc => mc.row === rowIndex && mc.col === colIndex);
                     
                     // Check if this cell is part of a merge, but not the master cell
                    const isCovered = mergedCells.some(mc =>
                        rowIndex >= mc.row && rowIndex < mc.row + mc.rowspan &&
                        colIndex >= mc.col && colIndex < mc.col + mc.colspan &&
                        (rowIndex !== mc.row || colIndex !== mc.col)
                    );

                    // Don't render covered cells
                    if (isCovered) return null;
                     
                     const isSelected = selectedCells.some(selected =>
                       selected.row === rowIndex && selected.col === colIndex
                     );
                     const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;

                     return (
                       <TableCell
                         key={colIndex}
                         rowSpan={mergedCell?.rowspan}
                         colSpan={mergedCell?.colspan}
                         className="min-w-[100px] p-1 cursor-pointer transition-colors border-r last:border-r-0"
                         style={{
                           color: tableStyling.customTextColor,
                           borderColor: tableStyling.customBorderColor,
                           borderWidth: tableStyling.borderWidth,
                           borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none',
                           backgroundColor: isSelected ? '#dbeafe' : 'transparent'
                         }}
                         onClick={() => handleCellClick(rowIndex, colIndex)}
                       >
                         {isEditing ? (
                           <Input
                             value={cell}
                             onChange={(e) => handleCellChange(e.target.value)}
                             onBlur={() => setEditingCell(null)}
                             onKeyPress={handleCellKeyPress}
                             className="h-6 w-full text-xs p-1"
                             autoFocus
                           />
                         ) : (
                           <div className="h-6 flex items-center overflow-hidden">
                             <span className="truncate w-full text-xs">
                               {cell || <span className="text-muted-foreground/50 italic text-xs">(click to edit)</span>}
                             </span>
                           </div>
                         )}
                       </TableCell>
                     );
                   })}
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </div>
          {mergeMode && (
            <p className="text-xs text-muted-foreground mt-2 px-1 py-1 bg-muted/50 rounded">
              {selectedCells.length === 0 && "Click cells to select for merging"}
              {selectedCells.length === 1 && "Click an adjacent cell to merge"}
              {selectedCells.length === 2 && "Click 'Merge Selected' to combine cells"}
              {selectedCells.length > 2 && "Too many cells selected - click a cell to start over"}
            </p>
          )}
        </div>
      )}

      {/* Table Preview */}
      {tableCreated && showPreview && tableId && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Preview: {useTableTitle ? (tableTitle || `Table ${tableId}`) : `Table ${tableId}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-md">
                <Table className="w-full caption-bottom text-sm" style={{
                  backgroundColor: tableStyling.customBackgroundColor,
                  borderColor: tableStyling.customBorderColor,
                  borderWidth: tableStyling.borderWidth,
                  borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
                }}>
                  <TableHeader style={{ backgroundColor: tableStyling.customHeaderBackgroundColor }}>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead
                          key={index}
                          className="text-xs font-medium p-2 border-r last:border-r-0"
                          style={{
                            color: tableStyling.customHeaderTextColor,
                            borderColor: tableStyling.customBorderColor,
                            borderWidth: tableStyling.borderWidth,
                            borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
                          }}
                        >
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                        style={{
                          backgroundColor: tableStyling.rowStriping && rowIndex % 2 === 1 ? tableStyling.customStripeColor : 'transparent'
                        }}
                        className="hover:bg-muted/30"
                      >
                        {row.map((cell, cellIndex) => {
                          // Check if this cell is a merged cell
                          const mergedCell = mergedCells.find(mc => mc.row === rowIndex && mc.col === cellIndex);
                          
                          // Check if this cell is part of a merge, but not the master cell
                          const isCovered = mergedCells.some(mc =>
                            rowIndex >= mc.row && rowIndex < mc.row + mc.rowspan &&
                            cellIndex >= mc.col && cellIndex < mc.col + mc.colspan &&
                            (rowIndex !== mc.row || cellIndex !== mc.col)
                          );

                          // Don't render covered cells
                          if (isCovered) return null;
                          
                          return (
                            <TableCell
                              key={cellIndex}
                              rowSpan={mergedCell?.rowspan}
                              colSpan={mergedCell?.colspan}
                              className="p-2 text-xs border-r last:border-r-0"
                              style={{
                                color: tableStyling.customTextColor,
                                borderColor: tableStyling.customBorderColor,
                                borderWidth: tableStyling.borderWidth,
                                borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
                              }}
                            >
                              {cell || ''}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {tableData.length} rows × {headers.length} columns
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {tableCreated && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCompileTable} disabled={!tableId}>
              <Play className="h-4 w-4 mr-2" /> Compile Table
            </Button>
            <Button
              onClick={handleAddTableToMain}
              disabled={!generatedTable}
            >
              <Plus className="h-4 w-4 mr-2" /> Add to Main Output
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleClearTable();
                setTableCreated(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        )}

        {/* Generated JSON Preview */}
        {tableCreated && generatedTable && (
          <ScrollArea className="h-48 w-full rounded-md border p-2 bg-secondary/20">
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(generatedTable, null, 2)}
            </pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}