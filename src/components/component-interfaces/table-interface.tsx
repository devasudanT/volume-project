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
  title: string;
  headers: string[];
  data: string[][];
  mergedCells?: MergedCell[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    generatedAt: string;
  };
}

interface TableInterfaceProps {
  setJsonOutputs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function TableCompiler({ setJsonOutputs }: TableInterfaceProps) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [tableId, setTableId] = useState('');
  const [tableTitle, setTableTitle] = useState('');
  const [tableData, setTableData] = useState<string[][]>([]);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedTable, setGeneratedTable] = useState<VisualTableData | null>(null);

  const { toast } = useToast();

  // Initialize empty table data only when component mounts or when table is empty
  React.useEffect(() => {
    if (tableData.length === 0) {
      const newData = Array(rows).fill(null).map(() =>
        Array(columns).fill('')
      );
      setTableData(newData);
    }
  }, [rows, columns, tableData.length]);

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
    if (selectedCells.length !== 2) {
      toast({ title: "Error", description: "Please select exactly 2 adjacent cells to merge.", variant: "destructive" });
      return;
    }

    const [cell1, cell2] = selectedCells;
    const startRow = Math.min(cell1.row, cell2.row);
    const endRow = Math.max(cell1.row, cell2.row);
    const startCol = Math.min(cell1.col, cell2.col);
    const endCol = Math.max(cell1.col, cell2.col);

    // For now, just combine the cell values
    const mergedValue = `${tableData[cell1.row][cell1.col]} ${tableData[cell2.row][cell2.col]}`.trim();

    // Update the first cell with merged value and clear the second
    const newData = [...tableData];
    newData[cell1.row][cell1.col] = mergedValue;
    newData[cell2.row][cell2.col] = '';

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
      title: tableTitle.trim() || `Table ${tableId}`,
      headers: finalHeaders,
      data: filteredData,
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
    setGeneratedTable(null);
    setEditingCell(null);
    setSelectedCells([]);
    setMergeMode(false);
    toast({ title: "Cleared", description: "Table data cleared." });
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rows-count">Rows</Label>
            <Input
              id="rows-count"
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div>
            <Label htmlFor="columns-count">Columns</Label>
            <Input
              id="columns-count"
              type="number"
              min="1"
              max="10"
              value={columns}
              onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="table-id">Table ID</Label>
            <Input
              id="table-id"
              placeholder="e.g., users-table"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="table-title">Table Title</Label>
            <Input
              id="table-title"
              placeholder="e.g., User Information"
              value={tableTitle}
              onChange={(e) => setTableTitle(e.target.value)}
            />
          </div>
        </div>

        {/* Visual Table Editor */}
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
          <div className="mt-2 border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  {headers.map((header, colIndex) => (
                    <TableHead key={colIndex} className="text-center min-w-[120px] relative">
                      <div className="flex items-center justify-center gap-1">
                        <span className="truncate">{header}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteColumn(colIndex);
                          }}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          disabled={columns <= 1}
                        >
                          ×
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="w-16 text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-medium">{rowIndex + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          disabled={rows <= 1}
                        >
                          ×
                        </Button>
                      </div>
                    </TableCell>
                    {row.map((cell, colIndex) => {
                      const isSelected = selectedCells.some(selected =>
                        selected.row === rowIndex && selected.col === colIndex
                      );
                      const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;

                      return (
                        <TableCell
                          key={colIndex}
                          className={`min-w-[120px] cursor-pointer hover:bg-muted/50 transition-colors ${
                            isSelected ? 'ring-4 ring-blue-500 bg-blue-100 border-2 border-blue-400 shadow-lg' : ''
                          }`}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {isEditing ? (
                            <Input
                              value={cell}
                              onChange={(e) => handleCellChange(e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyPress={handleCellKeyPress}
                              className="h-8 w-full"
                              autoFocus
                            />
                          ) : (
                            <div className="h-8 flex items-center overflow-hidden">
                              <span className="truncate w-full">
                                {cell || <span className="text-muted-foreground italic">(click to edit)</span>}
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
            <p className="text-xs text-muted-foreground mt-1">
              {selectedCells.length === 0 && "Click cells to select for merging"}
              {selectedCells.length === 1 && "Click an adjacent cell to merge"}
              {selectedCells.length === 2 && "Click 'Merge Selected' to combine cells"}
              {selectedCells.length > 2 && "Too many cells selected - click a cell to start over"}
            </p>
          )}
        </div>

        {/* Table Preview */}
        {showPreview && tableId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview: {tableTitle || `Table ${tableId}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{cell || ''}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {tableData.length} rows × {headers.length} columns
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
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
          <Button variant="outline" onClick={handleClearTable}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>

        {/* Generated JSON Preview */}
        {generatedTable && (
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