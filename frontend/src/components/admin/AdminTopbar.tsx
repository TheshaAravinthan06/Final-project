"use client";

import { FiBell, FiSearch } from "react-icons/fi";

export default function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-search">
        <FiSearch />
        <input type="text" placeholder="Search dashboard, users, packages..." />
      </div>

      <div className="admin-topbar__right">
        <button type="button" className="admin-topbar__icon-btn">
          <FiBell />
        </button>

        <div className="admin-topbar__profile">
          <div className="admin-topbar__avatar">A</div>
          <div>
            <h4>Admin</h4>
            <p>Trip AI</p>
          </div>
        </div>
      </div>
    </header>
  );
}