// Test file to demonstrate the optional table title functionality
interface VisualTableData {
  type: "table";
  id: string;
  title?: string;
  headers: string[];
  data: string[][];
  metadata: {
    totalRows: number;
    totalColumns: number;
    generatedAt: string;
  };
}

// Example of a table with title
const tableWithTitle: VisualTableData = {
  type: "table",
  id: "users-table",
  title: "User Information",
  headers: ["Name", "Email", "Role"],
  data: [
    ["John Doe", "john@example.com", "Admin"],
    ["Jane Smith", "jane@example.com", "User"]
  ],
  metadata: {
    totalRows: 2,
    totalColumns: 3,
    generatedAt: new Date().toISOString()
  }
};

// Example of a table without title
const tableWithoutTitle: VisualTableData = {
  type: "table",
  id: "products-table",
  headers: ["Product", "Price", "Stock"],
  data: [
    ["Laptop", "$999", "10"],
    ["Mouse", "$25", "50"]
  ],
  metadata: {
    totalRows: 2,
    totalColumns: 3,
    generatedAt: new Date().toISOString()
  }
};

// Test JSON output
console.log("Table with title JSON:");
console.log(JSON.stringify(tableWithTitle, null, 2));

console.log("\nTable without title JSON:");
console.log(JSON.stringify(tableWithoutTitle, null, 2));

export { tableWithTitle, tableWithoutTitle };