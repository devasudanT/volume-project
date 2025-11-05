import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Play, Plus, Trash2, Grid3X3, Merge, Eye, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Copy, Scissors, ClipboardPaste, RotateCcw } from 'lucide-react';
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
  data: string[][];
  headers?: string[];
  hasHeaders?: boolean;
  mergedCells?: MergedCell[];
  alignment?: 'left' | 'center' | 'right' | 'justify';
  metadata: {
    totalRows: number;
    totalColumns: number;
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

export interface CellStyle {
  textColor: string;
  bgColor: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  fontStyle: 'normal' | 'bold' | 'italic' | 'underline';
  fontSize: number;
  borderColor: string;
  borderWidth: number;
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
  const [useHeader, setUseHeader] = useState(false);
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

  const [cellStyles, setCellStyles] = useState<CellStyle[][]>([]);

  const [contextMenu, setContextMenu] = useState<{x: number, y: number, cell: {row: number, col: number}} | null>(null);

  const [clipboard, setClipboard] = useState<string>('');

  const [alignMode, setAlignMode] = useState(false);

  const [selectedAlignment, setSelectedAlignment] = useState<'left' | 'center' | 'right'>('left');

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

  // Initialize cell styles
  React.useEffect(() => {
    if (cellStyles.length === 0 && tableCreated) {
      const newStyles = Array(rows).fill(null).map(() =>
        Array(columns).fill({
          textColor: '#000000',
          bgColor: '#ffffff',
          textAlign: 'left' as 'left',
          verticalAlign: 'middle' as 'middle',
          fontStyle: 'normal' as 'normal',
          fontSize: 12,
          borderColor: '#e5e5e5',
          borderWidth: 1
        })
      );
      setCellStyles(newStyles);
    }
  }, [rows, columns, cellStyles.length, tableCreated]);

  // Generate column labels for display
  const columnLabels = useMemo(() => {
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
    } else if (alignMode) {
      if (selectedCells.some(cell => cell.row === rowIndex && cell.col === colIndex)) {
        // Deselect
        setSelectedCells(prev => prev.filter(cell => !(cell.row === rowIndex && cell.col === colIndex)));
      } else {
        // Select
        setSelectedCells(prev => [...prev, { row: rowIndex, col: colIndex }]);
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
    setAlignMode(false);
    setMergedCells([]);
    toast({ title: "Cleared", description: "Table data cleared." });
  };

  // Apply alignment to selected cells
  const handleApplyAlignment = () => {
    const newStyles = [...cellStyles];
    selectedCells.forEach(({row, col}) => {
      newStyles[row][col].textAlign = selectedAlignment;
    });
    setCellStyles(newStyles);
    setSelectedCells([]);
    toast({ title: "Alignment Applied", description: `Applied ${selectedAlignment} alignment to selected cells.` });
  };

  // Update table styling configuration
  const updateTableStyling = (newStyling: Partial<TableStylingConfig>) => {
    setTableStyling(prev => ({ ...prev, ...newStyling }));
  };

  return (
    <Card className="shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm border-0">
      <CardHeader className="pb-4">
        <CardTitle className="font-headline flex items-center text-xl">
          <Grid3X3 className="h-7 w-7 mr-3 text-primary" /> Visual Table JSON Compiler
        </CardTitle>
        <CardDescription className="text-sm">
          Click on cells to edit! Super simple visual table editor for vibe coders.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 px-6 pb-6">
        {/* Table Configuration */}
        <div className="bg-muted/50 rounded-lg p-3 mb-2">
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
        <div className="bg-muted/50 rounded-lg p-3">
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-header"
                  checked={useHeader}
                  onChange={(e) => setUseHeader(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="use-header" className="cursor-pointer">First Row as Header</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, the first row is treated as headers and excluded from data rows
              </p>
            </div>
          </div>
        </div>
      </CardContent>

      <CardContent className="space-y-3 px-6 pb-6">
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
                <Label className="text-xs">Click cells to edit:</Label>
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="align-mode"
                    checked={alignMode}
                    onChange={(e) => {
                      setAlignMode(e.target.checked);
                      setSelectedCells([]);
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="align-mode" className="text-sm cursor-pointer">
                    Align Mode
                  </Label>
                </div>
                {/* Styling Mode removed per request */}
              </div>
              <div className="flex gap-2">
                {mergeMode && selectedCells.length === 2 && (
                  <Button onClick={handleMergeCells} size="sm" variant="outline">
                    <Merge className="h-4 w-4 mr-2" /> Merge Selected
                  </Button>
                )}
                {alignMode && selectedCells.length > 0 && (
                  <>
                    <Select value={selectedAlignment} onValueChange={(v) => setSelectedAlignment(v as 'left' | 'center' | 'right')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleApplyAlignment} size="sm" variant="outline">
                      Apply Align
                    </Button>
                  </>
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

            {/* Styling options removed per user request */}

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
                 {columnLabels.map((label: string, colIndex: number) => (
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
                       <span className="truncate text-xs">{label}</span>
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
            <p className="text-xs text-muted-foreground mt-1 px-2 py-1 bg-muted/30 rounded text-center">
              {selectedCells.length === 0 && "Click cells for merge"}
              {selectedCells.length === 1 && "Click adjacent cell"}
              {selectedCells.length === 2 && "Click 'Merge Selected'"}
              {selectedCells.length > 2 && "Too many - restart"}
            </p>
          )}
          {alignMode && (
            <p className="text-xs text-muted-foreground mt-1 px-2 py-1 bg-muted/30 rounded text-center">
              Click cells for align
            </p>
          )}
        </div>
      )}

      {/* Table Preview */}
      {tableCreated && showPreview && tableId && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Preview: {useTableTitle ? (tableTitle || `Table ${tableId}`) : `Table ${tableId}`}</CardTitle>
              {useHeader && (
                <p className="text-xs text-muted-foreground">First row contains headers</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-md">
                <Table className="w-full caption-bottom text-sm" style={{
                  backgroundColor: tableStyling.customBackgroundColor,
                  borderColor: tableStyling.customBorderColor,
                  borderWidth: tableStyling.borderWidth,
                  borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none'
                }}>
                  {/* Show headers row if toggle is on */}
                  {useHeader && (
                    <TableHeader style={{ backgroundColor: tableStyling.customHeaderBackgroundColor }}>
                      <TableRow>
                        {tableData.length > 0 && tableData[0].map((header, index) => (
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
                            {header || `Column ${index + 1}`}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  )}
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
                          
                          // Skip rendering the first row if it's headers
                          if (useHeader && rowIndex === 0) return null;
                          
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
                {useHeader ? `${Math.max(0, tableData.length - 1)} data rows + 1 header row` : `${tableData.length} rows`} × {columns} columns
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