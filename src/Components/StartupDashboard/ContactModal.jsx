import React, { useState, useEffect } from "react";
import styles from "./ContactModal.module.css";
import api from "../Datafetching/api"; // Axios instance
import { Mail, User, X, Loader } from "lucide-react";

const ContactModal = ({ isOpen, onClose, userId, incuserid }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Create a new AbortController for this effect run
    const controller = new AbortController();

    // Define the async function inside the effect
    const fetchContacts = async () => {
      // Don't fetch if the modal isn't open or we don't have a userId
      if (!isOpen || !userId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        // 2. Pass the controller's signal to the API call
        const response = await api.post(
          "/generic/getspocs",
          {
            userId: userId,
            incUserId: incuserid,
          },
          {
            signal: controller.signal, // Axios will use this to cancel the request
          }
        );

        // This check is technically redundant if the request wasn't aborted,
        // but it's good practice for safety.
        if (controller.signal.aborted) return;

        if (response.data.statusCode === 200) {
          setContacts(response.data.data || []);
        } else {
          setError(response.data.message || "Failed to fetch contacts");
        }
      } catch (err) {
        // 3. Check if the error is due to the request being aborted
        // Axios uses 'CanceledError' for aborted requests
        if (err.name === "CanceledError") {
          console.log(
            "API call was canceled due to a new request or component unmount."
          );
          return; // Exit silently, don't show an error to the user
        }

        // Handle other errors
        if (err.response) {
          setError(err.response.data?.message || "Failed to fetch contacts");
        } else {
          setError("Network error: " + err.message);
        }
      } finally {
        // Only update loading state if the request wasn't aborted
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchContacts();

    // 4. The cleanup function: This will be called when the component unmounts
    // or before the effect runs again (due to a dependency change).
    return () => {
      controller.abort();
    };

    // 5. Add all dependencies used inside the effect to the array
  }, [isOpen, userId, incuserid]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Contact SPOCs</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Loader className={styles.spinner} size={32} />
              <p>Loading contacts...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.error}>{error}</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No contacts available</p>
            </div>
          ) : (
            <div className={styles.contactsList}>
              {contacts.map((contact) => (
                <div key={contact.usersrecid} className={styles.contactCard}>
                  <div className={styles.contactInfo}>
                    <div className={styles.contactRow}>
                      <User size={18} className={styles.icon} />
                      <div>
                        <span className={styles.label}>Name</span>
                        <span className={styles.value}>
                          {contact.usersname}
                        </span>
                      </div>
                    </div>
                    <div className={styles.contactRow}>
                      <Mail size={18} className={styles.icon} />
                      <div>
                        <span className={styles.label}>Email</span>
                        <a
                          href={`mailto:${contact.usersemail}`}
                          className={styles.emailLink}
                        >
                          {contact.usersemail}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
