"use client";

import { useMemo, useState } from "react";

type ReviewRoute = {
  name: string;
  grade: string;
  gradeBand: string;
  region: string;
  area: string;
  crag: string;
  sector: string;
  wall: string;
  number: number;
  page: number;
  rowKey: string;
  sourceImage: string;
  ocrStatus: string;
  canonicalExactMatch: string;
  canonicalGrade: string;
  gradeAlignment: string;
  reviewDecision: string;
  confidence: number;
  sourceApproval: string;
  reconciliationStatus: string;
  requiredAction: string;
  verificationStatus: string;
};

type Filter = "all" | "master" | "conflict" | "ocr";

export function ReviewPreview({ routes }: { routes: ReviewRoute[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [crag, setCrag] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");

  const regions = useMemo(() => [...new Set(routes.map((route) => route.region))].sort(), [routes]);
  const crags = useMemo(() => [...new Set(routes.filter((route) => region === "all" || route.region === region).map((route) => route.crag))].sort(), [routes, region]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return routes.filter((route) => {
      const text = `${route.name} ${route.crag} ${route.sector} ${route.grade} ${route.number}`.toLocaleLowerCase();
      const kind = filter === "all"
        || (filter === "master" && route.reconciliationStatus === "EXISTING_ALIGNED_NO_CHANGE")
        || (filter === "conflict" && route.reconciliationStatus === "GRADE_CONFLICT_HOLD")
        || (filter === "ocr" && route.reconciliationStatus === "OCR_HOLD");
      return (!needle || text.includes(needle))
        && (region === "all" || route.region === region)
        && (crag === "all" || route.crag === crag)
        && kind;
    });
  }, [routes, query, region, crag, filter]);

  const exact = routes.filter((route) => route.reconciliationStatus === "EXISTING_ALIGNED_NO_CHANGE").length;
  const conflicts = routes.filter((route) => route.reconciliationStatus === "GRADE_CONFLICT_HOLD").length;
  const ocr = routes.filter((route) => route.reconciliationStatus === "OCR_HOLD").length;

  function chooseRegion(value: string) {
    setRegion(value);
    setCrag("all");
  }

  return (
    <>
      <div className="review-alert" role="status">
        <span className="review-alert-dot" aria-hidden="true" />
        <div><strong>Approved source reconciliation</strong><small>Draft PR overlay · canonical master unchanged · not deployed</small></div>
      </div>

      <section className="review-hero">
        <div>
          <div className="eyebrow">Guidebook reconciliation · 2026-08-01</div>
          <h1>Review the approved source batch before a canonical import.</h1>
          <p>Every row keeps its guidebook page, source image, and deterministic reconciliation state. Approval covers this GitHub review package—not a master overwrite or production publication.</p>
        </div>
        <div className="review-actions">
          <a className="btn btn-forest" href="/review/Vertical_Moment_Reconciliation_Approved_2026-08-01.xlsx" download>Download reconciliation workbook</a>
          <a className="btn btn-ghost" href="/review/website-review-routes.json" download>Download review JSON</a>
        </div>
      </section>

      <section className="review-kpis" aria-label="Review batch summary">
        <button className={filter === "all" ? "review-kpi on" : "review-kpi"} onClick={() => setFilter("all")}><b>{routes.length}</b><span>staged routes</span><small>from numeric route lists</small></button>
        <button className={filter === "master" ? "review-kpi on" : "review-kpi"} onClick={() => setFilter("master")}><b>{exact}</b><span>aligned matches</span><small>no canonical change needed</small></button>
        <button className={filter === "conflict" ? "review-kpi risk on" : "review-kpi risk"} onClick={() => setFilter("conflict")}><b>{conflicts}</b><span>grade conflicts</span><small>guidebook vs canonical</small></button>
        <button className={filter === "ocr" ? "review-kpi warn on" : "review-kpi warn"} onClick={() => setFilter("ocr")}><b>{ocr}</b><span>OCR checks</span><small>close source review needed</small></button>
      </section>

      <section className="card review-controls" aria-label="Review route filters">
        <label><span>Search</span><input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Route name, crag, grade or number" /></label>
        <label><span>Region</span><select className="sel" value={region} onChange={(event) => chooseRegion(event.target.value)}><option value="all">All regions</option>{regions.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Crag</span><select className="sel" value={crag} onChange={(event) => setCrag(event.target.value)}><option value="all">All crags</option>{crags.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button className="btn btn-ghost review-clear" onClick={() => { setQuery(""); setRegion("all"); setCrag("all"); setFilter("all"); }}>Clear</button>
      </section>

      <div className="review-result-head"><div><b>{visible.length}</b> routes shown</div><span>Source approved · publication held</span></div>
      <section className="review-list" aria-live="polite">
        {visible.map((route) => (
          <article className="card review-route" key={`${route.rowKey}-${route.number}`}>
            <div className="review-number">{route.number}</div>
            <div className="review-route-main">
              <div className="review-route-title"><h2>{route.name}</h2><span className="review-grade">{route.grade}</span></div>
              <div className="review-location">{route.region} <i>›</i> {route.crag} <i>›</i> {route.sector}</div>
              <div className="review-evidence"><span>Page {route.page}</span><span>{route.sourceImage}</span><span>{route.confidence}% transcription confidence</span></div>
            </div>
            <div className="review-compare">
              {route.canonicalExactMatch === "Yes" ? (
                <span className={route.gradeAlignment === "Grade differs" ? "compare-pill conflict" : "compare-pill aligned"}>
                  {route.gradeAlignment === "Grade differs" ? `Master grade ${route.canonicalGrade}` : "Master match aligned"}
                </span>
              ) : <span className="compare-pill new">No exact master key</span>}
              {route.ocrStatus === "Review required" && <span className="compare-pill ocr">Check source text</span>}
              <small>{route.reconciliationStatus.replaceAll("_", " ")}</small>
              <small>{route.requiredAction}</small>
            </div>
          </article>
        ))}
        {!visible.length && <div className="card review-empty"><h2>No rows match these filters.</h2><p>Clear a filter or try a broader route name.</p></div>}
      </section>
    </>
  );
}
