"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
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
  // Controlled so the quick-pick chips can fill them.
  const [hoursVal, setHoursVal] = useState("8");
  const [addrVal, setAddrVal] = useState("");

  // Most recent entry (by date, then by insertion order).
  const lastEntry = useMemo(
    () =>
      entries.reduce<Entry | undefined>(
        (best, e) => (!best || e.date >= best.date ? e : best),
        undefined,
      ),
    [entries],
  );

  function openModal(kind: "work" | "pay") {
    setEditItem(null);
    setPhoto("");
    setHoursVal(lastEntry ? String(lastEntry.hours) : "8");
    setAddrVal(lastEntry?.address ?? "");
    setModal(kind);
  }

  function openEditWork(e: Entry) {
    setEditItem(e);
    setPhoto(e.photoUrl ?? "");
    setHoursVal(String(e.hours));
    setAddrVal(e.address);
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

  // Up to 4 most recently used addresses, newest first — shown as chips.
  const recentAddrs = useMemo(() => {
    const out: string[] = [];
    [...entries]
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .forEach((e) => {
        if (e.address && !out.includes(e.address) && out.length < 4)
          out.push(e.address);
      });
    return out;
  }, [entries]);

  // "Same as last day" is offered when today is still empty.
  const canRepeat =
    isCurrent && !!lastEntry && !entries.some((e) => e.date === today);

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
      {/* Summary card — month navigator, month salary, balance, stats & rate */}
      <div className="px-3 pt-3">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark to-[#2a5f8f] text-white shadow-card">
          {/* Month navigator */}
          <div className="flex items-center gap-1 px-2 pt-2">
            <button
              type="button"
              onClick={() => olderMonth && setMonth(olderMonth)}
              disabled={!olderMonth}
              className="h-8 w-8 flex-none rounded-lg bg-white/10 text-lg font-bold disabled:opacity-25"
              aria-label="previous month"
            >
              ‹
            </button>
            <div className="min-w-0 flex-1 text-center leading-tight">
              <div className="truncate text-[15px] font-extrabold">
                {monthLabel(month, t.monthNames)}
              </div>
              <div
                className={`text-[10px] font-bold ${isCurrent ? "text-[#9be3b5]" : "text-white/60"}`}
              >
                {isCurrent ? `● ${t.thisMonth}` : `🔒 ${t.monthClosed}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => newerMonth && setMonth(newerMonth)}
              disabled={!newerMonth}
              className="h-8 w-8 flex-none rounded-lg bg-white/10 text-lg font-bold disabled:opacity-25"
              aria-label="next month"
            >
              ›
            </button>
          </div>

          {/* Month salary + all-time balance */}
          <div className="flex items-end justify-between gap-3 px-4 pb-3 pt-2.5">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-white/70">
                {t.monthSalary}
              </div>
              <div className="truncate text-[26px] font-extrabold leading-tight">
                {eur(monthTotals.salary)}
              </div>
            </div>
            <div className="min-w-0 rounded-xl bg-brand-yellow px-2.5 py-1.5 text-right text-brand-dark">
              <div className="truncate text-[10px] font-bold leading-tight">
                {t.balanceDue}
              </div>
              <div className="truncate text-base font-extrabold leading-tight">
                {eur(totals.balance)}
              </div>
              <div className="truncate text-[9px] font-semibold leading-tight opacity-70">
                {t.totalBalanceHint}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-white/15 border-t border-white/15 bg-black/10">
            <Stat value={hoursLabel(monthTotals.hours)} label={t.hours} />
            <Stat value={String(monthTotals.days)} label={t.days} />
            <Stat value={`${Math.round(monthTotals.paid)}€`} label={t.paid} />
            {isAdmin ? (
              <form action={setHourlyRate} className="px-1 py-2 text-center">
                {hidden}
                <div className="flex items-baseline justify-center">
                  <input
                    name="rate"
                    type="text"
                    inputMode="decimal"
                    defaultValue={rate}
                    onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    aria-label={t.hourlyRate}
                    style={{ width: `${Math.max(String(rate).length, 2) + 0.5}ch` }}
                    className="rounded-none border-b-2 border-dashed border-brand-yellow bg-transparent text-center text-[15px] font-extrabold text-brand-yellow outline-none focus:bg-white/10"
                  />
                  <span className="text-[13px] font-extrabold text-brand-yellow">€</span>
                </div>
                <div className="mt-0.5 truncate text-[9.5px] font-bold uppercase tracking-wide text-white/60">
                  {t.rate} ✎
                </div>
              </form>
            ) : (
              <Stat value={`${rate}€`} label={t.rate} />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-3 mb-2.5 mt-3 flex gap-1 rounded-xl border border-brand-line bg-white p-1">
        <TabButton active={tab === "work"} onClick={() => setTab("work")}>
          {t.workJournal}
        </TabButton>
        <TabButton active={tab === "pay"} onClick={() => setTab("pay")}>
          {t.payments}
        </TabButton>
      </div>

      {/* List — compact 3-column grid; tap a card to edit or delete it */}
      <div className="px-3">
        {tab === "work" && canRepeat && lastEntry && (
          <form action={addWorkEntry} className="mb-2">
            {hidden}
            <input type="hidden" name="date" value={today} />
            <input type="hidden" name="hours" value={String(lastEntry.hours)} />
            <input type="hidden" name="address" value={lastEntry.address} />
            <RepeatButton
              title={t.repeatToday}
              detail={`${lastEntry.address || "—"} · ${hoursLabel(lastEntry.hours)}`}
            />
          </form>
        )}
        {tab === "work" ? (
          monthEntries.length === 0 ? (
            <Empty>{t.noWork}</Empty>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[...monthEntries]
                .sort((a, b) => (a.date > b.date ? -1 : 1))
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => openEditWork(e)}
                    className="flex min-w-0 flex-col rounded-xl border border-brand-line bg-white px-2 py-1.5 text-left shadow-card active:bg-brand-light"
                  >
                    <DayHead date={e.date} t={t} photo={!!e.photoUrl} />
                    <div className="text-[15px] font-extrabold leading-tight text-brand-dark">
                      {hoursLabel(e.hours)}
                    </div>
                    <div className="truncate text-[11px] text-brand-muted">
                      {e.address || "—"}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-bold text-brand-txt">
                      {eur(e.hours * rate)}
                    </div>
                  </button>
                ))}
            </div>
          )
        ) : monthPays.length === 0 ? (
          <Empty>{t.noPay}</Empty>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[...monthPays]
              .sort((a, b) => (a.date > b.date ? -1 : 1))
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openEditPay(p)}
                  className="flex min-w-0 flex-col rounded-xl border border-brand-line bg-white px-2 py-1.5 text-left shadow-card active:bg-brand-light"
                >
                  <DayHead date={p.date} t={t} />
                  <div className="truncate text-[15px] font-extrabold leading-tight text-[#2e8b57]">
                    +{eur(p.amount)}
                  </div>
                  <div className="truncate text-[11px] text-brand-muted">
                    {t.payment}
                  </div>
                </button>
              ))}
          </div>
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
          <div className="w-full animate-sheet-up rounded-t-[20px] bg-white px-4 pb-6 pt-4">
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
                  <input name="hours" type="text" inputMode="decimal" value={hoursVal} onChange={(e) => setHoursVal(e.target.value)} placeholder={t.hoursPlaceholder} className={inputCls} />
                  <div className="mt-1.5 flex gap-1.5">
                    {["4", "6", "7", "8", "9", "10"].map((h) => (
                      <Chip key={h} active={hoursVal.replace(",", ".") === h} onClick={() => setHoursVal(h)}>
                        {h}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <Field label={t.address}>
                  <input name="address" list="addr-list" value={addrVal} onChange={(e) => setAddrVal(e.target.value)} placeholder={t.addressPlaceholder} className={inputCls} />
                  {recentAddrs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {recentAddrs.map((a) => (
                        <Chip key={a} active={addrVal === a} onClick={() => setAddrVal(a)} wide>
                          {a}
                        </Chip>
                      ))}
                    </div>
                  )}
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
          {editItem && (
            <form
              action={modal === "work" ? deleteWorkEntry : deletePayment}
              onSubmit={(ev) => {
                if (!window.confirm(t.deleteConfirm)) ev.preventDefault();
                else setModal(null);
              }}
              className="mt-2.5"
            >
              {hidden}
              <input type="hidden" name="id" value={(editItem as { id: string }).id} />
              <button
                type="submit"
                className="w-full rounded-xl bg-[#fbe9e9] py-3 font-bold text-brand-danger"
              >
                🗑 {t.delete}
              </button>
            </form>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-brand-line p-3 text-base outline-none focus:border-brand-med";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 px-1 py-2 text-center">
      <div className="truncate text-[15px] font-extrabold">{value}</div>
      <div className="mt-0.5 truncate text-[9.5px] font-bold uppercase tracking-wide text-white/60">
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
      className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
        active ? "bg-brand-dark text-white shadow-card" : "text-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  wide = false,
  children,
}: {
  active: boolean;
  onClick: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${wide ? "max-w-[48%] truncate px-2.5" : "flex-1"} rounded-lg border py-1.5 text-sm font-bold ${
        active
          ? "border-brand-dark bg-brand-dark text-white"
          : "border-brand-line bg-[#f5f7fa] text-brand-dark"
      }`}
    >
      {children}
    </button>
  );
}

function RepeatButton({ title, detail }: { title: string; detail: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-brand-med bg-white px-3 py-2 text-left disabled:opacity-50"
    >
      <span className="text-lg text-brand-med">{pending ? "…" : "↻"}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-brand-dark">{title}</span>
        <span className="block truncate text-xs text-brand-muted">{detail}</span>
      </span>
      <span className="rounded-lg bg-brand-dark px-2.5 py-1 text-xs font-bold text-white">+</span>
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

function DayHead({
  date,
  t,
  photo = false,
}: {
  date: string;
  t: Dict;
  photo?: boolean;
}) {
  const [y, m, d] = date.split("-").map(Number);
  const wd = t.weekdays[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-extrabold leading-none text-brand-dark">
        {d}
      </span>
      <span className="truncate text-[10px] font-semibold uppercase text-brand-muted">
        {wd}
      </span>
      {photo && <span className="ml-auto text-[11px]">📷</span>}
    </div>
  );
}
