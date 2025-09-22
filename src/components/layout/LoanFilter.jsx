import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { THEME } from "../../theme";

const { colors } = THEME;

export default function LoanFilter({
  users = [],
  value,                // optional controlled value (full filters object)
  onChange,             // when provided, becomes controlled and calls onChange(next)
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const CONTROL_WIDTH = "170px";

  // --------- mode detection ---------
  const controlled = typeof onChange === "function";

  // --------- URL param helpers (URL mode) ---------
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const fromUrl = useMemo(() => {
    const obj = Object.fromEntries(Array.from(params.entries()));
    return {
      year: obj.year ?? "",
      month: obj.month ?? "",
      loan_status: obj.loan_status ?? "",
      member: obj.member ?? "",
      sortBy: obj.sortBy ?? "loan_date",
      order: obj.order ?? "-1",
      perPage: obj.perPage ?? "100",
      page: obj.page ?? "1",
    };
  }, [params]);

  // --------- defaults & current model ---------
  const defaults = {
    year: "",
    month: "",
    loan_status: "",
    member: "",
    sortBy: "loan_date",
    order: "-1",
    perPage: "100",
    page: "1",
  };

  const current = controlled ? { ...defaults, ...(value || {}) } : fromUrl;

  // --------- accordion / outside click ---------
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(e) {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // --------- loading indicator (URL mode only) ---------
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!controlled) setLoading(false);
  }, [location.search, controlled]);

  // --------- update helper (emit full snapshot; DO NOT reset others) ---------
  function emit(patch) {
    const next = { ...current, ...patch, page: "1" };

    if (controlled) {
      onChange?.(next);
      return;
    }

    const qp = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v == null) qp.delete(k);
      else qp.set(k, String(v));
    });
    qp.set("page", "1");

    const scrollPos = window?.scrollY || 0;
    qp.set("scrollPos", String(scrollPos));

    navigate({ pathname: location.pathname, search: qp.toString() }, { replace: true });
    setLoading(true);
  }

  // --------- choices ---------
  const months = [
    { month: "Jan", value: "1" }, { month: "Feb", value: "2" }, { month: "Mar", value: "3" },
    { month: "Apr", value: "4" }, { month: "May", value: "5" }, { month: "Jun", value: "6" },
    { month: "Jul", value: "7" }, { month: "Aug", value: "8" }, { month: "Sep", value: "9" },
    { month: "Oct", value: "10" }, { month: "Nov", value: "11" }, { month: "Dec", value: "12" },
  ];
  const validMonths = months.map((m) => m.value);

  const thisYear = new Date().getFullYear();
  const validYears = [String(thisYear), String(thisYear - 1), String(thisYear - 2), String(thisYear - 3)];

  const validStatus = ["Ended", "Ongoing", "Overdue", "Pending Approval"];
  const validSort = ["loan_amount", "loan_date"];
  const validOrder = ["1", "-1"];
  const validPerPage = ["20", "50", "100", "500"];

  // normalize users list to { value, label }
  const normalizedUsers = (users || []).map((u) => {
    if (typeof u === "string") return { value: u, label: u };
    if (u && typeof u === "object") {
      const value = u._id ?? u.id ?? u.value ?? "";
      const label = u.fullName ?? u.name ?? u.label ?? value;
      return { value, label };
    }
    return { value: "", label: "" };
  });

  // --------- styles ---------
  const shell = { position: "relative", zIndex: 3, width: "100%" };
  const headerBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: colors.white,
    color: colors.navy,
    border: `1px solid rgba(0,0,0,0.08)`,
    borderRadius: 8,
    padding: "6px 12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
    cursor: "pointer",
    fontWeight: 700,
  };
  const panel = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: -115,
    right: 0,
    background: "#fff",
    border: `1px solid rgba(0,0,0,0.06)`,
    borderRadius: 10,
    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
    padding: 12,
  };
  const groupRow = { display: "flex", flexWrap: "wrap", gap: 12 };
  const fieldRow = { display: "flex", flexWrap: "wrap", gap: 10 };
  const label = { fontSize: 13, fontWeight: "bold", color: colors.navy, marginBottom: 6 };
  const select = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    outline: "none",
    background: "#fff",
  };

  // helper: render a temporary option if current value isn't in list
  const MaybeCurrentOption = ({ present, value, text }) =>
    !present && value ? <option value={value}>{text} (current)</option> : null;

  return (
    <div ref={containerRef} style={shell}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        style={headerBtn}
        aria-expanded={open}
        aria-controls="loan-filter-panel"
        title="Filter & Sort Loans"
      >
        <span>Filter & Sort Loans</span>
        {(!controlled && loading) ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0ea5e9", fontWeight: 700 }}>
            <Spinner size={16} />
            refreshing …
          </span>
        ) : (
          <Chevron open={open} />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div id="loan-filter-panel" style={panel}>
          <div style={{ ...groupRow, marginBottom: 10 }}>
            {/* Filters column */}
            <div style={{ ...fieldRow, alignItems: "end" }}>
              {/* YEAR */}
              <div style={{ width: CONTROL_WIDTH }}>
                <div style={label}>Year</div>
                <select
                  value={current.year ?? ""}           // <— always show current
                  onChange={(e) => emit({ year: e.target.value })}
                  style={select}
                >
                  <option value="">All</option>
                  <MaybeCurrentOption present={validYears.includes(current.year)} value={current.year} text={current.year} />
                  {validYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* MONTH */}
              <div style={{ width: CONTROL_WIDTH }}>
                <div style={label}>Month</div>
                <select
                  value={current.month ?? ""}
                  onChange={(e) => emit({ month: e.target.value })}
                  style={select}
                >
                  <option value="">All</option>
                  <MaybeCurrentOption present={validMonths.includes(current.month)} value={current.month} text={current.month} />
                  {months.map((m) => <option key={m.value} value={m.value}>{m.month}</option>)}
                </select>
              </div>

              {/* STATUS */}
              <div style={{ width: CONTROL_WIDTH }}>
                <div style={label}>Status</div>
                <select
                  value={current.loan_status ?? ""}
                  onChange={(e) => emit({ loan_status: e.target.value })}
                  style={select}
                >
                  <option value="">All</option>
                  <MaybeCurrentOption present={validStatus.includes(current.loan_status)} value={current.loan_status} text={current.loan_status} />
                  {validStatus.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* MEMBER */}
              <div style={{ width: CONTROL_WIDTH }}>
                <div style={label}>Member</div>
                <select
                  value={current.member ?? ""}
                  onChange={(e) => emit({ member: e.target.value })}
                  style={select}
                >
                  <option value="">All</option>
                  <MaybeCurrentOption
                    present={normalizedUsers.some((u) => u.value === current.member)}
                    value={current.member}
                    text={current.member}
                  />
                  {normalizedUsers.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>

              {/* SORT BY */}
              <div style={{ width: CONTROL_WIDTH }}>
                <div style={label}>Sort By</div>
                <select
                  value={current.sortBy ?? "loan_date"}
                  onChange={(e) => emit({ sortBy: e.target.value })}
                  style={select}
                >
                  <MaybeCurrentOption present={validSort.includes(current.sortBy)} value={current.sortBy} text={current.sortBy} />
                  <option value="loan_date">Date</option>
                  <option value="loan_amount">Amount</option>
                </select>
              </div>

              {/* ORDER */}
              <div style={{ width: CONTROL_WIDTH }}>
                <div style={label}>Order</div>
                <select
                  value={current.order ?? "-1"}
                  onChange={(e) => emit({ order: e.target.value })}
                  style={select}
                >
                  <MaybeCurrentOption present={validOrder.includes(current.order)} value={current.order} text={current.order} />
                  <option value="-1">DESC</option>
                  <option value="1">ASC</option>
                </select>
              </div>

              {/* PER PAGE */}
              <div style={{ width: CONTROL_WIDTH }}>
                <div style={label}>Per Page</div>
                <select
                  value={current.perPage ?? "100"}
                  onChange={(e) => emit({ perPage: e.target.value })}
                  style={select}
                >
                  <MaybeCurrentOption present={validPerPage.includes(current.perPage)} value={current.perPage} text={current.perPage} />
                  {validPerPage.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Tiny helper icons */
function Chevron({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease", color: "#475569" }}>
      <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6l-6-6z" />
    </svg>
  );
}

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="50" cy="50" r="35" stroke="#0ea5e9" strokeWidth="10" fill="none" opacity="0.25" />
      <path d="M50 15 a35 35 0 0 1 0 70" stroke="#0ea5e9" strokeWidth="10" fill="none" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
