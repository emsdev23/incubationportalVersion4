import React, { useState, useContext, useEffect, useMemo } from "react";
import styles from "./IncubatorSelectorTable.module.css";
import {
  ChevronDown,
  Building,
  Users,
  Mail,
  Globe,
  MapPin,
  Search,
  Download,
} from "lucide-react";
import { DataContext } from "../Components/Datafetching/DataProvider";
import { IPAdress } from "./Datafetching/IPAdrees";
import * as XLSX from "xlsx";

const IncubatorSelectorTable = () => {
  const {
    incubationList,
    selectedIncubation,
    incubationDetails,
    incubationLoading,
    handleIncubationSelect,
    resetIncubationSelection,
  } = useContext(DataContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [allIncubationDetails, setAllIncubationDetails] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Reset selection when component mounts (for login/logout scenarios)
  useEffect(() => {
    if (!isInitialized) {
      resetIncubationSelection();
      setIsInitialized(true);
    }
  }, [isInitialized, resetIncubationSelection]);

  // Fetch all incubation details when component mounts
  useEffect(() => {
    const fetchAllIncubationDetails = async () => {
      try {
        const response = await fetch(
          `${IPAdress}/itelinc/resources/generic/getincubationdetails`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              userId: sessionStorage.getItem("userid"),
              userIncId: "ALL",
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.statusCode === 200 && data.data) {
            setAllIncubationDetails(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching all incubation details:", error);
      }
    };

    fetchAllIncubationDetails();
  }, []);

  // Merge incubation list with their details
  const mergedIncubationList = useMemo(() => {
    return incubationList.map((incubator) => {
      const details = allIncubationDetails.find(
        (detail) => detail.incubationsrecid === incubator.incubationsrecid
      );
      return { ...incubator, ...details };
    });
  }, [incubationList, allIncubationDetails]);

  // Function to get the logo URL
  const getLogoUrl = (incubator) => {
    if (incubator && incubator.incubationslogopath) {
      // If the path starts with http, use it directly
      if (incubator.incubationslogopath.startsWith("http")) {
        return incubator.incubationslogopath;
      }
      // Otherwise, prepend the base URL
      return `${IPAdress}${incubator.incubationslogopath}`;
    }
    // Return default logo if no logo path
    return "/images/default-logo.png";
  };

  // Handle dropdown selection
  const handleDropdownSelect = async (incubator) => {
    setDropdownOpen(false);
    if (incubator) {
      setIsSelecting(true);

      try {
        await handleIncubationSelect(incubator);
        console.log(`Selected company: ${incubator.incubationshortname}`);
      } catch (error) {
        console.error("Error selecting company:", error);
      } finally {
        setIsSelecting(false);
      }
    } else {
      setIsSelecting(true);

      try {
        await resetIncubationSelection();
        console.log("Reset to all companies");
      } catch (error) {
        console.error("Error resetting selection:", error);
      } finally {
        setIsSelecting(false);
      }
    }
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // If clicking the same column, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a different column, set it as the sort column and default to asc
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Helper function to render sort indicator
  const renderSortIndicator = (column) => {
    const isActive = sortColumn === column;
    const isAsc = sortDirection === "asc";

    return (
      <span
        className={`${styles.sortIndicator} ${
          isActive ? styles.activeSort : styles.inactiveSort
        }`}
      >
        {isActive ? (isAsc ? " ▲" : " ▼") : " ↕"}
      </span>
    );
  };

  // Sort and filter data using useMemo for performance
  const processedData = useMemo(() => {
    // Filter to show only selected incubator if one is selected
    let dataToProcess = selectedIncubation
      ? mergedIncubationList.filter(
          (incubator) =>
            incubator.incubationsrecid === selectedIncubation.incubationsrecid
        )
      : mergedIncubationList;

    // First sort the data
    let sortedData = [...dataToProcess];

    if (sortColumn) {
      sortedData.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) aVal = "";
        if (bVal === null || bVal === undefined) bVal = "";

        // Compare values
        let comparison = 0;
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        } else {
          comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    // Then filter the data by search term
    return sortedData.filter((incubator) => {
      const matchesSearch =
        (incubator.incubationsname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (incubator.incubationshortname || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (incubator.incubationsemail || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (incubator.incubationsaddress || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [
    mergedIncubationList,
    sortColumn,
    sortDirection,
    searchTerm,
    selectedIncubation,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex =
    incubationList.length > 0 ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = startIndex + itemsPerPage;
  const currentData = processedData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortColumn, sortDirection, selectedIncubation, isSelecting]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Export to CSV function
  const exportToCSV = () => {
    // Create a copy of the data for export
    const exportData = processedData.map((item) => ({
      "Company ID": item.incubationsrecid || "",
      "Short Name": item.incubationshortname || "",
      "Full Name": item.incubationsname || "N/A",
      Email: item.incubationsemail || "N/A",
      Website: item.incubationswebsite || "N/A",
      Address: item.incubationsaddress || "N/A",
      "Number of Founders": item.incubationsnooffounders || "N/A",
      Founders: item.incubationsfounders || "N/A",
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            // Handle values that might contain commas
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `companies_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (!isXLSXAvailable) {
      console.error("XLSX library not available");
      alert("Excel export is not available. Please install the xlsx package.");
      return;
    }

    try {
      // Create a copy of the data for export
      const exportData = processedData.map((item) => ({
        "Company ID": item.incubationsrecid || "",
        "Short Name": item.incubationshortname || "",
        "Full Name": item.incubationsname || "N/A",
        Email: item.incubationsemail || "N/A",
        Website: item.incubationswebsite || "N/A",
        Address: item.incubationsaddress || "N/A",
        "Number of Founders": item.incubationsnooffounders || "N/A",
        Founders: item.incubationsfounders || "N/A",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Companies");

      // Generate the Excel file and download
      XLSX.writeFile(
        wb,
        `companies_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Falling back to CSV export.");
      exportToCSV();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownOpen &&
        !event.target.closest(`.${styles.dropdownContainer}`)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className={styles.container}>
      {/* Dropdown Section */}
      <div className={styles.dropdownSection}>
        <div className={styles.dropdownContainer}>
          <button
            className={`${styles.dropdownButton} ${
              selectedIncubation ? styles.selectedDropdown : ""
            }`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {selectedIncubation
              ? selectedIncubation.incubationshortname
              : "All Incubators"}
            <ChevronDown className={styles.dropdownIcon} />
            {isSelecting && (
              <div className={styles.loadingIndicator}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div
                className={`${styles.dropdownItem} ${
                  !selectedIncubation ? styles.selectedItem : ""
                }`}
                onClick={() => handleDropdownSelect(null)}
              >
                All Incubators
              </div>
              {incubationList.map((incubator) => (
                <div
                  key={incubator.incubationsrecid}
                  className={`${styles.dropdownItem} ${
                    selectedIncubation?.incubationsrecid ===
                    incubator.incubationsrecid
                      ? styles.selectedItem
                      : ""
                  }`}
                  onClick={() => handleDropdownSelect(incubator)}
                >
                  {incubator.incubationshortname}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            Incubator Directory
            {selectedIncubation && (
              <span className={styles.selectedIncubatorIndicator}>
                (Showing: {selectedIncubation.incubationshortname})
              </span>
            )}
          </h2>
          <div className={styles.exportButtons}>
            <button
              className={styles.exportButton}
              onClick={exportToCSV}
              title="Export as CSV"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              className={`${styles.exportButton} ${
                !isXLSXAvailable ? styles.disabledButton : ""
              }`}
              onClick={exportToExcel}
              title={
                isXLSXAvailable
                  ? "Export as Excel"
                  : "Excel export not available"
              }
              disabled={!isXLSXAvailable}
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search companies by name, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className={styles.select}
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>

        <div className={styles.resultsInfo}>
          Showing {startIndex + 1} to {Math.min(endIndex, processedData.length)}{" "}
          of {processedData.length} companies
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.incubatorTable}>
            <thead>
              <tr>
                {/* <th>Logo</th> */}
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("incubationsname")}
                >
                  Name {renderSortIndicator("incubationsname")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("incubationshortname")}
                >
                  Short Name {renderSortIndicator("incubationshortname")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("incubationsemail")}
                >
                  Email {renderSortIndicator("incubationsemail")}
                </th>
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("incubationswebsite")}
                >
                  Website {renderSortIndicator("incubationswebsite")}
                </th>
                {/* <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("incubationsaddress")}
                >
                  Address {renderSortIndicator("incubationsaddress")}
                </th> */}
                <th
                  className={styles.sortableHeader}
                  onClick={() => handleSort("incubationsnooffounders")}
                >
                  Founders {renderSortIndicator("incubationsnooffounders")}
                </th>
              </tr>
            </thead>
            <tbody>
              {incubationLoading ? (
                <tr>
                  <td colSpan="7" className={styles.loadingCell}>
                    Loading company data...
                  </td>
                </tr>
              ) : mergedIncubationList.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.noDataCell}>
                    No company data available
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.noDataCell}>
                    No companies found matching your search criteria.
                  </td>
                </tr>
              ) : (
                currentData.map((incubator) => (
                  <tr
                    key={incubator.incubationsrecid}
                    className={`${styles.tableRow} ${
                      selectedIncubation?.incubationsrecid ===
                      incubator.incubationsrecid
                        ? styles.selectedRow
                        : ""
                    }`}
                  >
                    {/* <td className={styles.logoCell}>
                      <img
                        src={getLogoUrl(incubator)}
                        alt={incubator.incubationshortname}
                        className={styles.incubatorLogo}
                      />
                    </td> */}
                    <td>{incubator.incubationsname || "N/A"}</td>
                    <td>{incubator.incubationshortname}</td>
                    <td>
                      {incubator.incubationsemail ? (
                        <a href={`mailto:${incubator.incubationsemail}`}>
                          {incubator.incubationsemail}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {incubator.incubationswebsite ? (
                        <a
                          href={incubator.incubationswebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {incubator.incubationswebsite}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    {/* <td>{incubator.incubationsaddress || "N/A"}</td> */}
                    <td>
                      {incubator.incubationsfounders || "N/A"}
                      {incubator.incubationsnooffounders && (
                        <span className={styles.founderCount}>
                          (No.of Founders :- {incubator.incubationsnooffounders}
                          )
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={`${styles.paginationBtn} ${
                currentPage === 1 ? styles.disabled : ""
              }`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className={styles.ellipsis}>...</span>
                ) : (
                  <button
                    className={`${styles.paginationBtn} ${styles.pageNumber} ${
                      currentPage === page ? styles.active : ""
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}

            <button
              className={`${styles.paginationBtn} ${
                currentPage === totalPages ? styles.disabled : ""
              }`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Company Details Section */}
      {/* {selectedIncubation && (
        <div className={styles.detailsSection}>
          <h3 className={styles.detailsTitle}>
            {selectedIncubation.incubationshortname} Details
          </h3>

          <div className={styles.detailsGrid}>
            <div className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <Building className={styles.detailIcon} />
                <h4>General Information</h4>
              </div>
              <div className={styles.detailContent}>
                <p>
                  <strong>Full Name:</strong>{" "}
                  {selectedIncubation.incubationsname || "N/A"}
                </p>
                <p>
                  <strong>Short Name:</strong>{" "}
                  {selectedIncubation.incubationshortname}
                </p>
                <p>
                  <strong>Number of Founders:</strong>{" "}
                  {selectedIncubation.incubationsnooffounders || "N/A"}
                </p>
                <p>
                  <strong>Founders:</strong>{" "}
                  {selectedIncubation.incubationsfounders || "N/A"}
                </p>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <Mail className={styles.detailIcon} />
                <h4>Contact Information</h4>
              </div>
              <div className={styles.detailContent}>
                <p>
                  <strong>Email:</strong>{" "}
                  {selectedIncubation.incubationsemail ? (
                    <a href={`mailto:${selectedIncubation.incubationsemail}`}>
                      {selectedIncubation.incubationsemail}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  {selectedIncubation.incubationswebsite ? (
                    <a
                      href={selectedIncubation.incubationswebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedIncubation.incubationswebsite}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p>
                  <strong>Address:</strong>{" "}
                  {selectedIncubation.incubationsaddress || "N/A"}
                </p>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <Users className={styles.detailIcon} />
                <h4>Administrative Information</h4>
              </div>
              <div className={styles.detailContent}>
                <p>
                  <strong>Created By:</strong>{" "}
                  {selectedIncubation.incubationscreatedby || "N/A"}
                </p>
                <p>
                  <strong>Created Time:</strong>{" "}
                  {selectedIncubation.incubationscreatedtime
                    ? new Date(
                        selectedIncubation.incubationscreatedtime
                      ).toLocaleString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Modified By:</strong>{" "}
                  {selectedIncubation.incubationsmodifiedby || "N/A"}
                </p>
                <p>
                  <strong>Modified Time:</strong>{" "}
                  {selectedIncubation.incubationsmodifiedtime
                    ? new Date(
                        selectedIncubation.incubationsmodifiedtime
                      ).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default IncubatorSelectorTable;
