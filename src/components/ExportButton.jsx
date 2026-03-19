import jsPDF from 'jspdf';

function formatDate() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function addPageHeader(doc, title, pageNum) {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('BizLens — Confidential', 15, 10);
    doc.text(`Page ${pageNum}`, doc.internal.pageSize.getWidth() - 15, 10, { align: 'right' });
    doc.setDrawColor(230);
    doc.line(15, 13, doc.internal.pageSize.getWidth() - 15, 13);
    doc.setTextColor(0);
}

export default function ExportButton({ analysisResult, sector }) {
    const handleExport = () => {
        if (!analysisResult) return;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pw = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentWidth = pw - margin * 2;

        // ---- PAGE 1: Executive Summary ----
        addPageHeader(doc, 'Executive Summary', 1);

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('BizLens', margin, 25);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80);
        doc.text(`Strategic Analysis Report — ${sector}`, margin, 33);
        doc.setTextColor(0);

        doc.setDrawColor(0);
        doc.line(margin, 37, pw - margin, 37);

        // Problem Statement
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('PROBLEM STATEMENT', margin, 46);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const psLines = doc.splitTextToSize(analysisResult.problemStatement || '', contentWidth);
        doc.text(psLines, margin, 54);

        // Executive Summary
        const esY = 54 + psLines.length * 6 + 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('EXECUTIVE SUMMARY', margin, esY);
        doc.setFont('helvetica', 'normal');
        const esLines = doc.splitTextToSize(analysisResult.executiveSummary || '', contentWidth);
        doc.text(esLines, margin, esY + 8);

        // KPIs table
        let kpiY = esY + 8 + esLines.length * 6 + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('KEY PERFORMANCE INDICATORS', margin, kpiY);
        kpiY += 8;

        (analysisResult.kpis || []).forEach((kpi, i) => {
            if (kpiY > 260) return; // page guard
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(`${i + 1}. ${kpi.name}`, margin + 3, kpiY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.text(`Value: ${kpi.value}   Benchmark: ${kpi.benchmark || 'N/A'}   Status: ${kpi.status?.toUpperCase()}   Delta: ${kpi.delta || '—'}`, margin + 8, kpiY + 5);
            kpiY += 13;
        });

        // ---- PAGE 2: Issue Tree ----
        doc.addPage();
        addPageHeader(doc, 'Issue Tree', 2);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Issue Tree Analysis', margin, 24);

        const tree = analysisResult.issueTree;
        if (tree) {
            doc.setFillColor(30, 30, 30);
            doc.rect(margin, 30, contentWidth, 14, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255);
            const rootLines = doc.splitTextToSize(`ROOT: ${tree.root}`, contentWidth - 4);
            doc.text(rootLines, margin + 3, 39);
            doc.setTextColor(0);

            let treeY = 52;
            (tree.branches || []).forEach((branch, bi) => {
                if (treeY > 260) return;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.text(`${bi + 1}. ${branch.label} [${branch.severity.toUpperCase()}]`, margin + 3, treeY);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8.5);
                const descLines = doc.splitTextToSize(branch.description, contentWidth - 10);
                doc.text(descLines, margin + 6, treeY + 5);
                treeY += 5 + descLines.length * 5;

                (branch.leaves || []).forEach((leaf) => {
                    if (treeY > 265) return;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    const leafLines = doc.splitTextToSize(`→ ${leaf}`, contentWidth - 15);
                    doc.text(leafLines, margin + 10, treeY);
                    treeY += leafLines.length * 4.5 + 1;
                });
                treeY += 5;
            });
        }

        // ---- PAGE 3: Top 3 Recommendations ----
        doc.addPage();
        addPageHeader(doc, 'Recommendations', 3);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Strategic Recommendations (SCR Format)', margin, 24);

        let recY = 34;
        const recs = (analysisResult.recommendations || []).slice(0, 3);
        recs.forEach((rec, ri) => {
            if (recY > 240) return;
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, recY, contentWidth, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text(`R${ri + 1}: ${rec.title}   [${(rec.impact || '').toUpperCase()} IMPACT]`, margin + 3, recY + 5.5);
            recY += 12;

            const scrFields = [
                { label: 'SITUATION', key: 'situation' },
                { label: 'COMPLICATION', key: 'complication' },
                { label: 'RESOLUTION', key: 'resolution' },
            ];
            scrFields.forEach(({ label, key }) => {
                if (recY > 265) return;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.text(label + ':', margin + 3, recY);
                doc.setFont('helvetica', 'normal');
                const vLines = doc.splitTextToSize(rec[key] || '', contentWidth - 10);
                doc.text(vLines, margin + 28, recY);
                recY += vLines.length * 5 + 3;
            });

            if (rec.metric) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(50, 120, 50);
                doc.text(`Expected Outcome: ${rec.metric}`, margin + 3, recY);
                doc.setTextColor(0);
                recY += 6;
            }
            recY += 8;
        });

        doc.save(`BizLens_Report_${formatDate()}.pdf`);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!analysisResult}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export SCR Slide
        </button>
    );
}
