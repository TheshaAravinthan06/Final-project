"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type ReportItem = {
  _id: string;
  reason: string;
  status: string;
  createdAt: string;
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
      await api.patch(`/admin/places/${placeId}/hide`);
      setReports((prev) =>
        prev.map((item) =>
          item.place?._id === placeId
            ? { ...item, place: { ...item.place, isPublished: false } }
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
          <p>Moderate reported posts and users from here.</p>
        </div>
      </div>

      <div className="admin-report-list">
        {reports.map((report) => (
          <div key={report._id} className="admin-report-card">
            <div>
              <h4>{report.place?.placeName || "Reported place"}</h4>
              <p>
                Reported by {report.reportedBy?.username || "user"} • {report.reason || "No reason added"}
              </p>
            </div>

            <div className="admin-report-actions">
              <button type="button" onClick={() => handleHidePost(report.place?._id)}>
                {report.place?.isPublished ? "Hide Post" : "Already Hidden"}
              </button>
              <button type="button" onClick={() => handleBlockUser(report.reportedBy?._id)}>
                Block User
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}