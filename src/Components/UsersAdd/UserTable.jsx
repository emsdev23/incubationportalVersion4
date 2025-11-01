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
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./UserTable.css";
import { IPAdress } from "../Datafetching/IPAdrees";

export default function UserTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const roleId = sessionStorage.getItem("roleid");
  const IP = IPAdress;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [incubatees, setIncubatees] = useState([]);
  const [incubations, setIncubations] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIncubation, setSelectedIncubation] = useState(null);

  // Sorting states
  const [sortColumn, setSortColumn] = useState("sno");
  const [sortDirection, setSortDirection] = useState("asc");

  // Loading states for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Define the role IDs that are allowed to select an incubatee
  const INCUBATEE_ROLE_IDS = [4, 5, 6];
  const rolebaseincuserid = roleId === "0" ? 1 : incUserid;

  // Check if current user can select incubation (only when roleId is 0)
  const canSelectIncubation = roleId === "0";

  // Check if incubatee dropdown should be enabled
  const isIncubateeEnabled = selectedIncubation !== null;

  // Function to map role ID to the correct role name
  const getRoleName = (roleId) => {
    const roleMap = {
      1: "Incubator admin",
      2: "Incubator manager",
      3: "Incubator operator",
      4: "Incubatee admin",
      5: "Incubatee manager",
      6: "Incubatee operator",
      7: "DDI admin",
      8: "DDI manager",
    };
    return roleMap[roleId] || "Unknown Role";
  };

  // Function to filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.usersname.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

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

  // Sort the filtered users based on the current sort column and direction
  const sortedUsers = useMemo(() => {
    if (!filteredUsers.length) return [];

    return [...filteredUsers].sort((a, b) => {
      let aValue, bValue;

      // Get the values to compare based on the column
      switch (sortColumn) {
        case "sno":
          aValue = filteredUsers.indexOf(a);
          bValue = filteredUsers.indexOf(b);
          break;
        case "usersname":
          aValue = a.usersname || "";
          bValue = b.usersname || "";
          break;
        case "usersemail":
          aValue = a.usersemail || "";
          bValue = b.usersemail || "";
          break;
        case "usersrolesrecid":
          aValue = getRoleName(a.usersrolesrecid);
          bValue = getRoleName(b.usersrolesrecid);
          break;
        case "userscreatedtime":
          aValue = a.userscreatedtime
            ? new Date(a.userscreatedtime)
            : new Date(0);
          bValue = b.userscreatedtime
            ? new Date(b.userscreatedtime)
            : new Date(0);
          break;
        case "usersmodifiedtime":
          aValue = a.usersmodifiedtime
            ? new Date(a.usersmodifiedtime)
            : new Date(0);
          bValue = b.usersmodifiedtime
            ? new Date(b.usersmodifiedtime)
            : new Date(0);
          break;
        case "userscreatedby":
          aValue = a.userscreatedby || "";
          bValue = b.userscreatedby || "";
          break;
        case "usersmodifiedby":
          aValue = a.usersmodifiedby || "";
          bValue = b.usersmodifiedby || "";
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
  }, [filteredUsers, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortColumn, sortDirection]);

  // Pagination helper
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

  // Fetch all users
  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    fetch(`${IP}/itelinc/resources/generic/getusers`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
        userIncId: selectedIncubation
          ? selectedIncubation.incubationsrecid
          : incUserid,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setUsers(data.data || []);
          setFilteredUsers(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch users");
        }
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // Fetch roles for dropdown
  const fetchRoles = () => {
    return fetch(`${IP}/itelinc/resources/generic/getrolelist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
        incUserId: selectedIncubation
          ? selectedIncubation.incubationsrecid
          : incUserid,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          // Map the roles to ensure correct display names
          const mappedRoles = (data.data || []).map((role) => ({
            ...role,
            text: getRoleName(role.value),
          }));
          setRoles(mappedRoles);
          return mappedRoles;
        } else {
          throw new Error(data.message || "Failed to fetch roles");
        }
      })
      .catch((err) => {
        console.error("Error fetching roles:", err);
        Swal.fire("❌ Error", "Failed to load roles", "error");
        return [];
      });
  };

  // Fetch incubatees for dropdown
  const fetchIncubatees = (incubationId = null) => {
    // Use the provided incubationId or the selectedIncubation
    const targetIncubationId =
      incubationId ||
      (selectedIncubation ? selectedIncubation.incubationsrecid : incUserid);

    return fetch(`${IP}/itelinc/resources/generic/getinclist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
        incUserId: targetIncubationId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setIncubatees(data.data || []);
          return data.data || [];
        } else {
          throw new Error(data.message || "Failed to fetch incubatees");
        }
      })
      .catch((err) => {
        console.error("Error fetching incubatees:", err);
        Swal.fire("❌ Error", "Failed to load incubatees", "error");
        return [];
      });
  };

  // Fetch incubations for dropdown (only if roleId is 0)
  const fetchIncubations = () => {
    if (!canSelectIncubation) {
      // If roleId is not 0, we don't need to fetch incubations
      return Promise.resolve([]);
    }

    return fetch(`${IP}/itelinc/resources/generic/getincubationlist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
        userIncId: "ALL", // Use "ALL" to get all incubations
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setIncubations(data.data || []);
          return data.data || [];
        } else {
          throw new Error(data.message || "Failed to fetch incubations");
        }
      })
      .catch((err) => {
        console.error("Error fetching incubations:", err);
        Swal.fire("❌ Error", "Failed to load incubations", "error");
        return [];
      });
  };

  // Fetch all required data
  useEffect(() => {
    fetchUsers();
    // Load dropdown data on component mount
    setDropdownsLoading(true);
    Promise.all([fetchRoles(), fetchIncubatees(), fetchIncubations()])
      .then(() => setDropdownsLoading(false))
      .catch(() => setDropdownsLoading(false));
  }, []);

  // Refetch data when selectedIncubation changes
  useEffect(() => {
    // Fetch users and roles when selectedIncubation changes
    fetchUsers();
    fetchRoles();

    // Fetch incubatees only when an incubation is selected
    if (selectedIncubation) {
      setDropdownsLoading(true);
      fetchIncubatees()
        .then(() => setDropdownsLoading(false))
        .catch(() => setDropdownsLoading(false));
    } else {
      // Clear incubatees when no incubation is selected
      setIncubatees([]);
    }
  }, [selectedIncubation]);

  // Delete user
  const handleDelete = (user) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${user.usersname}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(user.usersrecid);
        const deleteUrl = `${IP}/itelinc/deleteUser?usersmodifiedby=${
          userId || "system"
        }&usersrecid=${user.usersrecid}`;

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
                `${user.usersname} has been deleted successfully.`,
                "success"
              );
              fetchUsers(); // Refresh the user list
            } else {
              throw new Error(data.message || "Failed to delete user");
            }
          })
          .catch((err) => {
            console.error("Error deleting user:", err);
            Swal.fire(
              "Error",
              `Failed to delete ${user.usersname}: ${err.message}`,
              "error"
            );
          })
          .finally(() => {
            setIsDeleting(null);
          });
      }
    });
  };

  // Add new user
  const handleAddUser = async () => {
    // Check if dropdown data is loaded, if not, wait for it
    if (
      dropdownsLoading ||
      roles.length === 0 ||
      (canSelectIncubation && incubations.length === 0)
    ) {
      Swal.fire({
        title: "Loading...",
        text: "Please wait while we load the required data",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      try {
        await Promise.all([
          fetchRoles(),
          fetchIncubatees(),
          fetchIncubations(),
        ]);
        setDropdownsLoading(false);
        Swal.close();
      } catch (error) {
        Swal.close();
        Swal.fire("❌ Error", "Failed to load dropdown data", "error");
        return;
      }
    }

    // Create role dropdown HTML with mapped role names
    const roleOptions = roles
      .map((role) => `<option value="${role.value}">${role.text}</option>`)
      .join("");

    // Create incubation dropdown HTML with "Select incubation" as placeholder (only if roleId is 0)
    const incubationOptions = canSelectIncubation
      ? [
          `<option value="" disabled selected>Select incubation</option>`,
          ...incubations.map(
            (incubation) =>
              `<option value="${incubation.incubationsrecid}">${incubation.incubationshortname}</option>`
          ),
        ].join("")
      : "";

    // Create incubatee dropdown HTML with "Select incubatee" as placeholder
    const incubateeOptions = [
      `<option value="" disabled selected>Select incubatee</option>`,
      ...incubatees.map(
        (incubatee) =>
          `<option value="${incubatee.incubateesrecid}">${incubatee.incubateesname}</option>`
      ),
    ].join("");

    Swal.fire({
      title: "Add New User",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Name" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email" required>
          </div>
          <div class="swal-form-row">
            <input id="swal-password" type="password" class="swal2-input" placeholder="Password" required>
          </div>
          <div class="swal-form-row">
            <select id="swal-role" class="swal2-select" required>
              <option value="" disabled selected>Select a role</option>
              ${roleOptions}
            </select>
          </div>
          ${
            canSelectIncubation
              ? `
          <div class="swal-form-row">
            <select id="swal-incubation" class="swal2-select" required>
              ${incubationOptions}
            </select>
          </div>
          `
              : ""
          }
          <div class="swal-form-row">
            <select id="swal-incubatee" class="swal2-select" disabled>
              ${incubateeOptions}
            </select>
          </div>
        </div>
      `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = document.getElementById("swal-name");
        const email = document.getElementById("swal-email");
        const password = document.getElementById("swal-password");
        const role = document.getElementById("swal-role");
        const incubation = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;
        const incubatee = document.getElementById("swal-incubatee");

        if (
          !name ||
          !email ||
          !password ||
          !role ||
          !incubatee ||
          (canSelectIncubation && !incubation)
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        if (
          !name.value ||
          !email.value ||
          !password.value ||
          !role.value ||
          (canSelectIncubation && !incubation.value)
        ) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        return {
          usersname: name.value,
          usersemail: email.value,
          userspassword: password.value,
          usersrolesrecid: role.value,
          usersincubationsrecid: canSelectIncubation
            ? incubation.value
            : selectedIncubation
            ? selectedIncubation.incubationsrecid
            : incUserid,
          usersincubateesrecid: incubatee.value || null,
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
          select:disabled {
            background-color: #f8f9fa;
            cursor: not-allowed;
            opacity: 0.8;
          }
        `;
        document.head.appendChild(style);

        // Get form elements
        const roleSelect = document.getElementById("swal-role");
        const incubateeSelect = document.getElementById("swal-incubatee");
        const incubationSelect = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;

        // Function to update incubatee dropdown options
        const updateIncubateeOptions = (incubationId) => {
          if (!incubationId) {
            incubateeSelect.innerHTML =
              '<option value="" disabled selected>Select incubatee</option>';
            return;
          }

          // Show loading state
          incubateeSelect.innerHTML =
            '<option value="" disabled>Loading incubatees...</option>';
          incubateeSelect.disabled = true;

          // Fetch incubatees for the selected incubation
          fetch(`${IP}/itelinc/resources/generic/getinclist`, {
            method: "POST",
            mode: "cors",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId || null,
              incUserId: incubationId,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.statusCode === 200) {
                const incubateeOptions = [
                  '<option value="" disabled selected>Select incubatee</option>',
                  ...(data.data || []).map(
                    (incubatee) =>
                      `<option value="${incubatee.incubateesrecid}">${incubatee.incubateesname}</option>`
                  ),
                ].join("");
                incubateeSelect.innerHTML = incubateeOptions;
              } else {
                incubateeSelect.innerHTML =
                  '<option value="" disabled>No incubatees found</option>';
              }
            })
            .catch((err) => {
              console.error("Error fetching incubatees:", err);
              incubateeSelect.innerHTML =
                '<option value="" disabled>Error loading incubatees</option>';
            });
        };

        const toggleIncubateeDropdown = () => {
          const selectedRole = parseInt(roleSelect.value);

          // For users with roleId === 0, check if incubation is selected
          // For other users, just check if the role allows selecting an incubatee
          const shouldEnableIncubatee = canSelectIncubation
            ? incubationSelect && incubationSelect.value !== ""
            : INCUBATEE_ROLE_IDS.includes(selectedRole);

          if (shouldEnableIncubatee) {
            // Update incubatee options based on selected incubation
            if (canSelectIncubation && incubationSelect) {
              updateIncubateeOptions(incubationSelect.value);
            } else {
              // For non-admin users, use their incUserid
              updateIncubateeOptions(incUserid);
            }
            incubateeSelect.disabled = false;
          } else {
            incubateeSelect.disabled = true;
            incubateeSelect.value = ""; // Reset selection when disabled
          }
        };

        // Add event listeners
        roleSelect.addEventListener("change", toggleIncubateeDropdown);

        // Add event listener to incubation dropdown if it exists
        if (incubationSelect) {
          incubationSelect.addEventListener("change", () => {
            const selectedRole = parseInt(roleSelect.value);
            if (INCUBATEE_ROLE_IDS.includes(selectedRole)) {
              updateIncubateeOptions(incubationSelect.value);
              incubateeSelect.disabled = false;
            }
          });
        }

        // Initial check
        toggleIncubateeDropdown();
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsAdding(true);

        // Build URL with query parameters for adding user
        const params = new URLSearchParams();
        params.append("usersemail", formData.usersemail);
        params.append("userspassword", formData.userspassword);
        params.append("usersname", formData.usersname);
        params.append("usersrolesrecid", formData.usersrolesrecid);
        params.append("usersadminstate", "1");
        params.append("userscreatedby", userId || "system");
        params.append("usersmodifiedby", userId || "system");
        params.append("usersincubationsrecid", formData.usersincubationsrecid);

        // Only add incubateesrecid if it's not null or empty
        if (formData.usersincubateesrecid) {
          params.append("usersincubateesrecid", formData.usersincubateesrecid);
        }

        const addUrl = `${IP}/itelinc/addUser?${params.toString()}`;
        fetch(addUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire("✅ Success", "User added successfully", "success");
              fetchUsers();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to add user",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error adding user:", err);
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

  // Edit user with popup form
  const handleEdit = async (user) => {
    // Check if dropdown data is loaded, if not, wait for it
    if (
      dropdownsLoading ||
      roles.length === 0 ||
      incubatees.length === 0 ||
      (canSelectIncubation && incubations.length === 0)
    ) {
      Swal.fire({
        title: "Loading...",
        text: "Please wait while we load the required data",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      try {
        await Promise.all([
          fetchRoles(),
          fetchIncubatees(),
          fetchIncubations(),
        ]);
        setDropdownsLoading(false);
        Swal.close();
      } catch (error) {
        Swal.close();
        Swal.fire("❌ Error", "Failed to load dropdown data", "error");
        return;
      }
    }

    // Create role dropdown HTML with mapped role names
    const roleOptions = roles
      .map(
        (role) =>
          `<option value="${role.value}" ${
            user.usersrolesrecid == role.value ? "selected" : ""
          }>${role.text}</option>`
      )
      .join("");

    // Create incubation dropdown HTML with "Select incubation" as placeholder (only if roleId is 0)
    const incubationOptions = canSelectIncubation
      ? [
          `<option value="" ${
            !user.usersincubationsrecid ? "selected" : ""
          }>Select incubation</option>`,
          ...incubations.map(
            (incubation) =>
              `<option value="${incubation.incubationsrecid}" ${
                user.usersincubationsrecid == incubation.incubationsrecid
                  ? "selected"
                  : ""
              }>${incubation.incubationshortname}</option>`
          ),
        ].join("")
      : "";

    // Create incubatee dropdown HTML with "Select incubatee" as placeholder
    const incubateeOptions = [
      `<option value="" ${
        !user.usersincubateesrecid ? "selected" : ""
      }>Select incubatee</option>`,
      ...incubatees.map(
        (incubatee) =>
          `<option value="${incubatee.incubateesrecid}" ${
            user.usersincubateesrecid == incubatee.incubateesrecid
              ? "selected"
              : ""
          }>${incubatee.incubateesname}</option>`
      ),
    ].join("");

    Swal.fire({
      title: "Edit User",
      html: `
        <div class="swal-form-container">
          <div class="swal-form-row">
            <input id="swal-name" class="swal2-input" placeholder="Name" value="${
              user.usersname || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-email" class="swal2-input" placeholder="Email" value="${
              user.usersemail || ""
            }">
          </div>
          <div class="swal-form-row">
            <input id="swal-password" type="password" class="swal2-input" placeholder="Password" value="${
              user.userspassword || ""
            }" readonly>
          </div>
          <div class="swal-form-row">
            <select id="swal-role" class="swal2-select">
              ${roleOptions}
            </select>
          </div>
          ${
            canSelectIncubation
              ? `
          <div class="swal-form-row">
            <select id="swal-incubation" class="swal2-select">
              ${incubationOptions}
            </select>
          </div>
          `
              : ""
          }
          <div class="swal-form-row">
            <select id="swal-incubatee" class="swal2-select" ${
              !INCUBATEE_ROLE_IDS.includes(parseInt(user.usersrolesrecid))
                ? "disabled"
                : ""
            }>
              ${incubateeOptions}
            </select>
          </div>
        </div>
      `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        // Get all form values
        const name = document.getElementById("swal-name");
        const email = document.getElementById("swal-email");
        const password = document.getElementById("swal-password");
        const role = document.getElementById("swal-role");
        const incubation = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;
        const incubatee = document.getElementById("swal-incubatee");

        // Validate that all elements exist
        if (
          !name ||
          !email ||
          !password ||
          !role ||
          !incubatee ||
          (canSelectIncubation && !incubation)
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        return {
          usersname: name.value,
          usersemail: email.value,
          userspassword: password.value,
          usersrolesrecid: role.value,
          usersincubationsrecid: canSelectIncubation
            ? incubation.value
            : selectedIncubation
            ? selectedIncubation.incubationsrecid
            : incUserid,
          usersincubateesrecid: incubatee.value || null,
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
          input[readonly] {
            background-color: #f8f9fa;
            cursor: not-allowed;
            opacity: 0.8;
          }
          select:disabled {
            background-color: #f8f9fa;
            cursor: not-allowed;
            opacity: 0.8;
          }
        `;
        document.head.appendChild(style);

        // Get form elements
        const roleSelect = document.getElementById("swal-role");
        const incubateeSelect = document.getElementById("swal-incubatee");
        const incubationSelect = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;

        // Function to update incubatee dropdown options
        const updateIncubateeOptions = (incubationId) => {
          if (!incubationId) {
            incubateeSelect.innerHTML =
              '<option value="" disabled selected>Select incubatee</option>';
            return;
          }

          // Show loading state
          incubateeSelect.innerHTML =
            '<option value="" disabled>Loading incubatees...</option>';
          incubateeSelect.disabled = true;

          // Fetch incubatees for the selected incubation
          fetch(`${IP}/itelinc/resources/generic/getinclist`, {
            method: "POST",
            mode: "cors",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId || null,
              incUserId: incubationId,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.statusCode === 200) {
                const incubateeOptions = [
                  '<option value="" disabled selected>Select incubatee</option>',
                  ...(data.data || []).map(
                    (incubatee) =>
                      `<option value="${incubatee.incubateesrecid}">${incubatee.incubateesname}</option>`
                  ),
                ].join("");
                incubateeSelect.innerHTML = incubateeOptions;
              } else {
                incubateeSelect.innerHTML =
                  '<option value="" disabled>No incubatees found</option>';
              }
            })
            .catch((err) => {
              console.error("Error fetching incubatees:", err);
              incubateeSelect.innerHTML =
                '<option value="" disabled>Error loading incubatees</option>';
            });
        };

        const toggleIncubateeDropdown = () => {
          const selectedRole = parseInt(roleSelect.value);

          // For users with roleId === 0, check if incubation is selected
          // For other users, just check if the role allows selecting an incubatee
          const shouldEnableIncubatee = canSelectIncubation
            ? incubationSelect && incubationSelect.value !== ""
            : INCUBATEE_ROLE_IDS.includes(selectedRole);

          if (shouldEnableIncubatee) {
            // Update incubatee options based on selected incubation
            if (canSelectIncubation && incubationSelect) {
              updateIncubateeOptions(incubationSelect.value);
            } else {
              // For non-admin users, use their incUserid
              updateIncubateeOptions(incUserid);
            }
            incubateeSelect.disabled = false;
          } else {
            incubateeSelect.disabled = true;
            incubateeSelect.value = ""; // Reset selection when disabled
          }
        };

        // Add event listeners
        roleSelect.addEventListener("change", toggleIncubateeDropdown);

        // Add event listener to incubation dropdown if it exists
        if (incubationSelect) {
          incubationSelect.addEventListener("change", () => {
            const selectedRole = parseInt(roleSelect.value);
            if (INCUBATEE_ROLE_IDS.includes(selectedRole)) {
              updateIncubateeOptions(incubationSelect.value);
              incubateeSelect.disabled = false;
            }
          });
        }

        // Initial check
        toggleIncubateeDropdown();
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const formData = result.value;
        setIsUpdating(user.usersrecid);

        // Build URL with query parameters
        const params = new URLSearchParams();
        params.append("usersemail", formData.usersemail);
        params.append("usersname", formData.usersname);
        params.append("usersrolesrecid", formData.usersrolesrecid);
        params.append("userspassword", formData.userspassword);
        params.append("usersadminstate", "1");
        params.append("usersmodifiedby", userId);
        params.append("usersrecid", user.usersrecid);
        params.append("usersincubationsrecid", formData.usersincubationsrecid);

        // Only add incubateesrecid if it's not null or empty
        if (formData.usersincubateesrecid) {
          params.append("usersincubateesrecid", formData.usersincubateesrecid);
        }

        const updateUrl = `${IP}/itelinc/updateUser?${params.toString()}`;
        fetch(updateUrl, {
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
              Swal.fire("✅ Success", "User updated successfully", "success");
              fetchUsers();
            } else {
              Swal.fire(
                "❌ Error",
                data.message || "Failed to update user",
                "error"
              );
            }
          })
          .catch((err) => {
            console.error("Error updating user:", err);
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

  // Function to check if delete should be disabled for a user
  const shouldDisableDelete = (user) => {
    return user.usersrolesrecid === 4 || user.usersrolesrecid === 1;
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Function to handle incubation selection
  const handleIncubationSelect = (incubation) => {
    setSelectedIncubation(incubation);
  };

  return (
    <div className="doccat-container">
      <div className="doccat-header">
        <h2 className="doccat-title">👤 Users</h2>
        <div className="header-actions">
          <div className="search-container">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name..."
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
            onClick={handleAddUser}
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <FaSpinner className="spinner" size={16} /> Adding...
              </>
            ) : (
              <>
                <FaPlus size={16} /> Add User
              </>
            )}
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <p className="doccat-empty">Loading users...</p>
      ) : (
        <>
          <div className="table-info">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedUsers.length)}{" "}
            of {sortedUsers.length} entries
          </div>
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
                    onClick={() => handleSort("usersname")}
                  >
                    Name {getSortIcon("usersname")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("usersemail")}
                  >
                    Email {getSortIcon("usersemail")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("usersrolesrecid")}
                  >
                    Role Name {getSortIcon("usersrolesrecid")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("userscreatedtime")}
                  >
                    Created Time {getSortIcon("userscreatedtime")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("usersmodifiedtime")}
                  >
                    Modified Time {getSortIcon("usersmodifiedtime")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("userscreatedby")}
                  >
                    Created By {getSortIcon("userscreatedby")}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("usersmodifiedby")}
                  >
                    Modified By {getSortIcon("usersmodifiedby")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((user, idx) => (
                    <tr key={user.usersrecid || idx}>
                      <td>{sortedUsers.indexOf(user) + 1}</td>
                      <td>{user.usersname}</td>
                      <td>{user.usersemail}</td>
                      <td>{getRoleName(user.usersrolesrecid)}</td>
                      <td>{user.userscreatedtime?.replace("T", " ")}</td>
                      <td>{user.usersmodifiedtime?.replace("T", " ")}</td>
                      <td>{user.userscreatedby}</td>
                      <td>{user.usersmodifiedby}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(user)}
                          disabled={
                            isUpdating === user.usersrecid ||
                            isDeleting === user.usersrecid
                          }
                        >
                          {isUpdating === user.usersrecid ? (
                            <FaSpinner className="spinner" size={18} />
                          ) : (
                            <FaEdit size={18} />
                          )}
                        </button>
                        <button
                          className={`btn-delete ${
                            shouldDisableDelete(user) ? "disabled" : ""
                          }`}
                          onClick={() => handleDelete(user)}
                          disabled={
                            isDeleting === user.usersrecid ||
                            isUpdating === user.usersrecid ||
                            shouldDisableDelete(user)
                          }
                          title={
                            shouldDisableDelete(user)
                              ? "Cannot delete users with role ID 1 or 4"
                              : ""
                          }
                        >
                          {isDeleting === user.usersrecid ? (
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
                    <td colSpan="9" className="doccat-empty">
                      {searchQuery
                        ? "No users found matching your search"
                        : "No users found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                <select
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleItemsPerPageChange(Number(e.target.value))
                  }
                  className="items-per-page-select"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
              <div className="pagination">
                <button
                  className={`pagination-btn ${
                    currentPage === 1 ? "disabled" : ""
                  }`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft />
                </button>

                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === "..." ? (
                      <span className="pagination-ellipsis">...</span>
                    ) : (
                      <button
                        className={`pagination-btn page-number ${
                          currentPage === page ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}

                <button
                  className={`pagination-btn ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading overlay for operations */}
      {(isAdding || isUpdating !== null || isDeleting !== null) && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <FaSpinner className="spinner" size={40} />
            <p>
              {isAdding
                ? "Adding user..."
                : isUpdating !== null
                ? "Updating user..."
                : "Deleting user..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
