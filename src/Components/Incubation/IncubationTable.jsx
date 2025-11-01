import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSpinner,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import "./IncubationTable.css";
import { IPAdress } from "../Datafetching/IPAdrees";

export default function IncubationTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const IP = IPAdress;
  const [incubations, setIncubations] = useState([]);
  const [filteredIncubations, setFilteredIncubations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting states
  const [sortColumn, setSortColumn] = useState("sno");
  const [sortDirection, setSortDirection] = useState("asc");

  // Loading states for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(null); // Store incubation ID being updated
  const [isDeleting, setIsDeleting] = useState(null); // Store incubation ID being deleted

  // Function to filter incubations based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredIncubations(incubations);
    } else {
      const filtered = incubations.filter(
        (incubation) =>
          incubation.incubationsname
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          incubation.incubationshortname
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredIncubations(filtered);
    }
  }, [searchQuery, incubations]);

  // Function to handle sorting
  const handleSort = (column) => {
    // If clicking the same column, toggle direction
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new column, set it and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort the filtered incubations based on the current sort column and direction
  const sortedIncubations = useMemo(() => {
    if (!filteredIncubations.length) return [];

    return [...filteredIncubations].sort((a, b) => {
      let aValue, bValue;

      // Get the values to compare based on the column
      switch (sortColumn) {
        case "sno":
          aValue = filteredIncubations.indexOf(a);
          bValue = filteredIncubations.indexOf(b);
          break;
        case "incubationsname":
          aValue = a.incubationsname || "";
          bValue = b.incubationsname || "";
          break;
        case "incubationshortname":
          aValue = a.incubationshortname || "";
          bValue = b.incubationshortname || "";
          break;
        case "incubationsemail":
          aValue = a.incubationsemail || "";
          bValue = b.incubationsemail || "";
          break;
        case "incubationswebsite":
          aValue = a.incubationswebsite || "";
          bValue = b.incubationswebsite || "";
          break;
        case "incubationscreatedtime":
          aValue = a.incubationscreatedtime
            ? new Date(a.incubationscreatedtime)
            : new Date(0);
          bValue = b.incubationscreatedtime
            ? new Date(b.incubationscreatedtime)
            : new Date(0);
          break;
        case "incubationsmodifiedtime":
          aValue = a.incubationsmodifiedtime
            ? new Date(a.incubationsmodifiedtime)
            : new Date(0);
          bValue = b.incubationsmodifiedtime
            ? new Date(b.incubationsmodifiedtime)
            : new Date(0);
          break;
        default:
          return 0;
      }

      // Compare the values
      if (typeof aValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        // For numbers and dates
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });
  }, [filteredIncubations, sortColumn, sortDirection]);

  // Function to get the appropriate sort icon for a column
  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <FaSort className="sort-icon" />;
    }
    return sortDirection === "asc" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  // ✅ Fetch all incubations
  const fetchIncubations = () => {
    setLoading(true);
    setError(null);
    fetch(`${IP}/itelinc/resources/generic/getincubationdetails`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || 1,
        userIncId: incUserid || 0,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setIncubations(data.data || []);
          setFilteredIncubations(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch incubations");
        }
      })
      .catch((err) => {
        console.error("Error fetching incubations:", err);
        setError("Failed to load incubations. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // ✅ Delete incubation
  const handleDelete = (incubation) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${incubation.incubationsname}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(incubation.incubationsrecid);
        const deleteUrl = `${IP}/itelinc/deleteIncubation?incubationsmodifiedby=${
          userId || "system"
        }&incubationsrecid=${incubation.incubationsrecid}`;

        fetch(deleteUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "Deleted!",
                `${incubation.incubationsname} has been deleted successfully.`,
                "success"
              );
              fetchIncubations(); // Refresh the incubation list
            } else {
              throw new Error(data.message || "Failed to delete incubation");
            }
          })
          .catch((err) => {
            console.error("Error deleting incubation:", err);
            Swal.fire(
              "Error",
              `Failed to delete ${incubation.incubationsname}: ${err.message}`,
              "error"
            );
          })
          .finally(() => {
            setIsDeleting(null);
          });
      }
    });
  };

  // ✅ Add new incubation
  const handleAddIncubation = () => {
    Swal.fire({
      title: "Add New Incubation",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Incubation Name" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-shortname" class="swal2-input" placeholder="Short Name" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email">
          </div>
          <div class="swal-form-row">
            <input id="swal-website" class="swal2-input" placeholder="Website">
          </div>
          <div class="swal-form-row">
            <input id="swal-address" class="swal2-input" placeholder="Address">
          </div>
          <div class="swal-form-row">
            <input id="swal-founders" class="swal2-input" placeholder="Founders (comma separated)">
          </div>
          <div class="swal-form-row">
            <input id="swal-nooffounders" type="number" class="swal2-input" placeholder="Number of Founders">
          </div>
        </div>
      `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById("swal-name");
        const shortname = document.getElementById("swal-shortname");
        const email = document.getElementById("swal-email");
        const website = document.getElementById("swal-website");
        const address = document.getElementById("swal-address");
        const founders = document.getElementById("swal-founders");
        const nooffounders = document.getElementById("swal-nooffounders");

        if (
          !name ||
          !shortname ||
          !email ||
          !website ||
          !address ||
          !founders ||
          !nooffounders
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        if (!name.value || !shortname.value) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        return {
          incubationsname: name.value,
          incubationshortname: shortname.value,
          incubationsemail: email.value,
          incubationswebsite: website.value,
          incubationsaddress: address.value,
          incubationsfounders: founders.value,
          incubationsnooffounders: nooffounders.value || null,
        };
      },
      didOpen: () => {
        // Add custom CSS for better styling
        const style = document.createElement("style");
        style.textContent = `
          .swal-form-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .swal-form-row {
            width: 100%;
          }
          .swal2-input, .swal2-select {
            width: 100% !important;
            margin: 0 !important;
          }
          .swal2-select {
            padding: 0.75em !important;
          }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsAdding(true);

        // Build URL with query parameters for adding incubation
        const params = new URLSearchParams();
        params.append("incubationsname", formData.incubationsname);
        params.append("incubationshortname", formData.incubationshortname);
        params.append("incubationsemail", formData.incubationsemail);
        params.append("incubationswebsite", formData.incubationswebsite);
        params.append("incubationsaddress", formData.incubationsaddress);
        params.append("incubationsfounders", formData.incubationsfounders);
        params.append(
          "incubationsnooffounders",
          formData.incubationsnooffounders
        );
        params.append("incubationslogopath", ""); // Empty logopath for new incubation
        params.append("incubationsadminstate", "1");
        params.append("incubationscreatedby", userId || "1");
        params.append("incubationsmodifiedby", userId || "1");

        const addUrl = `${IP}/itelinc/addIncubation?${params.toString()}`;

        // Prepare the request body with userId and userIncId from session
        const requestBody = {
          userId: parseInt(userId) || 1,
          userIncId: parseInt(incUserid) || 0,
        };

        fetch(addUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "✅ Success",
                "Incubation added successfully",
                "success"
              );
              fetchIncubations();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to add incubation",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error adding incubation:", err);
            if (
              err.name === "TypeError" &&
              err.message.includes("Failed to fetch")
            ) {
              Swal.fire(
                "❌ CORS Error",
                "Unable to connect to the server. This might be a CORS issue. Please contact your system administrator.",
                "error"
              );
            } else {
              Swal.fire(
                "❌ Error",
                err.message || "Something went wrong",
                "error"
              );
            }
          })
          .finally(() => {
            setIsAdding(false);
          });
      }
    });
  };

  // ✅ Edit incubation with popup form
  const handleEdit = (incubation) => {
    Swal.fire({
      title: "Edit Incubation",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Incubation Name" value="${
              incubation.incubationsname || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-shortname" class="swal2-input" placeholder="Short Name" value="${
              incubation.incubationshortname || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email" value="${
              incubation.incubationsemail || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-website" class="swal2-input" placeholder="Website" value="${
              incubation.incubationswebsite || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-address" class="swal2-input" placeholder="Address" value="${
              incubation.incubationsaddress || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-founders" class="swal2-input" placeholder="Founders (comma separated)" value="${
              incubation.incubationsfounders || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-nooffounders" type="number" class="swal2-input" placeholder="Number of Founders" value="${
              incubation.incubationsnooffounders || ""
            }">
          </div>
        </div>
      `,
      width: "600px", // Make the popup wider
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        // Get all form values
        const name = document.getElementById("swal-name");
        const shortname = document.getElementById("swal-shortname");
        const email = document.getElementById("swal-email");
        const website = document.getElementById("swal-website");
        const address = document.getElementById("swal-address");
        const founders = document.getElementById("swal-founders");
        const nooffounders = document.getElementById("swal-nooffounders");

        // Validate that all elements exist
        if (
          !name ||
          !shortname ||
          !email ||
          !website ||
          !address ||
          !founders ||
          !nooffounders
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        return {
          incubationsname: name.value,
          incubationshortname: shortname.value,
          incubationsemail: email.value,
          incubationswebsite: website.value,
          incubationsaddress: address.value,
          incubationsfounders: founders.value,
          incubationsnooffounders: nooffounders.value || null,
        };
      },
      didOpen: () => {
        // Add custom CSS for better styling
        const style = document.createElement("style");
        style.textContent = `
          .swal-form-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .swal-form-row {
            width: 100%;
          }
          .swal2-input, .swal2-select {
            width: 100% !important;
            margin: 0 !important;
          }
          .swal2-select {
            padding: 0.75em !important;
          }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsUpdating(incubation.incubationsrecid);

        // ✅ Build URL with query parameters as specified
        const params = new URLSearchParams();
        params.append("incubationsrecid", incubation.incubationsrecid);
        params.append("incubationsname", formData.incubationsname);
        params.append("incubationshortname", formData.incubationshortname);
        params.append("incubationsaddress", formData.incubationsaddress);
        params.append(
          "incubationslogopath",
          incubation.incubationslogopath || ""
        ); // Use existing logopath value
        params.append("incubationswebsite", formData.incubationswebsite);
        params.append("incubationsfounders", formData.incubationsfounders);
        params.append("incubationsemail", formData.incubationsemail);
        params.append(
          "incubationsnooffounders",
          formData.incubationsnooffounders
        );
        params.append("incubationsmodifiedby", userId || "1");
        params.append("incubationsadminstate", "1");

        const updateUrl = `${IP}/itelinc/updateIncubation?${params.toString()}`;

        // Prepare the request body with userId and userIncId from session
        const requestBody = {
          userId: parseInt(userId) || 1,
          userIncId: parseInt(incUserid) || 0,
        };

        fetch(updateUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "✅ Success",
                "Incubation updated successfully",
                "success"
              );
              fetchIncubations();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to update incubation",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error updating incubation:", err);
            if (
              err.name === "TypeError" &&
              err.message.includes("Failed to fetch")
            ) {
              Swal.fire(
                "❌ CORS Error",
                "Unable to connect to the server. This might be a CORS issue. Please contact your system administrator.",
                "error"
              );
            } else {
              Swal.fire("❌ Error", "Something went wrong", "error");
            }
          })
          .finally(() => {
            setIsUpdating(null);
          });
      }
    });
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Fetch incubations on component mount
  useEffect(() => {
    fetchIncubations();
  }, []);

  return (
    <div className="doccat-container">
      <div className="doccat-header">
        <h2 className="doccat-title">🏢 Incubations</h2>
        <div className="header-actions">
          <div className="search-container">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or short name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={clearSearch}>
                  ×
                </button>
              )}
            </div>
          </div>
          <button
            className="btn-add-user"
            onClick={handleAddIncubation}
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <FaSpinner className="spinner" size={16} /> Adding...
              </>
            ) : (
              <>
                <FaPlus size={16} /> Add Incubation
              </>
            )}
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <p className="doccat-empty">Loading incubations...</p>
      ) : (
        <div className="doccat-table-wrapper">
          <table className="doccat-table">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("sno")}
                >
                  S.No {getSortIcon("sno")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("incubationsname")}
                >
                  Name {getSortIcon("incubationsname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("incubationshortname")}
                >
                  Short Name {getSortIcon("incubationshortname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("incubationsemail")}
                >
                  Email {getSortIcon("incubationsemail")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("incubationswebsite")}
                >
                  Website {getSortIcon("incubationswebsite")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("incubationscreatedtime")}
                >
                  Created Time {getSortIcon("incubationscreatedtime")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("incubationsmodifiedtime")}
                >
                  Modified Time {getSortIcon("incubationsmodifiedtime")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedIncubations.length > 0 ? (
                sortedIncubations.map((incubation, idx) => (
                  <tr key={incubation.incubationsrecid || idx}>
                    <td>{incubations.indexOf(incubation) + 1}</td>
                    <td>{incubation.incubationsname}</td>
                    <td>{incubation.incubationshortname}</td>
                    <td>{incubation.incubationsemail}</td>
                    <td>
                      {incubation.incubationswebsite && (
                        <a
                          href={incubation.incubationswebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {incubation.incubationswebsite}
                        </a>
                      )}
                    </td>
                    <td>
                      {incubation.incubationscreatedtime?.replace("T", " ")}
                    </td>
                    <td>
                      {incubation.incubationsmodifiedtime?.replace("T", " ")}
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(incubation)}
                        disabled={
                          isUpdating === incubation.incubationsrecid ||
                          isDeleting === incubation.incubationsrecid
                        }
                      >
                        {isUpdating === incubation.incubationsrecid ? (
                          <FaSpinner className="spinner" size={18} />
                        ) : (
                          <FaEdit size={18} />
                        )}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(incubation)}
                        disabled={
                          isDeleting === incubation.incubationsrecid ||
                          isUpdating === incubation.incubationsrecid
                        }
                      >
                        {isDeleting === incubation.incubationsrecid ? (
                          <FaSpinner className="spinner" size={18} />
                        ) : (
                          <FaTrash size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="doccat-empty">
                    {searchQuery
                      ? "No incubations found matching your search"
                      : "No incubations found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading overlay for operations */}
      {(isAdding || isUpdating !== null || isDeleting !== null) && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <FaSpinner className="spinner" size={40} />
            <p>
              {isAdding
                ? "Adding incubation..."
                : isUpdating !== null
                ? "Updating incubation..."
                : "Deleting incubation..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
