import React from 'react';

export function GlobalStyles() {
  return (
    <style>{`
      .rdpk{font-family:'Segoe UI',system-ui,sans-serif;color:#0F172A;background:#FAFBFC;min-height:100%;}
      .rdpk *{box-sizing:border-box;}
      .rdpk button,.rdpk input,.rdpk select,.rdpk textarea{font-family:inherit;}

      .rdpk-page{padding:16px;}
      @media (max-width:560px){.rdpk-page{padding:10px;}}

      .rdpk-header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;}
      .rdpk-stats{display:flex;gap:8px;flex-wrap:wrap;}

      .rdpk-pipeline{background:white;border:1px solid #E2E8F0;border-radius:14px;padding:10px 16px;margin-bottom:14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}
      .rdpk-pipeline-track{display:flex;align-items:center;gap:4px;min-width:760px;}
      @media (max-width:560px){.rdpk-pipeline-track{min-width:620px;}}

      .rdpk-jobcard{background:white;border-radius:14px;margin-bottom:10px;overflow:hidden;cursor:pointer;transition:box-shadow .15s;}
      .rdpk-jobcard-top{padding:10px 14px;border-bottom:1px solid #F8FAFC;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;}
      .rdpk-jobcard-right{font-size: 14px;font-weight:700;color:#94A3B8;text-align:right;}
      @media (max-width:560px){
        .rdpk-jobcard-top{flex-direction:column;}
        .rdpk-jobcard-right{text-align:left;}
      }
      .rdpk-title-row{display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;}
      .rdpk-meta-row{padding:6px 14px;display:flex;gap:8px;flex-wrap:wrap;}

      .rdpk-banner{background:white;border-bottom:1.5px solid #E2E8F0;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:10;}
      @media (max-width:560px){.rdpk-banner{padding:10px 12px;}}
      .rdpk-banner-left{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
      .rdpk-ministages{display:flex;gap:3px;align-items:center;overflow-x:auto;max-width:100%;padding:2px;-webkit-overflow-scrolling:touch;}

      .rdpk-detail-grid{display:grid;grid-template-columns:240px 1fr;gap:12px;padding:16px;}
      @media (max-width:880px){.rdpk-detail-grid{grid-template-columns:1fr;padding:12px;}}
      @media (max-width:560px){.rdpk-detail-grid{padding:8px;gap:10px;}}

      .rdpk-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;}
      .rdpk-grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;}
      .rdpk-grid-4{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;}

      .rdpk-flex-wrap{display:flex;gap:8px;flex-wrap:wrap;}
      .rdpk-flex-wrap>*{flex:1 1 140px;}

      .rdpk-card-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:10px;}

      .rdpk-mis-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;}
      .rdpk-mis-table{width:100%;border-collapse:collapse;font-size: 14px;min-width:480px;}

      .rdpk-back-btn{background:#F1F5F9;border:1px solid #E2E8F0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:800;cursor:pointer;color:#475569;text-transform:uppercase;margin-bottom:10px;display:inline-flex;align-items:center;gap:5px;}

      /* OP GRID / CARDS inline fallback */
      .op-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding: 20px; background: #F1F5F9; }
      .op-card { background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; overflow: hidden; border: 1px solid #f1f5f9; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
      .op-card:hover { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); transform: translateY(-2px); }
      .op-card-hdr { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
      .op-card-title { font-size: 16px; color: #1e293b; font-weight: 800; }
      .op-card-pills { display: flex; gap: 6px; }
      .op-card-pill { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; color: #fff !important; }
      .op-card-pill.red { background: #d32f2f !important; }
      .op-card-pill.magenta { background: #ec4899 !important; }
      .op-card-pill.purple { background: #7c3aed !important; }
      .op-card-pill.teal { background: #14b8a6 !important; }
      .op-card-pill.green { background: #10b981 !important; }
      .op-card-pill.amber { background: #f59e0b !important; }
      .op-card-img-empty { padding: 40px 0; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 8px; }
      .op-card-metrics-grid { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 8px; padding: 0 16px 16px; }
      .op-metric-item { display: flex; flex-direction: column; gap: 4px; }
      .op-metric-label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .op-metric-value { font-size: 13px; color: #1e293b; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px; }
      .op-card-divider { height: 1px; background: #e2e8f0; margin: 0 16px; }
      .op-card-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px; }
      .op-btn2 { padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; }
      .op-btn2:hover { opacity: 0.85; }
    `}</style>
  );
}
