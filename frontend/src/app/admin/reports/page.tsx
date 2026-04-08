"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

type ReportItem = {
  _id: string;
  reportKind: "place" | "problem" | "content";
  reportType: "place" | "problem" | "user_post" | "blog" | "user_account";
  reason?: string;
  details?: string;
  status: string;
  createdAt: string;
  subject?: string;
  message?: string;
  entityId?: string;
  place?: {
    _id: string;
    placeName: string;
    isPublished: boolean;
  } | null;
  reportedBy?: {
    _id: string;
    username: string;
    email?: string;
  } | null;
  targetUser?: {
    _id: string;
    username: string;
    email?: string;
  } | null;
};

const getReportTitle = (report: ReportItem) => {
  if (report.reportKind === "problem") return report.subject || "Problem report";
  if (report.reportKind === "place") return report.place?.placeName || "Reported place";
  if (report.reportType === "user_post") return "Reported user post";
  if (report.reportType === "blog") return "Reported blog";
  return "Reported account";
};

const getReportDescription = (report: ReportItem) => {
  if (report.reportKind === "problem") {
    return `Sent by ${report.reportedBy?.username || "user"} • ${report.message || "No details added"}`;
  }

  if (report.reportKind === "place") {
    return `Reported by ${report.reportedBy?.username || "user"} • ${report.reason || "No reason added"}`;
  }

  const contentTypeLabel =
    report.reportType === "user_post"
      ? "post"
      : report.reportType === "blog"
      ? "blog"
      : "account";

  return `Reported by ${report.reportedBy?.username || "user"} against ${report.targetUser?.username || "user"} • ${report.reason || `Reported ${contentTypeLabel}`}${report.details ? ` • ${report.details}` : ""}`;
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
              <h4>{getReportTitle(report)}</h4>
              <p>{getReportDescription(report)}</p>
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
                onClick={() =>
                  handleBlockUser(report.targetUser?._id || report.reportedBy?._id)
                }
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
