export const handleStorePrint = (job) => {
    const printWindow = window.open('', '_blank');
    const headerDate = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(',', '');
    const headerTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const html = `
        <html>
            <head>
                <title>Gate Pass - ${job.sub_job_no}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;0,800;1,800;0,1000;1,1000&display=swap');
                    
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        padding: 30px 60px;
                        color: #1e293b;
                        background-color: #f8fafc;
                        min-height: 100vh;
                        -webkit-print-color-adjust: exact;
                    }

                    .top-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 8px;
                        font-weight: 800;
                        color: #1e293b;
                        margin-bottom: 40px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .main-header {
                        text-align: center;
                        margin-bottom: 80px;
                    }

                    .job-no {
                        font-size: 40px;
                        font-weight: 1000;
                        font-style: italic;
                        letter-spacing: -1px;
                        margin: 0;
                        text-transform: uppercase;
                        color: #1e293b;
                        line-height: 1;
                    }

                    .panel-title {
                        font-size: 11px;
                        font-weight: 800;
                        font-style: italic;
                        color: #94a3b8;
                        letter-spacing: 3px;
                        margin-top: 15px;
                        text-transform: uppercase;
                    }

                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }

                    .bom-card {
                        background: white;
                        border-radius: 40px;
                        padding: 35px;
                        margin-bottom: 50px;
                        text-align: center;
                        box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
                        border: 1px solid rgba(0,0,0,0.02);
                    }

                    .box-label {
                        font-size: 10px;
                        font-weight: 1000;
                        font-style: italic;
                        color: #cbd5e1;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        margin-right: 15px;
                    }

                    .box-value {
                        font-size: 12px;
                        font-weight: 800;
                        color: #1e293b;
                    }

                    .mrp-card {
                        background: white;
                        border-radius: 50px;
                        padding: 40px 0;
                        box-shadow: 0 20px 60px -20px rgba(0,0,0,0.08);
                        border: 1px solid rgba(0,0,0,0.02);
                    }

                    .mrp-title {
                        padding: 0 50px 30px 50px;
                        font-weight: 900;
                        font-style: italic;
                        font-size: 12px;
                        color: #cbd5e1;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }

                    th {
                        text-align: left;
                        font-size: 9px;
                        font-weight: 1000;
                        color: #cbd5e1;
                        text-transform: uppercase;
                        padding: 15px 50px;
                        letter-spacing: 1px;
                    }

                    .material-row td {
                        padding: 30px 50px;
                        border-top: 1px solid #f8fafc;
                        vertical-align: middle;
                    }

                    .material-name {
                        font-size: 16px;
                        font-weight: 1000;
                        color: #1e293b;
                        text-transform: uppercase;
                        font-style: italic;
                    }

                    .material-specs {
                        font-size: 9px;
                        font-weight: 1000;
                        color: #3b82f6;
                        margin-top: 5px;
                        text-transform: uppercase;
                        font-style: italic;
                    }

                    .qty-val {
                        font-size: 26px;
                        font-weight: 1000;
                        font-style: italic;
                        color: #1e293b;
                        text-align: center;
                    }

                    .red-qty {
                        color: #f43f5e;
                    }

                    .logs-cell {
                        padding: 0 50px 30px 50px !important;
                    }

                    .log-entry {
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                        margin-bottom: 25px;
                        position: relative;
                        padding-left: 35px;
                    }

                    .log-indicator-bar {
                        position: absolute;
                        left: 0;
                        top: 0;
                        bottom: 0;
                        width: 9px;
                        border-radius: 5px;
                    }

                    .log-user-info {
                        text-align: right;
                        flex-grow: 1;
                        margin-right: 40px;
                    }

                    .log-dept-label {
                        font-size: 9px;
                        font-weight: 1000;
                        color: #3b82f6;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }

                    .log-username {
                        font-size: 20px;
                        font-weight: 1000;
                        color: #1e293b;
                        text-transform: uppercase;
                        font-style: italic;
                        line-height: 1;
                    }

                    .log-qty-block {
                        min-width: 140px;
                        text-align: right;
                    }

                    .log-qty-val {
                        font-size: 32px;
                        font-weight: 1000;
                        font-style: italic;
                        line-height: 1;
                    }

                    .log-timestamp {
                        font-size: 8px;
                        font-weight: 800;
                        color: #cbd5e1;
                        margin-top: 6px;
                        text-transform: uppercase;
                    }

                    @media print {
                        body { background: white; padding: 20px; }
                        .mrp-card, .bom-card { box-shadow: none; border: 1px solid #e2e8f0; }
                    }
                </style>
            </head>
            <body>
                <div class="top-meta">
                    <span>${headerDate}, ${headerTime}</span>
                    <span>STORES_Procurement_Master_v1.6Stable-new_v7.1</span>
                </div>

                <div class="main-header">
                    <h1 class="job-no">${job.sub_job_no} / ${job.client_name || 'N/A'}</h1>
                    <div class="panel-title">STORES ACCOUNTING PANEL</div>
                </div>

                <div class="container">
                    <div class="bom-card">
                        <span class="box-label">BOM RECEIVED:</span>
                        <span class="box-value">${job.created_at || 'N/A'}</span>
                    </div>

                    <div class="mrp-card">
                        <div class="mrp-title">MRP REQUISITION: V1.0</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 45%;">MATERIAL SPECS</th>
                                    <th style="text-align: center;">REQ</th>
                                    <th style="text-align: center;">NET BAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${job.materials.map(m => `
                                    <tr class="material-row">
                                        <td>
                                            <div class="material-name">${m.material_name}</div>
                                            <div class="material-specs">${m.specs || ''}</div>
                                        </td>
                                        <td class="qty-val">${m.required_qty}</td>
                                        <td class="qty-val ${m.required_qty - (m.issued_qty - m.returned_qty) > 0 ? 'red-qty' : ''}">
                                            ${m.required_qty - (m.issued_qty - m.returned_qty)}
                                        </td>
                                    </tr>
                                    ${m.logs && m.logs.length > 0 ? `
                                        <tr>
                                            <td colspan="3" class="logs-cell">
                                                ${m.logs.map(log => `
                                                    <div class="log-entry">
                                                        <div class="log-indicator-bar" style="background: ${log.type === 'ISSUE' ? '#10b981' : '#f59e0b'};"></div>
                                                        <div class="log-user-info">
                                                            <div class="log-dept-label">DEPT: ${log.dept}</div>
                                                            <div class="log-username">${log.recipient}</div>
                                                        </div>
                                                        <div class="log-qty-block">
                                                            <div class="log-qty-val" style="color: ${log.type === 'ISSUE' ? '#10b981' : '#f43f5e'};">
                                                                ${log.type === 'ISSUE' ? '+' : '-'}${log.qty}
                                                            </div>
                                                            <div class="log-timestamp">${log.recorded_at}</div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </td>
                                        </tr>
                                    ` : ''}
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => { window.close(); }, 500);
                    }
                </script>
            </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};


