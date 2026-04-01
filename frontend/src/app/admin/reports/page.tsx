"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type ReportItem = {
  _id: string;
  reportKind: "place" | "problem";
  reason: string;
  status: string;
  createdAt: string;
  subject?: string;
  message?: string;
  place?: {
    _id: string;
    placeName: string;
    isPublished: boolean;
  } | null;
  reportedBy?: {
    _id: string;
    username: string;
    email: string;
  } | null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get("/admin/reports");
        setReports(res.data.reports || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchReports();
  }, []);

  const handleHidePost = async (placeId?: string) => {
    if (!placeId) return;

    try {
      const res = await api.patch(`/admin/places/${placeId}/visibility`);
      const updatedPlace = res.data?.place;

      setReports((prev) =>
        prev.map((item) =>
          item.place?._id === placeId
            ? {
                ...item,
                place: item.place
                  ? { ...item.place, isPublished: updatedPlace?.isPublished }
                  : item.place,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleBlockUser = async (userId?: string) => {
    if (!userId) return;
    try {
      await api.patch(`/admin/users/${userId}/block`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section className="admin-reports-page">
      <div className="admin-page-head">
        <div>
          <h1>Reports</h1>
          <p>Moderate reported content and user submitted problems from here.</p>
        </div>
      </div>

      <div className="admin-report-list">
        {reports.map((report) => (
          <div key={report._id} className="admin-report-card">
            <div>
              <h4>
                {report.reportKind === "problem"
                  ? report.subject || "Problem report"
                  : report.place?.placeName || "Reported place"}
              </h4>

              {report.reportKind === "problem" ? (
                <p>
                  Sent by {report.reportedBy?.username || "user"} •{" "}
                  {report.message || "No details added"}
                </p>
              ) : (
                <p>
                  Reported by {report.reportedBy?.username || "user"} •{" "}
                  {report.reason || "No reason added"}
                </p>
              )}
            </div>

            <div className="admin-report-actions">
              {report.reportKind === "place" && (
                <button
                  type="button"
                  onClick={() => handleHidePost(report.place?._id)}
                >
                  {report.place?.isPublished ? "Hide Post" : "Show Post"}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleBlockUser(report.reportedBy?._id)}
              >
                Block User
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}