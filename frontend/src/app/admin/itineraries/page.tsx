"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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
  allergies?: string;
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

  addedToPackage?: boolean;
  packageCreatedAt?: string | null;
  travelPickId?: {
    _id: string;
    title?: string;
    place?: string;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
    price?: number;
    isPublished?: boolean;
  } | null;

  user?: {
    _id?: string;
    username?: string;
    email?: string;
    profileImage?: string;
  } | null;
};

type PackageFormState = {
  title: string;
  place: string;
  startDate: string;
  endDate: string;
  caption: string;
  price: string;
  placesToVisit: string;
  accommodation: string;
  meals: string;
  transportation: string;
  tourGuide: string;
  paymentInfo: string;
  moreDetails: string;
  advancePolicy: string;
  advancePercentage: string;
  cancellationPolicy: string;
  refundPolicy: string;
  isPublished: boolean;
  adminNote: string;
  markStatusApproved: boolean;
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

const emptyPackageForm: PackageFormState = {
  title: "",
  place: "",
  startDate: "",
  endDate: "",
  caption: "",
  price: "",
  placesToVisit: "",
  accommodation: "",
  meals: "",
  transportation: "",
  tourGuide: "",
  paymentInfo: "",
  moreDetails: "",
  advancePolicy: "30% advance payment is required to confirm the booking.",
  advancePercentage: "30",
  cancellationPolicy:
    "No cancellation after confirmation due to travel arrangements.",
  refundPolicy: "Advance payment is non-refundable after confirmation.",
  isPublished: true,
  adminNote: "",
  markStatusApproved: true,
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

  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [packageLoading, setPackageLoading] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [packageMessage, setPackageMessage] = useState("");
  const [packageMessageType, setPackageMessageType] = useState<
    "success" | "error"
  >("error");
  const [packageForm, setPackageForm] =
    useState<PackageFormState>(emptyPackageForm);
  const [packageImage, setPackageImage] = useState<File | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/booking-itineraries/admin");
      setItems(res.data?.bookings || []);
    } catch (error: any) {
      console.error(
        "Failed to fetch admin itineraries:",
        error?.response?.data || error
      );
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

  const packageImagePreview = useMemo(() => {
    if (!packageImage) return "";
    return URL.createObjectURL(packageImage);
  }, [packageImage]);

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
      console.error(
        "Failed to update itinerary:",
        error?.response?.data || error
      );
      alert(error?.response?.data?.message || "Failed to update itinerary.");
    } finally {
      setSaving(false);
    }
  };

  const handlePackageFieldChange = (
    key: keyof PackageFormState,
    value: string | boolean
  ) => {
    setPackageForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const openAddToPackageModal = async () => {
    if (!selected?._id || selected.addedToPackage) return;

    try {
      setPackageLoading(true);
      setPackageModalOpen(true);
      setPackageMessage("");
      setPackageImage(null);

      const res = await api.get(
        `/booking-itineraries/${selected._id}/package-prefill`
      );

      const prefill = res.data?.prefill || {};

      setPackageForm({
        title: prefill.title || "",
        place: prefill.place || "",
        startDate: prefill.startDate || "",
        endDate: prefill.endDate || "",
        caption: prefill.caption || "",
        price:
          prefill.price !== undefined && prefill.price !== null
            ? String(prefill.price)
            : "",
        placesToVisit: prefill.placesToVisit || "",
        accommodation: prefill.accommodation || "",
        meals: prefill.meals || "",
        transportation: prefill.transportation || "",
        tourGuide: prefill.tourGuide || "",
        paymentInfo: prefill.paymentInfo || "",
        moreDetails: prefill.moreDetails || "",
        advancePolicy:
          prefill.advancePolicy ||
          "30% advance payment is required to confirm the booking.",
        advancePercentage:
          prefill.advancePercentage !== undefined &&
          prefill.advancePercentage !== null
            ? String(prefill.advancePercentage)
            : "30",
        cancellationPolicy:
          prefill.cancellationPolicy ||
          "No cancellation after confirmation due to travel arrangements.",
        refundPolicy:
          prefill.refundPolicy ||
          "Advance payment is non-refundable after confirmation.",
        isPublished:
          typeof prefill.isPublished === "boolean" ? prefill.isPublished : true,
        adminNote: prefill.adminNote || adminNote || "",
        markStatusApproved:
          typeof prefill.markStatusApproved === "boolean"
            ? prefill.markStatusApproved
            : true,
      });
    } catch (error: any) {
      console.error(
        "Failed to load package prefill:",
        error?.response?.data || error
      );
      setPackageMessageType("error");
      setPackageMessage(
        error?.response?.data?.message || "Failed to load package data."
      );
    } finally {
      setPackageLoading(false);
    }
  };

  const closePackageModal = () => {
    setPackageModalOpen(false);
    setPackageLoading(false);
    setPackageSubmitting(false);
    setPackageImage(null);
    setPackageMessage("");
    setPackageForm(emptyPackageForm);
  };

  const handlePackageImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPackageImage(e.target.files?.[0] || null);
  };

  const handleCreatePackage = async (e: FormEvent) => {
    e.preventDefault();

    if (!selected?._id) return;

    if (!packageImage) {
      setPackageMessageType("error");
      setPackageMessage("Please upload a package image.");
      return;
    }

    try {
      setPackageSubmitting(true);
      setPackageMessage("");

      const formData = new FormData();
      formData.append("title", packageForm.title.trim());
      formData.append("place", packageForm.place.trim());
      formData.append("startDate", packageForm.startDate);
      formData.append("endDate", packageForm.endDate);
      formData.append("caption", packageForm.caption.trim());
      formData.append("price", packageForm.price);
      formData.append("placesToVisit", packageForm.placesToVisit);
      formData.append("accommodation", packageForm.accommodation.trim());
      formData.append("meals", packageForm.meals.trim());
      formData.append("transportation", packageForm.transportation.trim());
      formData.append("tourGuide", packageForm.tourGuide.trim());
      formData.append("paymentInfo", packageForm.paymentInfo.trim());
      formData.append("moreDetails", packageForm.moreDetails.trim());
      formData.append("advancePolicy", packageForm.advancePolicy.trim());
      formData.append("advancePercentage", packageForm.advancePercentage);
      formData.append(
        "cancellationPolicy",
        packageForm.cancellationPolicy.trim()
      );
      formData.append("refundPolicy", packageForm.refundPolicy.trim());
      formData.append("isPublished", String(packageForm.isPublished));
      formData.append("adminNote", packageForm.adminNote.trim());
      formData.append(
        "markStatusApproved",
        String(packageForm.markStatusApproved)
      );
      formData.append("image", packageImage);

      const res = await api.post(
        `/booking-itineraries/${selected._id}/add-to-package`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

    const updatedBooking = res.data?.booking || {
  ...selected,
  addedToPackage: true,
  status: packageForm.markStatusApproved ? "approved" : selected.status,
  adminNote: packageForm.adminNote,
  travelPickId: res.data?.travelPick
    ? {
        _id: res.data.travelPick._id,
        title: res.data.travelPick.title,
        place: res.data.travelPick.place,
        imageUrl: res.data.travelPick.imageUrl,
        startDate: res.data.travelPick.startDate,
        endDate: res.data.travelPick.endDate,
        price: res.data.travelPick.price,
        isPublished: res.data.travelPick.isPublished,
      }
    : selected.travelPickId,
};

      setItems((prev) =>
        prev.map((item) => (item._id === updatedBooking?._id ? updatedBooking : item))
      );

      setSelected(updatedBooking || selected);
      setAdminStatus(updatedBooking?.status || adminStatus);
      setAdminNote(updatedBooking?.adminNote || adminNote);

      setPackageMessageType("success");
      setPackageMessage("Travel package created successfully.");

      setTimeout(() => {
        closePackageModal();
      }, 800);
       } catch (error: any) {
      console.error("Failed to add itinerary to package:");
      console.error("status:", error?.response?.status);
      console.error("data:", error?.response?.data);
      console.error("message:", error?.message);
      console.error("full error:", error);

      setPackageMessageType("error");
      setPackageMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create package."
      );
    } finally {
      setPackageSubmitting(false);
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
        <div className="admin-itineraries-empty">
          Loading itinerary requests...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="admin-itineraries-empty">
          No itinerary requests found.
        </div>
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
                  <span>
                    <strong>Name:</strong> {selected.name}
                  </span>
                  <span>
                    <strong>Phone:</strong> {selected.phoneNumber}
                  </span>
                  <span>
                    <strong>Email:</strong> {selected.email}
                  </span>
                  <span>
                    <strong>User Account:</strong>{" "}
                    {selected.user?.username || "N/A"}
                  </span>
                </div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Travel Preferences</h4>
                <div className="admin-itinerary-info-grid">
                  <span>
                    <strong>Adults:</strong> {selected.adults}
                  </span>
                  <span>
                    <strong>Children:</strong> {selected.children}
                  </span>
                  <span>
                    <strong>Accommodation:</strong>{" "}
                    {accommodationLabel[selected.accommodationType] ||
                      "Not specified"}
                  </span>
                  <span>
                    <strong>Food Type:</strong>{" "}
                    {foodLabel[selected.foodType] || "Not specified"}
                  </span>
                  <span>
                    <strong>Allergies:</strong> {selected.allergies || "None"}
                  </span>
                  <span>
                    <strong>Budget:</strong>{" "}
                    {selected.budgetPreference || "Not specified"}
                  </span>
                  <span>
                    <strong>Transport:</strong>{" "}
                    {transportLabel[selected.preferredTransport] ||
                      "Not specified"}
                  </span>
                </div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Trip Details</h4>
                <div className="admin-itinerary-info-grid">
                  <span>
                    <strong>Mood:</strong> {selected.mood}
                  </span>
                  <span>
                    <strong>Days:</strong> {selected.days}
                  </span>
                  <span>
                    <strong>People Count:</strong> {selected.peopleCount}
                  </span>
                  <span>
                    <strong>Specific Date:</strong>{" "}
                    {selected.specificDate || "Not specified"}
                  </span>
                  <span>
                    <strong>Companions:</strong>{" "}
                    {selected.travelCompanions?.join(", ") || "Not mentioned"}
                  </span>
                  <span>
                    <strong>Companion Note:</strong>{" "}
                    {selected.customCompanionNote || "None"}
                  </span>
                </div>
              </section>

              <section className="admin-itinerary-section">
                <h4>Selected Places</h4>
                <p>
                  {selected.selectedPlaces?.join(", ") || "No places selected"}
                </p>
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
                <div className="admin-itinerary-text">
                  {selected.itineraryText}
                </div>
              </section>

              {selected.addedToPackage && selected.travelPickId ? (
                <section className="admin-itinerary-section">
                  <h4>Package Created</h4>
                  <div className="admin-created-package-box">
                    <p>
                      This itinerary has already been added to a package.
                    </p>
                    <div className="admin-created-package-box__meta">
                      <span>
                        <strong>Title:</strong>{" "}
                        {selected.travelPickId.title || "N/A"}
                      </span>
                      <span>
                        <strong>Place:</strong>{" "}
                        {selected.travelPickId.place || "N/A"}
                      </span>
                      <span>
                        <strong>Price:</strong>{" "}
                        {selected.travelPickId.price ?? "N/A"}
                      </span>
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="admin-itinerary-section">
                <h4>Admin Update</h4>

                <div className="admin-itinerary-update-grid">
                  <div>
                    <label>Status</label>
                    <select
                      value={adminStatus}
                      onChange={(e) =>
                        setAdminStatus(
                          e.target.value as BookingItinerary["status"]
                        )
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
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={openAddToPackageModal}
                    disabled={selected.addedToPackage}
                  >
                    {selected.addedToPackage
                      ? "Already Added to Package"
                      : "Add to Package"}
                  </button>

                  <button
                    className="save-btn"
                    onClick={saveUpdate}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? "Saving..." : "Save Update"}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {packageModalOpen && selected && (
        <div
          className="admin-itinerary-modal-backdrop"
          onClick={closePackageModal}
        >
          <div
            className="admin-package-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-itinerary-modal__header">
              <div>
                <h2>Add to Package</h2>
                <p>
                  Prefilled from itinerary • {selected.name}
                </p>
              </div>

              <button onClick={closePackageModal}>✕</button>
            </div>

            <form
              className="admin-package-modal__content"
              onSubmit={handleCreatePackage}
            >
              {packageMessage ? (
                <div className={`admin-package-alert ${packageMessageType}`}>
                  {packageMessage}
                </div>
              ) : null}

              {packageLoading ? (
                <div className="admin-itineraries-empty">
                  Loading package details...
                </div>
              ) : (
                <div className="admin-package-layout">
                  <div className="admin-package-form-card">
                    <div className="admin-package-grid admin-package-grid--2">
                      <label className="admin-package-field">
                        <span>Title</span>
                        <input
                          type="text"
                          value={packageForm.title}
                          onChange={(e) =>
                            handlePackageFieldChange("title", e.target.value)
                          }
                          required
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Place</span>
                        <input
                          type="text"
                          value={packageForm.place}
                          onChange={(e) =>
                            handlePackageFieldChange("place", e.target.value)
                          }
                          required
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Start Date</span>
                        <input
                          type="date"
                          value={packageForm.startDate}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "startDate",
                              e.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>End Date</span>
                        <input
                          type="date"
                          value={packageForm.endDate}
                          onChange={(e) =>
                            handlePackageFieldChange("endDate", e.target.value)
                          }
                          required
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Price</span>
                        <input
                          type="number"
                          min="0"
                          value={packageForm.price}
                          onChange={(e) =>
                            handlePackageFieldChange("price", e.target.value)
                          }
                          required
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Advance Percentage</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={packageForm.advancePercentage}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "advancePercentage",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <label className="admin-package-field">
                      <span>Caption</span>
                      <textarea
                        value={packageForm.caption}
                        onChange={(e) =>
                          handlePackageFieldChange("caption", e.target.value)
                        }
                        required
                      />
                    </label>

                    <label className="admin-package-field">
                      <span>Places To Visit</span>
                      <small>Separate places with commas</small>
                      <input
                        type="text"
                        value={packageForm.placesToVisit}
                        onChange={(e) =>
                          handlePackageFieldChange(
                            "placesToVisit",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <div className="admin-package-grid admin-package-grid--2">
                      <label className="admin-package-field">
                        <span>Accommodation</span>
                        <input
                          type="text"
                          value={packageForm.accommodation}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "accommodation",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Meals</span>
                        <input
                          type="text"
                          value={packageForm.meals}
                          onChange={(e) =>
                            handlePackageFieldChange("meals", e.target.value)
                          }
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Transportation</span>
                        <input
                          type="text"
                          value={packageForm.transportation}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "transportation",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Tour Guide</span>
                        <input
                          type="text"
                          value={packageForm.tourGuide}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "tourGuide",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <label className="admin-package-field">
                      <span>Payment Info</span>
                      <textarea
                        value={packageForm.paymentInfo}
                        onChange={(e) =>
                          handlePackageFieldChange(
                            "paymentInfo",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label className="admin-package-field">
                      <span>More Details</span>
                      <textarea
                        value={packageForm.moreDetails}
                        onChange={(e) =>
                          handlePackageFieldChange(
                            "moreDetails",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label className="admin-package-field">
                      <span>Advance Policy</span>
                      <textarea
                        value={packageForm.advancePolicy}
                        onChange={(e) =>
                          handlePackageFieldChange(
                            "advancePolicy",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <div className="admin-package-grid admin-package-grid--2">
                      <label className="admin-package-field">
                        <span>Cancellation Policy</span>
                        <textarea
                          value={packageForm.cancellationPolicy}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "cancellationPolicy",
                              e.target.value
                            )
                          }
                        />
                      </label>

                      <label className="admin-package-field">
                        <span>Refund Policy</span>
                        <textarea
                          value={packageForm.refundPolicy}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "refundPolicy",
                              e.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <label className="admin-package-field">
                      <span>Admin Note</span>
                      <textarea
                        value={packageForm.adminNote}
                        onChange={(e) =>
                          handlePackageFieldChange("adminNote", e.target.value)
                        }
                        placeholder="Optional note when creating the package"
                      />
                    </label>

                    <div className="admin-package-checks">
                      <label className="admin-package-check">
                        <input
                          type="checkbox"
                          checked={packageForm.isPublished}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "isPublished",
                              e.target.checked
                            )
                          }
                        />
                        <span>Publish Now</span>
                      </label>

                      <label className="admin-package-check">
                        <input
                          type="checkbox"
                          checked={packageForm.markStatusApproved}
                          onChange={(e) =>
                            handlePackageFieldChange(
                              "markStatusApproved",
                              e.target.checked
                            )
                          }
                        />
                        <span>Mark itinerary as approved</span>
                      </label>
                    </div>

                    <div className="admin-package-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={closePackageModal}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="save-btn"
                        disabled={packageSubmitting}
                      >
                        {packageSubmitting
                          ? "Creating..."
                          : "Create Travel Pick"}
                      </button>
                    </div>
                  </div>

                  <div className="admin-package-upload-card">
                    <h4>Cover Image</h4>
                    <p>Upload the package image here.</p>

                    <label className="admin-package-upload-box">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePackageImageChange}
                      />

                      {packageImagePreview ? (
                        <img
                          src={packageImagePreview}
                          alt="Package preview"
                        />
                      ) : (
                        <div className="admin-package-upload-placeholder">
                          <span>Click to upload image</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}