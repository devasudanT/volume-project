import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Plus, Trash2, Table as TableIcon, Grid3X3, Merge, Eye, TableProperties } from 'lucide-react';

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
  data: string[][];
  headers?: string[];
  hasHeaders?: boolean;
  mergedCells?: MergedCell[];
  cellAlignments?: { [key: string]: 'left' | 'center' | 'right' };
  metadata: {
    totalRows: number;
    totalColumns: number;
  };
}

interface TableCompilerProps {
  setJsonOutputs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function TableCompiler({ setJsonOutputs }: TableCompilerProps) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [tableId, setTableId] = useState('');
  const [tableTitle, setTableTitle] = useState('');
  const [useTableTitle, setUseTableTitle] = useState(true);
  const [useHeader, setUseHeader] = useState(false);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergedCells, setMergedCells] = useState<MergedCell[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedTable, setGeneratedTable] = useState<VisualTableData | null>(null);

  // Parse clipboard data from Excel/Google Sheets
  const parseClipboardData = (clipboardText: string): { data: string[][], cellAlignments: { [key: string]: 'left' | 'center' | 'right' }, mergedCells: MergedCell[] } => {
    // Handle different types of line endings
    const lines = clipboardText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    
    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    
    // Parse each line by tabs
    const tableData = nonEmptyLines.map(line => {
      // Excel/Google Sheets typically use tabs as delimiters
      return line.split('\t').map(cell => cell.trim());
    });
    
    // Detect basic formatting patterns
    const cellAlignments: { [key: string]: 'left' | 'center' | 'right' } = {};
    const mergedCells: MergedCell[] = [];
    
    // Simple heuristic: center-align cells that appear to be headers or centered text
    tableData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        
        // Center align if cell contains all caps or numbers (likely headers or centered content)
        if (cell.length > 0) {
          const isAllCaps = cell === cell.toUpperCase() && /[A-Z]/.test(cell);
          const isOnlyNumbers = /^\s*-?\d+(\.\d+)?\s*$/.test(cell);
          const isShort = cell.length <= 10 && rowIndex === 0; // Short header-like text in first row
          
          if (isAllCaps || isOnlyNumbers || isShort) {
            cellAlignments[cellKey] = 'center';
          }
        }
      });
    });
    
    // Basic merged cell detection: look for repeated empty cells in patterns
    for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < tableData[rowIndex].length; colIndex++) {
        const cell = tableData[rowIndex][colIndex];
        
        // If cell is empty, check if it might be part of a merged area
        if (cell === '') {
          let colspan = 1;
          let rowspan = 1;
          
          // Check for horizontal merge (empty cells in sequence)
          while (colIndex + colspan < tableData[rowIndex].length &&
                 tableData[rowIndex][colIndex + colspan] === '') {
            colspan++;
          }
          
          // Check for vertical merge (empty cells below)
          while (rowIndex + rowspan < tableData.length &&
                 tableData[rowIndex + rowspan] &&
                 tableData[rowIndex + rowspan][colIndex] === '') {
            rowspan++;
          }
          
          // If we found a merged area, create a merged cell object
          if (colspan > 1 || rowspan > 1) {
            mergedCells.push({
              row: rowIndex,
              col: colIndex,
              rowspan,
              colspan,
              id: `merged-${rowIndex}-${colIndex}`
            });
            
            // Fill the merged area with the content from the top-left cell
            // Find the content from the nearest non-empty cell
            let content = '';
            for (let r = rowIndex; r >= 0 && content === ''; r--) {
              for (let c = colIndex; c >= 0 && content === ''; c--) {
                if (tableData[r] && tableData[r][c] && tableData[r][c].trim() !== '') {
                  content = tableData[r][c];
                  break;
                }
              }
            }
            
            if (content) {
              tableData[rowIndex][colIndex] = content;
            }
          }
        }
      }
    }
    
    return { data: tableData, cellAlignments, mergedCells };
  };

  // Handle paste table action
  const handlePasteTable = async () => {
    try {
      // Request clipboard access
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        
        if (!clipboardText.trim()) {
          toast({
            title: "No Data",
            description: "No data found in clipboard.",
            variant: "destructive"
          });
          return;
        }

        // Parse the clipboard data with formatting detection
        const { data: parsedDataArray, cellAlignments, mergedCells: detectedMergedCells } = parseClipboardData(clipboardText);
        
        if (parsedDataArray.length === 0 || parsedDataArray.every(row => row.length === 0)) {
          toast({
            title: "Invalid Data",
            description: "Clipboard does not contain valid table data.",
            variant: "destructive"
          });
          return;
        }

        // Find the maximum number of columns in any row
        const maxColumns = Math.max(...parsedDataArray.map(row => row.length));
        
        // Normalize all rows to have the same number of columns
        const normalizedData = parsedDataArray.map(row => {
          const normalizedRow = [...row];
          while (normalizedRow.length < maxColumns) {
            normalizedRow.push('');
          }
          return normalizedRow;
        });

        // Auto-detect if first row should be headers (check if it contains more text-based content)
        const hasHeader = normalizedData.length > 1 &&
          normalizedData[0].some(cell =>
            cell.length > 0 &&
            !/^\s*-?\d+(\.\d+)?\s*$/.test(cell) && // Not a number
            cell.length <= 20 // Reasonable header length
          );

        // Update table dimensions and data
        setRows(normalizedData.length);
        setColumns(maxColumns);
        setTableData(normalizedData);
        setUseHeader(hasHeader);
        setMergedCells(detectedMergedCells);

        // Auto-generate table ID if not set
        if (!tableId.trim()) {
          const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          setTableId(`pasted-table-${timestamp}`);
        }

        // Auto-generate table title if not set
        if (useTableTitle && !tableTitle.trim()) {
          setTableTitle(`Pasted Table ${new Date().toLocaleDateString()}`);
        }

        const formatPreserved = Object.keys(cellAlignments).length > 0 || detectedMergedCells.length > 0;

        toast({
          title: "Table Pasted Successfully!",
          description: `Pasted ${normalizedData.length} rows × ${maxColumns} columns${hasHeader ? ' (with headers)' : ''}${formatPreserved ? ' with preserved formatting' : ''}.`
        });

      } else {
        // Fallback for older browsers
        toast({
          title: "Clipboard Access Not Supported",
          description: "Your browser doesn't support direct clipboard access. Please manually copy the table data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error accessing clipboard:', error);
      toast({
        title: "Clipboard Access Failed",
        description: "Could not access clipboard data. Please ensure you have granted permission.",
        variant: "destructive"
      });
    }
  };

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

  // Generate column labels for display
  const columnLabels = useMemo(() => {
    return Array(columns).fill('').map((_, i) => `Column ${i + 1}`);
  }, [columns]);

  // Handle cell click - edit or select based on mode
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

    // Filter out empty rows
    const finalData = tableData.filter(row =>
      row.some(cell => cell.trim() !== '')
    );

    if (finalData.length === 0) {
      toast({ title: "Error", description: "Please enter some data in the table.", variant: "destructive" });
      return;
    }

    let headers: string[] | undefined;
    let dataRows: string[][];

    if (useHeader && finalData.length > 0) {
      // First row as headers
      headers = finalData[0];
      // Rest as data
      dataRows = finalData.slice(1);
    } else {
      // All rows as data
      dataRows = finalData;
    }

    const generatedData: VisualTableData = {
      type: "table",
      id: tableId.trim(),
      ...(useTableTitle && { title: tableTitle.trim() || `Table ${tableId}` }),
      data: dataRows,
      ...(useHeader && { headers, hasHeaders: true }),
      mergedCells: mergedCells,
      metadata: {
        totalRows: dataRows.length,
        totalColumns: finalData[0]?.length || 0
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
    setUseHeader(false);
    setGeneratedTable(null);
    setEditingCell(null);
    setSelectedCells([]);
    setMergeMode(false);
    setMergedCells([]);
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
            <div className="flex items-center gap-2 mb-2">
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
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="use-header"
                checked={useHeader}
                onChange={(e) => setUseHeader(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="use-header" className="cursor-pointer">First Row as Header</Label>
            </div>
          </div>
        </div>

        {/* Visual Table Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Click cells to select for:</Label>
                <div className="flex items-center gap-1 p-1 rounded-md bg-muted">
                    <Button size="sm" variant={mergeMode ? 'secondary' : 'ghost'} onClick={() => {
                        setMergeMode(!mergeMode);
                        setSelectedCells([]);
                    }}>
                        <Merge className="h-4 w-4 mr-1" />
                        Merge
                    </Button>
                </div>
            </div>
            <div className="flex gap-2">
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

          {mergeMode && (
            <Card className="my-2">
                <CardContent className="p-3 flex items-center gap-4">
                    <p className="text-sm text-muted-foreground flex-grow">
                        {selectedCells.length === 0 ? "Select cells to merge." : selectedCells.length === 1 ? "Select an adjacent cell." : "Click button to merge."}
                    </p>
                    <Button onClick={handleMergeCells} size="sm" variant="outline" disabled={selectedCells.length < 2}>
                        <Merge className="h-4 w-4 mr-2" /> Merge Selected
                    </Button>
                </CardContent>
            </Card>
          )}

          <div className="mt-2 border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  {columnLabels.map((label: string, colIndex: number) => (
                    <TableHead key={colIndex} className="text-center min-w-[120px] relative">
                      <div className="flex items-center justify-center gap-1">
                        <span className="truncate">{label}</span>
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
                      const mergedCell = mergedCells.find(mc => mc.row === rowIndex && mc.col === colIndex);
                      
                      const isCovered = mergedCells.some(mc =>
                        rowIndex >= mc.row && rowIndex < mc.row + mc.rowspan &&
                        colIndex >= mc.col && colIndex < mc.col + mc.colspan &&
                        (rowIndex !== mc.row || colIndex !== mc.col)
                      );

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
        </div>

        {/* Table Preview */}
        {showPreview && tableId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview: {useTableTitle ? (tableTitle || `Table ${tableId}`) : `Table ${tableId}`}</CardTitle>
              {useHeader && (
                <p className="text-sm text-muted-foreground">First row contains headers</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    {tableData.map((row, rowIndex) => {
                      // Skip rendering the first row if it's headers
                      if (useHeader && rowIndex === 0) return null;
                      
                      return (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex} className="text-xs">{cell || ''}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {useHeader ? `${Math.max(0, tableData.length - 1)} data rows + 1 header row` : `${tableData.length} rows`} × {columns} columns
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
          <Button
            onClick={handlePasteTable}
            variant="outline"
          >
            <TableProperties className="h-4 w-4 mr-2" /> Paste Table
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
