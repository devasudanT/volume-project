import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Play, Plus, Trash2, Grid3X3, Merge, Eye, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline, Copy, Scissors, ClipboardPaste, RotateCcw, TableProperties } from 'lucide-react';
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
  formattedData?: FormattedCell[][];
  headers?: string[];
  hasHeaders?: boolean;
  mergedCells?: MergedCell[];
  cellAlignments?: { [key: string]: 'left' | 'center' | 'right' };
  cellFormatting?: { [key: string]: CellFormatting };
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

export interface CellFormatting {
  isBold: boolean;
  isItalic: boolean;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
}

export interface FormattedCell {
  text: string;
  formatting: CellFormatting;
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
  const [cellAlignments, setCellAlignments] = useState<{ [key: string]: 'left' | 'center' | 'right' }>({});
  const [cellFormatting, setCellFormatting] = useState<{ [key: string]: CellFormatting }>({});
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

  // Paste table functionality
  const [pasteMode, setPasteMode] = useState(false);

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
    if (tableCreated) {
      // Initialize or update cell styles when table size changes
      setCellStyles(prevStyles => {
        const newStyles = Array(rows).fill(null).map((_, rowIndex) =>
          Array(columns).fill(null).map((_, colIndex) => {
            // Preserve existing styles if they exist, otherwise use defaults
            const existingStyle = prevStyles[rowIndex]?.[colIndex];
            return existingStyle || {
              textColor: '#000000',
              bgColor: '#ffffff',
              textAlign: 'left' as 'left',
              verticalAlign: 'middle' as 'middle',
              fontStyle: 'normal' as 'normal',
              fontSize: 12,
              borderColor: '#e5e5e5',
              borderWidth: 1
            };
          })
        );
        return newStyles;
      });
    }
  }, [rows, columns, tableCreated]);

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

    // Collect cell alignments from cellStyles
    const collectedAlignments: { [key: string]: 'left' | 'center' | 'right' } = {};
    
    // Loop through cellStyles to capture alignment information
    cellStyles.forEach((rowStyles, rowIndex) => {
      rowStyles.forEach((cellStyle, colIndex) => {
        // Only include cells that have non-default alignment (not 'left')
        if (cellStyle && cellStyle.textAlign && cellStyle.textAlign !== 'left') {
          const cellKey = `${rowIndex}-${colIndex}`;
          collectedAlignments[cellKey] = cellStyle.textAlign;
        }
      });
    });

    // Generate enhanced table data with formatting support
    const generatedData: VisualTableData = {
      type: "table",
      id: tableId.trim(),
      ...(useTableTitle && { title: tableTitle.trim() || `Table ${tableId}` }),
      data: dataRows,
      // Add formatted data if we have any formatting information
      ...(Object.keys(cellFormatting).length > 0 && {
        formattedData: dataRows.map((row, rowIndex) =>
          row.map((cell, colIndex) => ({
            text: cell,
            formatting: cellFormatting[`${rowIndex}-${colIndex}`] || {
              isBold: false,
              isItalic: false,
              fontWeight: 'normal' as const,
              fontStyle: 'normal' as const
            }
          }))
        )
      }),
      ...(useHeader && { headers, hasHeaders: true }),
      mergedCells: mergedCells,
      ...(Object.keys(collectedAlignments).length > 0 && { cellAlignments: collectedAlignments }),
      ...(Object.keys(cellFormatting).length > 0 && { cellFormatting }),
      metadata: {
        totalRows: dataRows.length,
        totalColumns: finalData[0]?.length || 0
      }
    };

    setGeneratedTable(generatedData);
    
    // Enhanced compile success message
    const formatFeatures = [];
    if (mergedCells.length > 0) formatFeatures.push(`${mergedCells.length} merged cells`);
    if (Object.keys(collectedAlignments).length > 0) formatFeatures.push(`cell alignments`);
    if (Object.keys(cellFormatting).length > 0) formatFeatures.push(`text formatting`);
    
    const formatDescription = formatFeatures.length > 0 ?
      ` with ${formatFeatures.join(' and ')}` : '';
    
    toast({
      title: "Table Compiled!",
      description: `Table "${generatedData.title}" ready${formatDescription}!`
    });
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
    setCellAlignments({});
    setCellFormatting({});
    setCellStyles([]);
    toast({ title: "Cleared", description: "Table data cleared." });
  };

  // Clear alignments for selected cells
  const handleClearAlignments = () => {
    if (selectedCells.length === 0) {
      toast({ title: "Error", description: "Please select cells to clear alignment.", variant: "destructive" });
      return;
    }

    const newStyles = [...cellStyles];
    selectedCells.forEach(({row, col}) => {
      if (newStyles[row] && newStyles[row][col]) {
        newStyles[row][col].textAlign = 'left';
      }
    });
    setCellStyles(newStyles);
    setSelectedCells([]);
    toast({
      title: "Alignment Cleared",
      description: `Reset alignment for ${selectedCells.length} cell${selectedCells.length > 1 ? 's' : ''}.`
    });
  };

  // Apply alignment to selected cells
  const handleApplyAlignment = () => {
    if (selectedCells.length === 0) {
      toast({ title: "Error", description: "Please select cells to apply alignment.", variant: "destructive" });
      return;
    }

    const newStyles = [...cellStyles];
    selectedCells.forEach(({row, col}) => {
      if (newStyles[row] && newStyles[row][col]) {
        newStyles[row][col].textAlign = selectedAlignment;
      }
    });
    setCellStyles(newStyles);
    setSelectedCells([]);
    toast({
      title: "Alignment Applied",
      description: `Applied ${selectedAlignment} alignment to ${selectedCells.length} cell${selectedCells.length > 1 ? 's' : ''}.`
    });
  };

  // Update table styling configuration
  const updateTableStyling = (newStyling: Partial<TableStylingConfig>) => {
    setTableStyling(prev => ({ ...prev, ...newStyling }));
  };

  // Enhanced Google Sheets HTML formatting detection
  const detectTextFormatting = (text: string, htmlElement?: string): CellFormatting => {
    let cleanText = text;
    let isBold = false;
    let isItalic = false;
    
    // If we have HTML content, parse it for formatting
    if (htmlElement) {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlElement;
      const element = tempDiv.firstElementChild;
      
      if (element) {
        // Check for Google Sheets specific formatting
        const computedStyle = window.getComputedStyle(element);
        const inlineStyle = element.getAttribute('style') || '';
        
        // Check for bold formatting with multiple methods
        const isBoldByTag = element.tagName === 'B' || element.tagName === 'STRONG';
        const isBoldByWeight = computedStyle.fontWeight === 'bold' ||
                              parseInt(computedStyle.fontWeight) >= 600 ||
                              inlineStyle.includes('font-weight: bold') ||
                              inlineStyle.includes('font-weight:700') ||
                              inlineStyle.includes('font-weight:600');
        
        isBold = isBoldByTag || isBoldByWeight;
        
        // Check for italic formatting
        const isItalicByTag = element.tagName === 'I' || element.tagName === 'EM';
        const isItalicByStyle = computedStyle.fontStyle === 'italic' ||
                               inlineStyle.includes('font-style: italic');
        
        isItalic = isItalicByTag || isItalicByStyle;
        
        // Get the clean text content
        cleanText = (element.textContent || text).trim();
        
        console.log(`HTML formatting detected:`, {
          text: cleanText,
          isBold,
          isItalic,
          tagName: element.tagName,
          computedWeight: computedStyle.fontWeight,
          computedStyle: computedStyle.fontStyle,
          inlineStyle
        });
      }
    } else {
      // Fallback to markdown-style formatting detection
      // Detect bold formatting (**text** or __text__)
      const boldRegex = /\*\*(.*?)\*\*|__(.*?)__/g;
      const boldMatches = text.match(boldRegex);
      if (boldMatches && boldMatches.length > 0) {
        isBold = true;
        cleanText = text.replace(boldRegex, (match, p1, p2) => p1 || p2 || match.replace(/\*/g, '').replace(/_/g, ''));
      }
      
      // Detect italic formatting (*text* or _text_ or *text*)
      const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/g;
      const italicMatches = text.match(italicRegex);
      if (italicMatches && italicMatches.length > 0) {
        isItalic = true;
        cleanText = cleanText.replace(italicRegex, (match, p1, p2) => p1 || p2 || match.replace(/\*/g, '').replace(/_/g, ''));
      }
    }
    
    return {
      isBold,
      isItalic,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal'
    };
  };

  // Google Sheets HTML alignment detection
  const detectTextAlignment = (htmlElement: string): 'left' | 'center' | 'right' | null => {
    if (!htmlElement) return null;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlElement;
    const element = tempDiv.firstElementChild;
    
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      const inlineStyle = element.getAttribute('style') || '';
      
      // Check inline styles first (more reliable for Google Sheets)
      if (inlineStyle.includes('text-align: center') || inlineStyle.includes('text-align:center')) return 'center';
      if (inlineStyle.includes('text-align: right') || inlineStyle.includes('text-align:right')) return 'right';
      if (inlineStyle.includes('text-align: left') || inlineStyle.includes('text-align:left')) return 'left';
      
      // Fallback to computed styles
      const textAlign = computedStyle.textAlign;
      
      if (textAlign === 'center' || textAlign === 'middle') return 'center';
      if (textAlign === 'right') return 'right';
      if (textAlign === 'left') return 'left';
      
      // Check for Google Sheets specific alignment
      const cellStyle = element.getAttribute('style') || '';
      if (cellStyle.includes('mso-text-align')) {
        if (cellStyle.includes('mso-text-align:center')) return 'center';
        if (cellStyle.includes('mso-text-align:right')) return 'right';
        if (cellStyle.includes('mso-text-align:left')) return 'left';
      }
    }
    
    return null;
  };

  // Parse Google Sheets HTML clipboard data with enhanced formatting support
  const parseClipboardData = async (clipboardText: string): Promise<{
    data: string[][],
    formattedData: FormattedCell[][],
    cellAlignments: { [key: string]: 'left' | 'center' | 'right' },
    mergedCells: MergedCell[],
    cellFormatting: { [key: string]: CellFormatting }
  }> => {
    console.log('Starting clipboard data parsing...');
    
    // First, try to get HTML clipboard data from Google Sheets
    try {
      console.log('Attempting HTML clipboard access...');
      if (navigator.clipboard && 'read' in navigator.clipboard) {
        const clipboardItems = await navigator.clipboard.read();
        console.log('Clipboard items found:', clipboardItems.length);
        
        for (const clipboardItem of clipboardItems) {
          console.log('Available clipboard types:', clipboardItem.types);
          
          // Look for HTML type in Google Sheets clipboard
          if (clipboardItem.types.includes('text/html')) {
            console.log('Found HTML clipboard data, processing...');
            const htmlBlob = await clipboardItem.getType('text/html');
            const htmlText = await htmlBlob.text();
            console.log('HTML content length:', htmlText.length);
            console.log('HTML snippet:', htmlText.substring(0, 500) + '...');
            
            // Parse HTML table structure
            const result = parseHtmlTable(htmlText);
            console.log('HTML parsing result:', result);
            return result;
          }
        }
        console.log('No HTML clipboard data found, falling back to text parsing');
      } else {
        console.log('HTML clipboard not supported, using text parsing');
      }
    } catch (error) {
      console.error('HTML clipboard access failed, falling back to text parsing:', error);
    }
    
    // Fallback to text-based parsing for non-HTML clipboard data
    console.log('Using text-based parsing');
    return parseTextTable(clipboardText);
  };

  // Parse HTML table data from Google Sheets
  const parseHtmlTable = (htmlText: string): {
    data: string[][],
    formattedData: FormattedCell[][],
    cellAlignments: { [key: string]: 'left' | 'center' | 'right' },
    mergedCells: MergedCell[],
    cellFormatting: { [key: string]: CellFormatting }
  } => {
    console.log('Starting HTML table parsing...');
    
    // Create temporary DOM to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    
    // Find the table element
    const table = tempDiv.querySelector('table');
    if (!table) {
      console.log('No table found in HTML, falling back to text parsing');
      return parseTextTable(htmlText); // Fallback to text parsing
    }

    console.log('Found table element, parsing rows...');
    const rows = table.querySelectorAll('tr');
    const rawData: string[][] = [];
    const cellAlignments: { [key: string]: 'left' | 'center' | 'right' } = {};
    const cellFormatting: { [key: string]: CellFormatting } = {};
    const formattedData: FormattedCell[][] = [];

    console.log(`Processing ${rows.length} rows...`);

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td, th');
      const rowData: string[] = [];
      const formattedRow: FormattedCell[] = [];
      
      console.log(`Row ${rowIndex}: ${cells.length} cells`);
      
      cells.forEach((cell, colIndex) => {
        // Extract cell content
        const cellText = (cell.textContent || '').trim();
        const cellHTML = cell.innerHTML;
        const cellKey = `${rowIndex}-${colIndex}`;
        
        console.log(`Cell [${rowIndex},${colIndex}]: "${cellText}"`);
        
        // Detect formatting from HTML
        const formatting = detectTextFormatting(cellText, cellHTML);
        console.log(`Formatting detected for cell [${rowIndex},${colIndex}]:`, formatting);
        
        // Detect alignment from HTML
        const alignment = detectTextAlignment(cellHTML);
        console.log(`Alignment detected for cell [${rowIndex},${colIndex}]:`, alignment);
        
        rowData.push(cellText);
        formattedRow.push({
          text: cellText,
          formatting
        });
        
        // Store formatting information
        if (formatting.isBold || formatting.isItalic) {
          cellFormatting[cellKey] = formatting;
          console.log(`Storing formatting for cell [${rowIndex},${colIndex}]:`, formatting);
        }
        
        // Store alignment information
        if (alignment) {
          cellAlignments[cellKey] = alignment;
          console.log(`Storing alignment for cell [${rowIndex},${colIndex}]:`, alignment);
        }
      });
      
      rawData.push(rowData);
      formattedData.push(formattedRow);
    });

    // Enhanced merged cell detection for HTML tables
    const mergedCells = detectHtmlMergedCells(table);
    console.log('Detected merged cells:', mergedCells);
    
    console.log('Final parsing results:');
    console.log('- Raw data:', rawData);
    console.log('- Cell formatting:', cellFormatting);
    console.log('- Cell alignments:', cellAlignments);
    console.log('- Merged cells:', mergedCells);
    
    return {
      data: rawData,
      formattedData,
      cellAlignments,
      mergedCells,
      cellFormatting
    };
  };

  // Detect merged cells in HTML table
  const detectHtmlMergedCells = (table: Element): MergedCell[] => {
    const mergedCells: MergedCell[] = [];
    const cells = table.querySelectorAll('td, th');
    
    cells.forEach((cell, index) => {
      const colspan = parseInt(cell.getAttribute('colspan') || '1');
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
      const rowIndex = Math.floor(index / cell.parentElement!.children.length);
      const colIndex = index % cell.parentElement!.children.length;
      
      if (colspan > 1 || rowspan > 1) {
        mergedCells.push({
          row: rowIndex,
          col: colIndex,
          rowspan,
          colspan,
          id: `html-merged-${rowIndex}-${colIndex}-${Date.now()}`
        });
      }
    });
    
    return mergedCells;
  };

  // Fallback text-based parsing for non-HTML clipboard data
  const parseTextTable = (clipboardText: string): {
    data: string[][],
    formattedData: FormattedCell[][],
    cellAlignments: { [key: string]: 'left' | 'center' | 'right' },
    mergedCells: MergedCell[],
    cellFormatting: { [key: string]: CellFormatting }
  } => {
    // Handle different types of line endings
    const lines = clipboardText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    
    // Filter out empty lines
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    
    // Parse each line by tabs
    const rawData: string[][] = nonEmptyLines.map(line => {
      // Excel/Google Sheets typically use tabs as delimiters
      return line.split('\t').map(cell => cell.trim());
    });

    // Basic cell formatting and alignment detection for text data
    const cellAlignments: { [key: string]: 'left' | 'center' | 'right' } = {};
    const cellFormatting: { [key: string]: CellFormatting } = {};
    const formattedData: FormattedCell[][] = [];

    rawData.forEach((row, rowIndex) => {
      const formattedRow: FormattedCell[] = [];
      row.forEach((cell, colIndex) => {
        const formatting = detectTextFormatting(cell);
        const cellKey = `${rowIndex}-${colIndex}`;
        
        // Store formatting information
        if (formatting.isBold || formatting.isItalic) {
          cellFormatting[cellKey] = formatting;
        }
        
        formattedRow.push({
          text: cell,
          formatting
        });
        
        // Basic alignment detection
        if (cell.length > 0) {
          // Center align for headers (bold text in first row or all caps)
          const isHeader = rowIndex === 0 && (formatting.isBold || cell.length <= 15);
          const isAllCaps = cell === cell.toUpperCase() && /[A-Z]/.test(cell);
          const isOnlyNumbers = /^\s*-?\d+(\.\d+)?\s*$/.test(cell);
          const hasFormatting = formatting.isBold || formatting.isItalic;
          
          if (isHeader || isAllCaps || isOnlyNumbers || (hasFormatting && cell.length <= 20)) {
            cellAlignments[cellKey] = 'center';
          }
        }
      });
      formattedData.push(formattedRow);
    });
    
    return {
      data: rawData,
      formattedData,
      cellAlignments,
      mergedCells: [], // No merged cell detection for plain text
      cellFormatting
    };
  };

  // Handle paste table action with enhanced Google Sheets formatting support
  const handlePasteTable = async () => {
    try {
      let clipboardText = '';
      
      // Check if we can access clipboard
      if (navigator.clipboard && 'readText' in navigator.clipboard) {
        try {
          clipboardText = await navigator.clipboard.readText();
        } catch (textError) {
          console.log('Text clipboard access failed, trying HTML only:', textError);
        }
      }
        
      if (!clipboardText.trim()) {
        toast({
          title: "No Data",
          description: "No data found in clipboard.",
          variant: "destructive"
        });
        return;
      }

      // Parse the clipboard data with enhanced Google Sheets HTML formatting detection
      const {
        data: parsedData,
        formattedData,
        cellAlignments,
        mergedCells: detectedMergedCells,
        cellFormatting: detectedFormatting
      } = await parseClipboardData(clipboardText);
      
      if (parsedData.length === 0 || parsedData.every(row => row.length === 0)) {
        toast({
          title: "Invalid Data",
          description: "Clipboard does not contain valid table data.",
          variant: "destructive"
        });
        return;
      }

      // Find the maximum number of columns in any row
      const maxColumns = Math.max(...parsedData.map(row => row.length));
      
      // Normalize all rows to have the same number of columns
      const normalizedData = parsedData.map(row => {
        const normalizedRow = [...row];
        while (normalizedRow.length < maxColumns) {
          normalizedRow.push('');
        }
        return normalizedRow;
      });

      // Auto-detect if first row should be headers (check if it contains formatting or text-based content)
      const hasHeader = normalizedData.length > 1 &&
        normalizedData[0].some((cell, colIndex) => {
          const formatting = formattedData[0]?.[colIndex]?.formatting;
          return cell.length > 0 &&
            !/^\s*-?\d+(\.\d+)?\s*$/.test(cell) && // Not a number
            (cell.length <= 20 || formatting?.isBold || formatting?.isItalic); // Header-like or formatted
        });

      // Update table dimensions and data
      setRows(normalizedData.length);
      setColumns(maxColumns);
      setTableData(normalizedData);
      setCellAlignments(cellAlignments);
      setCellFormatting(detectedFormatting);
      setUseHeader(hasHeader);
      setTableCreated(true);
      setMergedCells(detectedMergedCells);

      // Update cell styles with detected alignments
      const newCellStyles = normalizedData.map((row, rowIndex) =>
        row.map((_, colIndex) => {
          const alignment = cellAlignments[`${rowIndex}-${colIndex}`];
          const formatting = detectedFormatting[`${rowIndex}-${colIndex}`];
          const fontStyle: 'bold' | 'italic' | 'normal' | 'underline' =
            formatting?.isBold ? 'bold' :
            formatting?.isItalic ? 'italic' :
            'normal';
          return {
            textColor: '#000000',
            bgColor: '#ffffff',
            textAlign: alignment || 'left',
            verticalAlign: 'middle' as 'middle',
            fontStyle: fontStyle,
            fontSize: 12,
            borderColor: '#e5e5e5',
            borderWidth: 1
          };
        })
      );
      setCellStyles(newCellStyles);

      // Auto-generate table ID if not set
      if (!tableId.trim()) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        setTableId(`pasted-table-${timestamp}`);
      }

      // Auto-generate table title if not set
      if (useTableTitle && !tableTitle.trim()) {
        const hasFormatting = Object.keys(detectedFormatting).length > 0;
        setTableTitle(`Pasted Table ${new Date().toLocaleDateString()}${hasFormatting ? ' (Formatted)' : ''}`);
      }

      // Enhanced success message with Google Sheets formatting details
      const formatCount = Object.keys(detectedFormatting).length;
      const alignmentCount = Object.keys(cellAlignments).length;
      const hasFormatting = formatCount > 0 || alignmentCount > 0 || detectedMergedCells.length > 0;
      
      const formatDetails = [];
      if (formatCount > 0) formatDetails.push(`${formatCount} formatted cells`);
      if (alignmentCount > 0) formatDetails.push(`${alignmentCount} aligned cells`);
      if (detectedMergedCells.length > 0) formatDetails.push(`${detectedMergedCells.length} merged areas`);

      const formatDescription = hasFormatting ?
        ` with preserved Google Sheets formatting (${formatDetails.join(', ')})` : '';

      toast({
        title: "Table Pasted Successfully!",
        description: `Pasted ${normalizedData.length} rows × ${maxColumns} columns${hasHeader ? ' (with headers)' : ''}${formatDescription}.`
      });

    } catch (error) {
      console.error('Error accessing clipboard:', error);
      toast({
        title: "Clipboard Access Failed",
        description: "Could not access clipboard data. Please ensure you have granted permission.",
        variant: "destructive"
      });
    }
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
        {/* Table Creation Options */}
        {!tableCreated && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
              <Button
                onClick={() => setTableCreated(true)}
                className="flex-1"
                disabled={rows < 1 || columns < 1}
              >
                <Grid3X3 className="h-4 w-4 mr-2" /> Create Table
              </Button>
              <Button
                onClick={handlePasteTable}
                variant="outline"
                className="flex-1"
              >
                <TableProperties className="h-4 w-4 mr-2" /> Paste Table
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              <span className="block">Use "Paste Table" to import from Excel/Google Sheets</span>
              <span className="block">Or set dimensions and click "Create Table" for manual setup</span>
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
                    <Button onClick={handleClearAlignments} size="sm" variant="outline">
                      Clear Align
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

                     // Get cell style for alignment
                     const cellStyle = cellStyles[rowIndex]?.[colIndex];
                     const textAlign = cellStyle?.textAlign || 'left';

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
                           backgroundColor: isSelected ? '#dbeafe' : 'transparent',
                           textAlign: textAlign
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
                          
                          // Get cell style for alignment
                          const cellStyle = cellStyles[rowIndex]?.[cellIndex];
                          const textAlign = cellStyle?.textAlign || 'left';
                          
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
                                borderStyle: tableStyling.borderWidth > 0 ? 'solid' : 'none',
                                textAlign: textAlign
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