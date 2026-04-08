"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import "@/styles/admin-itineraries.scss";

type ActivityGroup = {
  place: string;
  activities: string[];
};

type BookingItinerary = {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  adults: number;
  children: number;
  accommodationType: string;
  foodType: string;
  allergies: string;
  budgetPreference: string;
  preferredTransport: string;

  itineraryText: string;
  mood: string;
  selectedPlaces: string[];
  selectedActivities: ActivityGroup[];
  days: number;
  specificDate: string;
  peopleCount: number;
  travelCompanions: string[];
  customCompanionNote: string;
  extraNotes: string;

  status: "pending" | "in_review" | "approved" | "rejected" | "completed";
  adminNote: string;
  createdAt: string;

  user?: {
    _id?: string;
    username?: string;
    email?: string;
    profileImage?: string;
  } | null;
};

const statusOptions = [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "completed",
] as const;

const accommodationLabel: Record<string, string> = {
  hotel_or_rooms: "Hotel / Rooms",
  rented_house: "Rented House",
  hostel_or_dorm: "Hostel / Dorm",
  camping: "Camping",
};

const foodLabel: Record<string, string> = {
  veg: "Veg",
  non_veg: "Non-Veg",
};

const transportLabel: Record<string, string> = {
  car: "Car",
  van: "Van",
  bus: "Bus",
};

export default function AdminItinerariesPage() {
  const [items, setItems] = useState<BookingItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingItinerary | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminStatus, setAdminStatus] =
    useState<BookingItinerary["status"]>("pending");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/booking-itineraries/admin");
      setItems(res.data?.bookings || []);
    } catch (error: any) {
      console.error("Failed to fetch admin itineraries:", error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const openModal = (item: BookingItinerary) => {
    setSelected(item);
    setAdminStatus(item.status);
    setAdminNote(item.adminNote || "");
  };

  const closeModal = () => {
    setSelected(null);
    setAdminStatus("pending");
    setAdminNote("");
  };

  const saveUpdate = async () => {
    if (!selected?._id) return;

    try {
      setSaving(true);

      const res = await api.patch(`/booking-itineraries/${selected._id}/status`, {
        status: adminStatus,
        adminNote,
      });

      const updated = res.data?.booking;

      setItems((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );

      setSelected(updated);
    } catch (error: any) {
      console.error("Failed to update itinerary:", error?.response?.data || error);
      alert(
        error?.response?.data?.message || "Failed to update itinerary."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-itineraries-page">
      <div className="admin-itineraries-header">
        <div>
          <h1>Itinerary Requests</h1>
          <p>View user itinerary requests and update status.</p>
        </div>

        <div className="admin-itineraries-filter">
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-itineraries-empty">Loading itinerary requests...</div>
      ) : filteredItems.length === 0 ? (
        <div className="admin-itineraries-empty">No itinerary requests found.</div>
      ) : (
        <div className="admin-itineraries-grid">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="admin-itinerary-card"
              onClick={() => openModal(item)}
            >
              <div className="admin-itinerary-card__top">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.email}</p>
                  <p>{item.phoneNumber}</p>
                </div>

                <span className={`admin-status-badge ${item.status}`}>
                  {item.status.replace("_", " ")}
                </span>
              </div>

              <div className="admin-itinerary-card__chips">
                <span>Mood: {item.mood}</span>
                <span>Days: {item.days}</span>
                <span>Adults: {item.adults}</span>
                <span>Children: {item.children}</span>
              </div>

              <div className="admin-itinerary-card__places">
                <strong>Places</strong>
                <p>{item.selectedPlaces?.join(", ") || "No places selected"}</p>
              </div>

              <div className="admin-itinerary-card__footer">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <button type="button">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="admin-itinerary-modal-backdrop" onClick={closeModal}>
          <div
            className="admin-itinerary-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-itinerary-modal__header">
              <div>
                <h2>Itinerary Request</h2>
                <p>
                  {selected.name} • {selected.email}
                </p>
              </div>

              <button onClick={closeModal}>✕</button>
            </div>

            <div className="admin-itinerary-modal__content">
              <section className="admin-itinerary-section">
                <h4>Contact Details</h4>
                <div className="admin-itinerary-info-grid">
                  <span><strong>Name:</strong> {selected.name}</span>
                  <span><strong>Phone:</strong> {selected.phoneNumber}</span>
                  <span><strong>Email:</strong> {selected.email}</span>
                  <span><strong>User Account:</strong> {selected.user?.username || "N/A"}</span>
                </div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Travel Preferences</h4>
                <div className="admin-itinerary-info-grid">
                  <span><strong>Adults:</strong> {selected.adults}</span>
                  <span><strong>Children:</strong> {selected.children}</span>
                  <span><strong>Accommodation:</strong> {accommodationLabel[selected.accommodationType] || "Not specified"}</span>
                  <span><strong>Food Type:</strong> {foodLabel[selected.foodType] || "Not specified"}</span>
                  <span><strong>Allergies:</strong> {selected.allergies || "None"}</span>
                  <span><strong>Budget:</strong> {selected.budgetPreference || "Not specified"}</span>
                  <span><strong>Transport:</strong> {transportLabel[selected.preferredTransport] || "Not specified"}</span>
                </div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Trip Details</h4>
                <div className="admin-itinerary-info-grid">
                  <span><strong>Mood:</strong> {selected.mood}</span>
                  <span><strong>Days:</strong> {selected.days}</span>
                  <span><strong>People Count:</strong> {selected.peopleCount}</span>
                  <span><strong>Specific Date:</strong> {selected.specificDate || "Not specified"}</span>
                  <span><strong>Companions:</strong> {selected.travelCompanions?.join(", ") || "Not mentioned"}</span>
                  <span><strong>Companion Note:</strong> {selected.customCompanionNote || "None"}</span>
                </div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Selected Places</h4>
                <p>{selected.selectedPlaces?.join(", ") || "No places selected"}</p>
              </section>

              <section className="admin-itinerary-section">
                <h4>Selected Activities</h4>
                <div className="admin-activities-list">
                  {selected.selectedActivities?.length ? (
                    selected.selectedActivities.map((group, index) => (
                      <div className="admin-activity-block" key={index}>
                        <h5>{group.place}</h5>
                        <ul>
                          {group.activities?.map((activity, i) => (
                            <li key={i}>{activity}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p>No activities selected.</p>
                  )}
                </div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Extra Notes</h4>
                <p>{selected.extraNotes || "No extra notes"}</p>
              </section>

              <section className="admin-itinerary-section">
                <h4>Generated Itinerary</h4>
                <div className="admin-itinerary-text">{selected.itineraryText}</div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Admin Update</h4>

                <div className="admin-itinerary-update-grid">
                  <div>
                    <label>Status</label>
                    <select
                      value={adminStatus}
                      onChange={(e) =>
                        setAdminStatus(e.target.value as BookingItinerary["status"])
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Admin Note</label>
                    <textarea
                      rows={5}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Write an update note here..."
                    />
                  </div>
                </div>

                <div className="admin-itinerary-actions">
                  <button className="save-btn" onClick={saveUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Save Update"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}