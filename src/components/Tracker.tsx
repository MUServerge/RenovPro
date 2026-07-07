"use client";

import { useMemo, useState } from "react";
import {
  addWorkEntry,
  deleteWorkEntry,
  addPayment,
  deletePayment,
  setHourlyRate,
} from "@/lib/actions";
import { eur, fmtDate } from "@/lib/money";
import type { Dict } from "@/lib/i18n/dictionaries";

export type Entry = { id: string; date: string; hours: number; address: string };
export type Pay = { id: string; date: string; amount: number };

function hoursLabel(n: number): string {
  return (n % 1 ? n.toFixed(n % 1 === 0.5 ? 1 : 2) : n.toFixed(0)) + " h";
}

export default function Tracker({
  t,
  rate,
  entries,
  payments,
  targetUserId,
}: {
  t: Dict;
  rate: number;
  entries: Entry[];
  payments: Pay[];
  targetUserId?: string;
}) {
  const [tab, setTab] = useState<"work" | "pay">("work");
  const [modal, setModal] = useState<null | "work" | "pay">(null);

  const totals = useMemo(() => {
    const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
    const days = new Set(entries.map((e) => e.date)).size;
    const salary = hours * rate;
    const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    return { hours, days, salary, paid, balance: salary - paid };
  }, [entries, payments, rate]);

  const addresses = useMemo(
    () => [...new Set(entries.map((e) => e.address).filter(Boolean))],
    [entries],
  );

  const today = new Date().toISOString().slice(0, 10);
  const lastAddr = entries.length ? entries[entries.length - 1].address : "";

  function exportCSV() {
    let csv = `${t.appName} - ${t.tagline}\n`;
    csv += `${t.hourlyRate},${rate}\n\n${t.workJournal}\n${t.date},${t.hours},${t.address},${t.salaryTotal}\n`;
    [...entries]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((x) => {
        csv += `${fmtDate(x.date)},${x.hours},"${(x.address || "").replace(/"/g, '""')}",${(x.hours * rate).toFixed(2)}\n`;
      });
    csv += `${t.hours},${totals.hours.toFixed(2)},,${totals.salary.toFixed(2)}\n`;
    csv += `${t.days},${totals.days}\n\n${t.payments}\n${t.paymentDate},${t.paymentAmount}\n`;
    [...payments]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((x) => {
        csv += `${fmtDate(x.date)},${x.amount.toFixed(2)}\n`;
      });
    csv += `${t.paid},${totals.paid.toFixed(2)}\n${t.balanceDue},${totals.balance.toFixed(2)}\n`;

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `MaysterPRO_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const hidden = targetUserId ? (
    <input type="hidden" name="targetUserId" value={targetUserId} />
  ) : null;

  return (
    <div className="pb-24">
      {/* Rate */}
      <div className="px-3 pt-3">
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
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2.5 px-3 pt-3">
        <div className="rounded-2xl border border-brand-dark/15 bg-brand-green p-3 shadow-card">
          <div className="text-[11px] font-bold tracking-wide text-brand-dark">
            {t.salaryTotal}
          </div>
          <div className="mt-0.5 text-2xl font-extrabold">
            {eur(totals.salary)}
          </div>
        </div>
        <div className="rounded-2xl border border-brand-dark/15 bg-brand-yellow p-3 shadow-card">
          <div className="text-[11px] font-bold tracking-wide text-brand-dark">
            {t.balanceDue}
          </div>
          <div className="mt-0.5 text-2xl font-extrabold">
            {eur(totals.balance)}
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-2.5">
        <MiniStat value={hoursLabel(totals.hours)} label={t.hours} />
        <MiniStat value={String(totals.days)} label={t.days} />
        <MiniStat value={`${Math.round(totals.paid)}€`} label={t.paid} />
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
          entries.length === 0 ? (
            <Empty>{t.noWork}</Empty>
          ) : (
            [...entries]
              .sort((a, b) => (a.date < b.date ? -1 : 1))
              .map((e) => (
                <div key={e.id} className="flex items-center gap-2.5 rounded-xl border border-brand-line bg-white px-3 py-2.5">
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
                  <DeleteBtn action={deleteWorkEntry} id={e.id} hidden={hidden} confirm={t.deleteConfirm} />
                </div>
              ))
          )
        ) : payments.length === 0 ? (
          <Empty>{t.noPay}</Empty>
        ) : (
          [...payments]
            .sort((a, b) => (a.date < b.date ? -1 : 1))
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
                <DeleteBtn action={deletePayment} id={p.id} hidden={hidden} confirm={t.deleteConfirm} />
              </div>
            ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setModal(tab)}
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
          onClick={() => setModal(tab)}
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
            action={modal === "work" ? addWorkEntry : addPayment}
            onSubmit={() => setModal(null)}
            className="w-full animate-sheet-up rounded-t-[20px] bg-white px-4 pb-6 pt-4"
          >
            {hidden}
            <h3 className="mb-3.5 text-[17px] font-bold">
              {modal === "work" ? t.addWorkDay : t.addPayment}
            </h3>
            {modal === "work" ? (
              <>
                <Field label={t.date}>
                  <input name="date" type="date" defaultValue={today} className={inputCls} />
                </Field>
                <Field label={t.hoursLabel}>
                  <input name="hours" type="text" inputMode="decimal" defaultValue="8" placeholder={t.hoursPlaceholder} className={inputCls} />
                </Field>
                <Field label={t.address}>
                  <input name="address" list="addr-list" defaultValue={lastAddr} placeholder={t.addressPlaceholder} className={inputCls} />
                  <datalist id="addr-list">
                    {addresses.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </Field>
              </>
            ) : (
              <>
                <Field label={t.paymentDate}>
                  <input name="date" type="date" defaultValue={today} className={inputCls} />
                </Field>
                <Field label={t.paymentAmount}>
                  <input name="amount" type="text" inputMode="decimal" placeholder="500" className={inputCls} />
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
