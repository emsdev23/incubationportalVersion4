import React, { createContext, useState, useEffect } from "react";
import api from "./api";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [stats, setStats] = useState(null);
  const [byField, setByField] = useState([]);
  const [byStage, setByStage] = useState([]);
  const [companyDoc, setCompanyDoc] = useState([]);
  const [listOfIncubatees, setListOfIncubatees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startupcompanyDoc, setstartupcompanyDoc] = useState([]);
  const [startupdetails, setstartupdetails] = useState([]);
  const [currentCompanyDetails, setCurrentCompanyDetails] = useState(null);

  // Add new state for admin viewing specific startup
  const [adminViewingStartupId, setAdminViewingStartupId] = useState(null);
  const [adminStartupLoading, setAdminStartupLoading] = useState(false);

  // Initialize state from sessionStorage
  const [userid, setUseridState] = useState(
    sessionStorage.getItem("userid") || null
  );

  const [roleid, setroleidState] = useState(
    sessionStorage.getItem("roleid") || null
  );

  const [incuserid, setincuseridstate] = useState(
    sessionStorage.getItem("incuserid") || null
  );

  // NEW: State for incubation list and selected incubation
  const [incubationList, setIncubationList] = useState([]);
  const [selectedIncubation, setSelectedIncubation] = useState(null);
  const [incubationDetails, setIncubationDetails] = useState(null);
  const [incubationLoading, setIncubationLoading] = useState(false);

  // Create proper setters that update sessionStorage
  const setUserid = (id) => {
    const idString = id ? String(id) : null;
    sessionStorage.setItem("userid", idString);
    setUseridState(idString);
  };

  const setroleid = (id) => {
    const idString = id ? String(id) : null;
    sessionStorage.setItem("roleid", idString);
    setroleidState(idString);
  };

  const setincuserid = (id) => {
    // For admin (roleid "0"), incuserid should always be "ALL" by default
    // But will be overridden when a specific incubation is selected
    const idString = roleid === "0" ? "ALL" : id ? String(id) : null;
    sessionStorage.setItem("incuserid", idString);
    setincuseridstate(idString);
  };

  const [fromYear, setFromYear] = useState("2025");
  const [toYear, setToYear] = useState("2026");

  // Helper function to safely extract data from API response
  const extractData = (response, fallback = []) => {
    if (!response) {
      console.warn("Response is undefined or null");
      return fallback;
    }

    // Handle different response structures
    if (response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data.data) {
        return response.data.data;
      }
      if (response.data.result) {
        return response.data.result;
      }
    }

    console.warn("Unexpected response structure:", response);
    return fallback;
  };

  // NEW: Function to fetch incubation list
  const fetchIncubationList = async () => {
    try {
      const response = await api.post("/generic/getincubationlist", {
        userId: userid,
        userIncId: "ALL",
      });

      const data = extractData(response, []);
      setIncubationList(data);

      // Set default selected incubation if incuserid is available and not "ALL"
      if (incuserid && incuserid !== "ALL") {
        const defaultIncubation = data.find(
          (item) => item.incubationsrecid === parseInt(incuserid)
        );
        if (defaultIncubation) {
          setSelectedIncubation(defaultIncubation);
        }
      }

      return data;
    } catch (error) {
      console.error("Error fetching incubation list:", error);
      return [];
    }
  };

  // NEW: Function to fetch incubation details by ID
  const fetchIncubationDetails = async (incubationId) => {
    if (!incubationId) return null;

    setIncubationLoading(true);
    try {
      const response = await api.post("/generic/getincubationdetails", {
        userId: userid,
        userIncId: incubationId,
      });

      const data = extractData(response, []);
      // Find the specific incubation details from the array
      const details = data.find(
        (item) => item.incubationsrecid === parseInt(incubationId)
      );
      setIncubationDetails(details);
      return details;
    } catch (error) {
      console.error("Error fetching incubation details:", error);
      return null;
    } finally {
      setIncubationLoading(false);
    }
  };

  // NEW: Function to handle incubation selection
  const handleIncubationSelect = async (incubation) => {
    setSelectedIncubation(incubation);

    // Update incuserid with the selected incubation's recid
    // This will be used in API calls
    setincuserid(incubation.incubationsrecid.toString());

    // Fetch the detailed information for the selected incubation
    await fetchIncubationDetails(incubation.incubationsrecid);
  };

  // NEW: Function to reset incubation selection
  const resetIncubationSelection = () => {
    setSelectedIncubation(null);
    setIncubationDetails(null);

    // Reset incuserid based on role
    if (roleid === "0") {
      setincuserid("ALL");
    } else {
      setincuserid(null);
    }
  };

  // Add this refresh function for company documents
  // Add this refresh function for company documents
  const refreshCompanyDocuments = async () => {
    try {
      const targetUserId = adminViewingStartupId || userid;
      const response = await api.post("/generic/getcollecteddocsdash", {
        userId:
          Number(roleid) === 1 && !adminViewingStartupId ? "ALL" : targetUserId,
        incUserId: incuserid,
        startYear: fromYear,
        endYear: toYear,
      });

      const data = extractData(response, []);
      setCompanyDoc(data);
      setstartupcompanyDoc(data);

      return data; // Return the data for immediate use
    } catch (error) {
      console.error("Error refreshing company documents:", error);
      throw error; // Re-throw so caller can handle
    }
  };

  // Add adminviewData state
  const [adminviewData, setadminviewData] = useState(null);

  // New function to fetch startup data by ID
  const fetchStartupDataById = async (userId) => {
    if (!userId) return;

    setAdminStartupLoading(true);
    setAdminViewingStartupId(userId);

    try {
      // API call for company documents
      const documentsResponse = await api.post(
        "/generic/getcollecteddocsdash",
        {
          userId: userId,
          startYear: fromYear,
          endYear: toYear,
          incUserId: incuserid,
        }
      );

      // API call for startup/incubatee details
      const incubateesResponse = await api.post("/generic/getincubatessdash", {
        userId: userId,
        incUserId: incuserid,
      });

      // Process documents data
      const documentsData = extractData(documentsResponse, []);
      setstartupcompanyDoc(documentsData);

      // Process incubatees data
      const incubateesData = extractData(incubateesResponse, []);
      setstartupdetails(incubateesData);

      console.log("Fetched startup data:", {
        documents: documentsData,
        incubatees: incubateesData,
      });
    } catch (error) {
      console.error("Error fetching startup data by ID:", error);
      setstartupcompanyDoc([]);
      setstartupdetails([]);
    } finally {
      setAdminStartupLoading(false);
    }
  };

  // Effect to fetch data when adminviewData changes
  useEffect(() => {
    if (adminviewData) {
      fetchStartupDataById(adminviewData);
    }
  }, [adminviewData, fromYear, toYear]);

  // New function for admin to fetch specific startup data
  const fetchStartupDataForAdmin = async (startupUserId) => {
    if (Number(roleid) !== 1) {
      console.warn("Only admin can view other startup data");
      return;
    }

    fetchStartupDataById(startupUserId);
  };

  // Function to reset admin view back to admin's own data
  const resetAdminView = () => {
    setAdminViewingStartupId(null);
    setadminviewData(null);
    setstartupcompanyDoc([]);
    setstartupdetails([]);
  };

  // Function to clear all data (for logout)
  const clearAllData = () => {
    setStats(null);
    setByField([]);
    setByStage([]);
    setCompanyDoc([]);
    setListOfIncubatees([]);
    setstartupcompanyDoc([]);
    setstartupdetails([]);
    setCurrentCompanyDetails(null);
    setAdminViewingStartupId(null);
    setadminviewData(null);
    setLoading(false);
  };

  // Effect to clear admin data when userid or roleid changes (login/logout)
  useEffect(() => {
    if (!userid || !roleid) {
      // Clear all data if no userid or roleid (logout scenario)
      clearAllData();
      return;
    }

    // If switching from admin view to user login, clear admin-specific data
    if (Number(roleid) === 4 && (adminViewingStartupId || adminviewData)) {
      resetAdminView();
    }
  }, [userid, roleid, incuserid]);

  // Effect to sync with sessionStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const sessionUserid = sessionStorage.getItem("userid");
      const sessionRoleid = sessionStorage.getItem("roleid");
      const sessionIncuserid = sessionStorage.getItem("incuserid");

      // Just sync with sessionStorage value
      if (sessionUserid !== userid) {
        setUseridState(sessionUserid);
      }

      if (sessionRoleid !== roleid) {
        setroleidState(sessionRoleid);
      }

      // Corrected logic for incuserid
      // If the role in sessionStorage is "0" (admin), state must be "ALL"
      if (sessionRoleid === "0") {
        if (incuserid !== "ALL") {
          setincuseridstate("ALL");
        }
      } else {
        // For other roles, sync with sessionStorage value
        if (sessionIncuserid !== incuserid) {
          setincuseridstate(sessionIncuserid);
        }
      }
    };

    // Listen for storage events (for changes in other tabs/windows)
    window.addEventListener("storage", handleStorageChange);

    // Check immediately on mount
    handleStorageChange();

    // Set up an interval to check for sessionStorage changes within the same tab
    const intervalId = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, [userid, roleid, incuserid]);

  // NEW: Effect to fetch incubation list on component mount
  useEffect(() => {
    if (userid) {
      fetchIncubationList();
    }
  }, [userid]);

  // NEW: Effect to fetch incubation details when selected incubation changes
  useEffect(() => {
    if (selectedIncubation) {
      fetchIncubationDetails(selectedIncubation.incubationsrecid);
    }
  }, [selectedIncubation]);

  // General data fetch (for admin/users)
  useEffect(() => {
    if (!userid || !roleid) return;

    // Skip general fetch if admin is viewing specific startup
    if (adminViewingStartupId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Determine userId for different API calls
        // For stats, field, and stage APIs, use the actual userid
        const userIdForGeneralApis = userid;

        // Determine the userIncId for API calls
        // If a specific incubation is selected, use its recid
        // Otherwise, use the default based on role
        let userIncId;
        if (selectedIncubation) {
          userIncId = selectedIncubation.incubationsrecid.toString();
        } else if (Number(roleid) === 0 || Number(roleid) === 1) {
          userIncId = "ALL";
        } else {
          userIncId = userid;
        }

        // For getcollecteddocsdash and getincubatessdash, userId should be "ALL" when roleid is 0 or 1
        const userIdForListApis =
          Number(roleid) === 0 || Number(roleid) === 1 ? "ALL" : userid;

        // Make API calls individually to handle errors better
        const apiCalls = [
          {
            name: "stats",
            call: () =>
              api.post("/generic/getstatscom", {
                userId: userIdForGeneralApis,
                userIncId: userIncId,
              }),
          },
          {
            name: "field",
            call: () =>
              api.post("/generic/getcombyfield", {
                userId: userIdForGeneralApis,
                userIncId: userIncId,
              }),
          },
          {
            name: "stage",
            call: () =>
              api.post("/generic/getcombystage", {
                userId: userIdForGeneralApis,
                userIncId: userIncId,
              }),
          },
          {
            name: "documents",
            call: () =>
              api.post("/generic/getcollecteddocsdash", {
                userId: userIdForListApis,
                incUserId: userIncId,
                startYear: fromYear,
                endYear: toYear,
              }),
          },
          {
            name: "incubatees",
            call: () =>
              api.post("/generic/getincubatessdash", {
                userId: userIdForListApis,
                incUserId: userIncId,
              }),
          },
        ];

        const results = await Promise.allSettled(
          apiCalls.map(({ call }) => call())
        );

        // Process results with individual error handling
        results.forEach((result, index) => {
          const { name } = apiCalls[index];

          if (result.status === "fulfilled") {
            const data = extractData(result.value, []);

            switch (name) {
              case "stats":
                setStats(data);
                break;
              case "field":
                setByField(data);
                break;
              case "stage":
                setByStage(data);
                break;
              case "documents":
                setCompanyDoc(data);
                // Only set startup data if not admin or if admin is not viewing specific startup
                if (Number(roleid) !== 1) {
                  setstartupcompanyDoc(data);
                }
                break;
              case "incubatees":
                setListOfIncubatees(data);
                // Only set startup data if not admin or if admin is not viewing specific startup
                if (Number(roleid) !== 1) {
                  setstartupdetails(data);
                }
                break;
              default:
                break;
            }
          } else {
            console.error(`Error fetching ${name}:`, result.reason);

            // Set fallback values for failed requests
            switch (name) {
              case "stats":
                setStats(null);
                break;
              case "field":
                setByField([]);
                break;
              case "stage":
                setByStage([]);
                break;
              case "documents":
                setCompanyDoc([]);
                if (Number(roleid) !== 1) {
                  setstartupcompanyDoc([]);
                }
                break;
              case "incubatees":
                setListOfIncubatees([]);
                if (Number(roleid) !== 1) {
                  setstartupdetails([]);
                }
                break;
              default:
                break;
            }
          }
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);

        // Set all states to safe defaults on complete failure
        setStats(null);
        setByField([]);
        setByStage([]);
        setCompanyDoc([]);
        setListOfIncubatees([]);
        if (Number(roleid) !== 1) {
          setstartupcompanyDoc([]);
          setstartupdetails([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    userid,
    roleid,
    fromYear,
    toYear,
    adminViewingStartupId,
    selectedIncubation,
  ]);

  return (
    <DataContext.Provider
      value={{
        stats,
        byField,
        byStage,
        companyDoc,
        setCompanyDoc,
        listOfIncubatees,
        setListOfIncubatees,
        loading,
        userid,
        setUserid,
        setroleid,
        fromYear,
        setFromYear,
        toYear,
        setToYear,
        roleid,
        startupcompanyDoc,
        setstartupcompanyDoc,
        startupdetails,
        setstartupdetails,
        currentCompanyDetails,
        setCurrentCompanyDetails,
        refreshCompanyDocuments,
        // Admin functions
        fetchStartupDataForAdmin,
        fetchStartupDataById,
        resetAdminView,
        clearAllData,
        adminViewingStartupId,
        adminStartupLoading,
        adminviewData,
        setadminviewData,
        incuserid,
        setincuserid,
        // NEW: Incubation functions and state
        incubationList,
        selectedIncubation,
        incubationDetails,
        incubationLoading,
        fetchIncubationList,
        fetchIncubationDetails,
        handleIncubationSelect,
        resetIncubationSelection,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
