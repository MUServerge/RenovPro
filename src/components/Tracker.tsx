"use client";

import { useMemo, useState } from "react";
import {
  addWorkEntry,
  updateWorkEntry,
  deleteWorkEntry,
  addPayment,
  updatePayment,
  deletePayment,
  setHourlyRate,
} from "@/lib/actions";
import { eur, fmtDate } from "@/lib/money";
import { photosEnabled, uploadPhoto } from "@/lib/photo-upload";
import type { Dict } from "@/lib/i18n/dictionaries";

export type Entry = {
  id: string;
  date: string;
  hours: number;
  address: string;
  photoUrl?: string;
};
export type Pay = { id: string; date: string; amount: number };

function monthLabel(ym: string, names: string[]): string {
  const [y, m] = ym.split("-");
  return `${names[Number(m) - 1] ?? m} ${y}`;
}

function summarize(entries: Entry[], payments: Pay[], rate: number) {
  const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const days = new Set(entries.map((e) => e.date)).size;
  const salary = hours * rate;
  const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  return { hours, days, salary, paid, balance: salary - paid };
}

function hoursLabel(n: number): string {
  return (n % 1 ? n.toFixed(n % 1 === 0.5 ? 1 : 2) : n.toFixed(0)) + " h";
}

export default function Tracker({
  t,
  rate,
  entries,
  payments,
  targetUserId,
  isAdmin = false,
}: {
  t: Dict;
  rate: number;
  entries: Entry[];
  payments: Pay[];
  targetUserId?: string;
  isAdmin?: boolean;
}) {
  const [tab, setTab] = useState<"work" | "pay">("work");
  const [modal, setModal] = useState<null | "work" | "pay">(null);
  const [editItem, setEditItem] = useState<Entry | Pay | null>(null);
  const [photo, setPhoto] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  function openModal(kind: "work" | "pay") {
    setEditItem(null);
    setPhoto("");
    setModal(kind);
  }

  function openEditWork(e: Entry) {
    setEditItem(e);
    setPhoto(e.photoUrl ?? "");
    setModal("work");
  }

  function openEditPay(p: Pay) {
    setEditItem(p);
    setModal("pay");
  }

  const editWork = modal === "work" ? (editItem as Entry | null) : null;
  const editPay = modal === "pay" ? (editItem as Pay | null) : null;

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setPhoto(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState<string>(currentMonth);

  // All-time totals — the balance due carries over from month to month.
  const totals = useMemo(
    () => summarize(entries, payments, rate),
    [entries, payments, rate],
  );

  // Every month that has data, plus the current one, newest first.
  const months = useMemo(() => {
    const set = new Set<string>([currentMonth, month]);
    entries.forEach((e) => set.add(e.date.slice(0, 7)));
    payments.forEach((p) => set.add(p.date.slice(0, 7)));
    return [...set].sort((a, b) => (a > b ? -1 : 1));
  }, [entries, payments, currentMonth, month]);

  const monthEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(month)),
    [entries, month],
  );
  const monthPays = useMemo(
    () => payments.filter((p) => p.date.startsWith(month)),
    [payments, month],
  );
  const monthTotals = useMemo(
    () => summarize(monthEntries, monthPays, rate),
    [monthEntries, monthPays, rate],
  );

  const history = useMemo(
    () =>
      months.map((m) => ({
        month: m,
        ...summarize(
          entries.filter((e) => e.date.startsWith(m)),
          payments.filter((p) => p.date.startsWith(m)),
          rate,
        ),
      })),
    [months, entries, payments, rate],
  );

  const monthIdx = months.indexOf(month);
  const olderMonth = months[monthIdx + 1];
  const newerMonth = monthIdx > 0 ? months[monthIdx - 1] : undefined;
  const isCurrent = month === currentMonth;
  const defaultDate = isCurrent ? today : `${month}-01`;

  const addresses = useMemo(
    () => [...new Set(entries.map((e) => e.address).filter(Boolean))],
    [entries],
  );

  const lastAddr = entries.length ? entries[entries.length - 1].address : "";

  function exportCSV() {
    let csv = `${t.appName} - ${t.tagline}\n`;
    csv += `${t.month},${monthLabel(month, t.monthNames)}\n`;
    csv += `${t.hourlyRate},${rate}\n\n${t.workJournal}\n${t.date},${t.hours},${t.address},${t.salaryTotal}\n`;
    [...monthEntries]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((x) => {
        csv += `${fmtDate(x.date)},${x.hours},"${(x.address || "").replace(/"/g, '""')}",${(x.hours * rate).toFixed(2)}\n`;
      });
    csv += `${t.hours},${monthTotals.hours.toFixed(2)},,${monthTotals.salary.toFixed(2)}\n`;
    csv += `${t.days},${monthTotals.days}\n\n${t.payments}\n${t.paymentDate},${t.paymentAmount}\n`;
    [...monthPays]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((x) => {
        csv += `${fmtDate(x.date)},${x.amount.toFixed(2)}\n`;
      });
    csv += `${t.paid},${monthTotals.paid.toFixed(2)}\n`;
    csv += `${t.balanceDue} (${t.totalBalanceHint}),${totals.balance.toFixed(2)}\n`;

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `MaysterPRO_${month}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const hidden = targetUserId ? (
    <input type="hidden" name="targetUserId" value={targetUserId} />
  ) : null;

  return (
    <div className="pb-24">
      {/* Rate — editable by admin only, read-only for the worker */}
      <div className="px-3 pt-3">
        {isAdmin ? (
          <form
            action={setHourlyRate}
            className="flex items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-3 py-2.5"
          >
            {hidden}
            <label className="text-sm font-semibold text-brand-txt">
              {t.hourlyRate}
            </label>
            <input
              name="rate"
              type="text"
              inputMode="decimal"
              defaultValue={rate}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              className="w-20 rounded-lg bg-brand-yellow px-2 py-1.5 text-center text-base font-extrabold text-brand-dark outline-none"
            />
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-3 py-2.5">
            <span className="text-sm font-semibold text-brand-txt">
              {t.hourlyRate}
            </span>
            <span className="w-20 rounded-lg bg-[#eef1f5] px-2 py-1.5 text-center text-base font-extrabold text-brand-dark">
              {rate}
            </span>
          </div>
        )}
      </div>

      {/* Month navigator */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-brand-line bg-white px-2 py-2">
          <button
            type="button"
            onClick={() => olderMonth && setMonth(olderMonth)}
            disabled={!olderMonth}
            className="h-9 w-9 flex-none rounded-lg bg-brand-light text-lg font-bold text-brand-dark disabled:opacity-30"
            aria-label="previous month"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="truncate text-base font-extrabold text-brand-dark">
              {monthLabel(month, t.monthNames)}
            </div>
            <div
              className={`text-[11px] font-bold ${isCurrent ? "text-[#2e8b57]" : "text-brand-muted"}`}
            >
              {isCurrent ? `● ${t.thisMonth}` : `🔒 ${t.monthClosed}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => newerMonth && setMonth(newerMonth)}
            disabled={!newerMonth}
            className="h-9 w-9 flex-none rounded-lg bg-brand-light text-lg font-bold text-brand-dark disabled:opacity-30"
            aria-label="next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2.5 px-3 pt-3">
        <div className="rounded-2xl border border-brand-dark/15 bg-brand-green p-3 shadow-card">
          <div className="text-[11px] font-bold tracking-wide text-brand-dark">
            {t.monthSalary}
          </div>
          <div className="mt-0.5 text-2xl font-extrabold">
            {eur(monthTotals.salary)}
          </div>
        </div>
        <div className="rounded-2xl border border-brand-dark/15 bg-brand-yellow p-3 shadow-card">
          <div className="text-[11px] font-bold tracking-wide text-brand-dark">
            {t.balanceDue}
          </div>
          <div className="mt-0.5 text-2xl font-extrabold">
            {eur(totals.balance)}
          </div>
          <div className="text-[10px] font-semibold text-brand-dark/70">
            {t.totalBalanceHint}
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-2.5">
        <MiniStat value={hoursLabel(monthTotals.hours)} label={t.hours} />
        <MiniStat value={String(monthTotals.days)} label={t.days} />
        <MiniStat value={`${Math.round(monthTotals.paid)}€`} label={t.paid} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-3">
        <TabButton active={tab === "work"} onClick={() => setTab("work")}>
          {t.workJournal}
        </TabButton>
        <TabButton active={tab === "pay"} onClick={() => setTab("pay")}>
          {t.payments}
        </TabButton>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 px-3">
        {tab === "work" ? (
          monthEntries.length === 0 ? (
            <Empty>{t.noWork}</Empty>
          ) : (
            [...monthEntries]
              .sort((a, b) => (a.date > b.date ? -1 : 1))
              .map((e) => (
                <div key={e.id} className="flex items-center gap-2.5 rounded-xl border border-brand-line bg-white px-3 py-2.5">
                  {e.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a href={e.photoUrl} target="_blank" rel="noreferrer" className="shrink-0">
                      <img
                        src={e.photoUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-brand-line object-cover"
                      />
                    </a>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-brand-muted">
                      {fmtDate(e.date)}
                    </div>
                    <div className="truncate text-[15px] font-semibold">
                      {e.address || "—"} · {hoursLabel(e.hours)}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-[15px] font-extrabold text-brand-dark">
                    {eur(e.hours * rate)}
                  </div>
                  <EditBtn onClick={() => openEditWork(e)} label={t.edit} />
                  <DeleteBtn action={deleteWorkEntry} id={e.id} hidden={hidden} confirm={t.deleteConfirm} />
                </div>
              ))
          )
        ) : monthPays.length === 0 ? (
          <Empty>{t.noPay}</Empty>
        ) : (
          [...monthPays]
            .sort((a, b) => (a.date > b.date ? -1 : 1))
            .map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 rounded-xl border border-brand-line bg-white px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-brand-muted">{t.payment}</div>
                  <div className="text-[15px] font-semibold">
                    {fmtDate(p.date)}
                  </div>
                </div>
                <div className="whitespace-nowrap text-[15px] font-extrabold text-[#2e8b57]">
                  + {eur(p.amount)}
                </div>
                <EditBtn onClick={() => openEditPay(p)} label={t.edit} />
                <DeleteBtn action={deletePayment} id={p.id} hidden={hidden} confirm={t.deleteConfirm} />
              </div>
            ))
        )}
      </div>

      {/* Month history — every month stays saved and can be reopened */}
      {history.length > 1 && (
        <div className="px-3 pt-5">
          <div className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-brand-muted">
            {t.monthHistory}
          </div>
          <div className="flex flex-col gap-1.5">
            {history.map((h) => (
              <button
                key={h.month}
                type="button"
                onClick={() => {
                  setMonth(h.month);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${
                  h.month === month
                    ? "border-brand-dark bg-brand-light"
                    : "border-brand-line bg-white"
                }`}
              >
                <span className="w-5 flex-none text-sm">
                  {h.month === currentMonth ? "●" : "🔒"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">
                    {monthLabel(h.month, t.monthNames)}
                  </div>
                  <div className="text-xs text-brand-muted">
                    {hoursLabel(h.hours)} · {h.days} {t.days.toLowerCase()} ·{" "}
                    {t.paid.toLowerCase()} {Math.round(h.paid)}€
                  </div>
                </div>
                <div className="whitespace-nowrap text-[15px] font-extrabold text-brand-dark">
                  {eur(h.salary)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => openModal(tab)}
        className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-brand-med text-3xl text-white shadow-[0_4px_14px_rgba(46,117,182,.5)]"
        aria-label={t.addEntry}
      >
        +
      </button>

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2.5 border-t border-brand-line bg-white p-3">
        <button
          onClick={exportCSV}
          className="flex-1 rounded-xl border border-brand-dark bg-white py-3 text-sm font-bold text-brand-dark"
        >
          ⬇ {t.exportCsv}
        </button>
        <button
          onClick={() => openModal(tab)}
          className="flex-1 rounded-xl bg-brand-dark py-3 text-sm font-bold text-white"
        >
          + {t.addEntry}
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/45"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <form
            action={
              modal === "work"
                ? editWork
                  ? updateWorkEntry
                  : addWorkEntry
                : editPay
                  ? updatePayment
                  : addPayment
            }
            onSubmit={(ev) => {
              // Jump to the month of the saved date so the new row is visible.
              const d = new FormData(ev.currentTarget).get("date");
              if (typeof d === "string" && /^\d{4}-\d{2}/.test(d)) {
                setMonth(d.slice(0, 7));
              }
              setModal(null);
            }}
            className="w-full animate-sheet-up rounded-t-[20px] bg-white px-4 pb-6 pt-4"
          >
            {hidden}
            {editItem && (
              <input type="hidden" name="id" value={(editItem as { id: string }).id} />
            )}
            <h3 className="mb-3.5 text-[17px] font-bold">
              {editItem
                ? t.edit
                : modal === "work"
                  ? t.addWorkDay
                  : t.addPayment}
            </h3>
            {modal === "work" ? (
              <>
                <Field label={t.date}>
                  <input name="date" type="date" defaultValue={editWork?.date ?? defaultDate} className={inputCls} />
                </Field>
                <Field label={t.hoursLabel}>
                  <input name="hours" type="text" inputMode="decimal" defaultValue={editWork ? String(editWork.hours) : "8"} placeholder={t.hoursPlaceholder} className={inputCls} />
                </Field>
                <Field label={t.address}>
                  <input name="address" list="addr-list" defaultValue={editWork ? editWork.address : lastAddr} placeholder={t.addressPlaceholder} className={inputCls} />
                  <datalist id="addr-list">
                    {addresses.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </Field>
                {photosEnabled() && (
                  <Field label={t.photo}>
                    <input type="hidden" name="photoUrl" value={photo} />
                    {photo ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt="" className="h-16 w-16 rounded-lg border border-brand-line object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhoto("")}
                          className="rounded-lg bg-[#fbe9e9] px-3 py-1.5 text-sm font-semibold text-brand-danger"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={uploading}
                        onChange={(e) => onPickPhoto(e.target.files?.[0])}
                        className={inputCls}
                      />
                    )}
                    {uploading && (
                      <div className="mt-1 text-xs text-brand-muted">…</div>
                    )}
                  </Field>
                )}
              </>
            ) : (
              <>
                <Field label={t.paymentDate}>
                  <input name="date" type="date" defaultValue={editPay?.date ?? defaultDate} className={inputCls} />
                </Field>
                <Field label={t.paymentAmount}>
                  <input name="amount" type="text" inputMode="decimal" defaultValue={editPay ? String(editPay.amount) : ""} placeholder="500" className={inputCls} />
                </Field>
              </>
            )}
            <div className="mt-1.5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl bg-[#eef1f5] py-3 font-bold"
              >
                {t.cancel}
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-brand-dark py-3 font-bold text-white">
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-brand-line p-3 text-base outline-none focus:border-brand-med";

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-brand-line bg-white px-1 py-2 text-center shadow-card">
      <div className="text-[15px] font-extrabold text-brand-dark">{value}</div>
      <div className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wide text-brand-muted">
        {label}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold ${
        active
          ? "border-brand-dark bg-brand-dark text-white"
          : "border-brand-line bg-white text-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-6 text-center text-sm text-brand-muted">
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold text-brand-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function EditBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 w-8 flex-none rounded-lg bg-brand-light text-sm font-bold text-brand-dark"
      aria-label={label}
      title={label}
    >
      ✎
    </button>
  );
}

function DeleteBtn({
  action,
  id,
  hidden,
  confirm,
}: {
  action: (formData: FormData) => void;
  id: string;
  hidden: React.ReactNode;
  confirm: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {hidden}
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="h-8 w-8 flex-none rounded-lg bg-[#fbe9e9] text-base font-bold text-brand-danger"
        aria-label="delete"
      >
        ×
      </button>
    </form>
  );
}
