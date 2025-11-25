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
  const [cellAlignments, setCellAlignments] = useState<{ [key: string]: 'left' | 'center' | 'right' }>({});
  const [cellFormatting, setCellFormatting] = useState<{ [key: string]: CellFormatting }>({});
  const [showPreview, setShowPreview] = useState(false);
  const [generatedTable, setGeneratedTable] = useState<VisualTableData | null>(null);

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
        data: parsedDataArray,
        formattedData,
        cellAlignments,
        mergedCells: detectedMergedCells,
        cellFormatting
      } = await parseClipboardData(clipboardText);
      
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
      setCellFormatting(cellFormatting);
      setUseHeader(hasHeader);
      setMergedCells(detectedMergedCells);

      // Auto-generate table ID if not set
      if (!tableId.trim()) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        setTableId(`pasted-table-${timestamp}`);
      }

      // Auto-generate table title if not set
      if (useTableTitle && !tableTitle.trim()) {
        const hasFormatting = Object.keys(cellFormatting).length > 0;
        setTableTitle(`Pasted Table ${new Date().toLocaleDateString()}${hasFormatting ? ' (Formatted)' : ''}`);
      }

      // Enhanced success message with Google Sheets formatting details
      const formatCount = Object.keys(cellFormatting).length;
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

  // Compile table with enhanced formatting support
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

    // Generate enhanced table data with formatting support
    const generatedData: VisualTableData = {
      type: "table",
      id: tableId.trim(),
      ...(useTableTitle && { title: tableTitle.trim() || `Table ${tableId}` }),
      data: dataRows,
      // Add formatted data if we have any formatting information
      ...(mergedCells.length > 0 && {
        formattedData: dataRows.map((row, rowIndex) =>
          row.map((cell, colIndex) => ({
            text: cell,
            formatting: {
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
      cellAlignments: Object.keys(cellAlignments).length > 0 ? cellAlignments : undefined,
      metadata: {
        totalRows: dataRows.length,
        totalColumns: finalData[0]?.length || 0
      }
    };

    setGeneratedTable(generatedData);
    
    // Enhanced compile success message
    const formatFeatures = [];
    if (mergedCells.length > 0) formatFeatures.push(`${mergedCells.length} merged cells`);
    if (Object.keys(cellAlignments).length > 0) formatFeatures.push(`cell alignments`);
    
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
    setMergedCells([]);
    setCellAlignments({});
    setCellFormatting({});
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
