/**
 * PanelProbe — Self-assessment report: summarizes wizard answers and
 * browser-reported display info, with print/PDF and JSON export.
 */
(function (DD) {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const VERSION = '1.0.0';
    let modal = null;
    let lastFocus = null;

    const STATUS = {
        pass: { text: 'Pass', cls: 'badge-pass' },
        issue: { text: 'Issue observed', cls: 'badge-fail' },
        skip: { text: 'Skipped', cls: 'badge-neutral' },
        none: { text: 'Not tested', cls: 'badge-neutral' }
    };

    function summarize() {
        const findings = DD.Wizard.findings;
        const rows = DD.Wizard.STEPS.map((step) => ({ step, result: findings[step.title] || 'none' }));
        const answered = rows.filter((r) => r.result === 'pass' || r.result === 'issue');
        const issues = rows.filter((r) => r.result === 'issue');

        let grade = '—';
        let gradeClass = 'grade-none';
        if (answered.length) {
            if (issues.length === 0) { grade = 'A'; gradeClass = 'grade-good'; }
            else if (issues.length === 1) { grade = 'B'; gradeClass = 'grade-good'; }
            else if (issues.length <= 3) { grade = 'C'; gradeClass = 'grade-warn'; }
            else { grade = 'D'; gradeClass = 'grade-bad'; }
        }
        return { rows, answered, issues, grade, gradeClass };
    }

    function cell(text, className) {
        const td = document.createElement('td');
        if (className) {
            const span = document.createElement('span');
            span.className = className;
            span.textContent = text;
            td.appendChild(span);
        } else {
            td.textContent = text;
        }
        return td;
    }

    function render() {
        const info = DD.DisplayInfo.format();
        const summary = summarize();

        $('repRes').textContent = info.resolution;
        $('repRefresh').textContent = DD.Telemetry.refreshRate ? `${DD.Telemetry.refreshRate} Hz` : 'Unknown';
        $('repDpr').textContent = info.scaling;
        $('repDepth').textContent = `${info.depth} · ${info.gamut}`;
        $('reportTimestamp').textContent = new Date().toLocaleString();

        const grade = $('reportGrade');
        grade.textContent = summary.grade;
        grade.className = `score-grade ${summary.gradeClass}`;

        const body = $('reportBodyTable');
        body.replaceChildren();
        summary.rows.forEach(({ step, result }) => {
            const tr = document.createElement('tr');
            const test = DD.getTest(step.test);
            tr.appendChild(cell(step.title));
            tr.appendChild(cell(test ? test.title : step.test));
            tr.appendChild(cell(STATUS[result].text, STATUS[result].cls));
            body.appendChild(tr);
        });

        const recs = $('reportRecommendations');
        recs.replaceChildren();
        const items = summary.issues.map(({ step }) => step.advice);
        if (!summary.answered.length) {
            items.push('No checks recorded yet. Run the Guided Wizard to fill in this report.');
        } else if (!items.length) {
            items.push('No issues were reported in the checks you completed.');
        }
        items.forEach((text) => {
            const li = document.createElement('li');
            li.textContent = text;
            recs.appendChild(li);
        });
    }

    function exportJson() {
        const info = DD.DisplayInfo.read();
        const summary = summarize();
        const data = {
            application: `PanelProbe ${VERSION}`,
            generatedAt: new Date().toISOString(),
            note: 'Results are self-reported observations; display values are as reported by the browser.',
            display: {
                resolution: `${info.physicalWidth}x${info.physicalHeight}`,
                devicePixelRatio: info.dpr,
                colorDepth: info.colorDepth,
                gamut: info.gamut,
                hdr: info.hdr,
                refreshRateHz: DD.Telemetry.refreshRate || null
            },
            grade: summary.grade,
            checks: summary.rows.map(({ step, result }) => ({ check: step.title, test: step.test, result }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `panelprobe-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        DD.Audio.success();
    }

    DD.Report = {
        init() {
            modal = $('reportModal');
            $('btnCloseReport').addEventListener('click', () => DD.Report.hide());
            $('btnPrintReport').addEventListener('click', () => window.print());
            $('btnExportJson').addEventListener('click', exportJson);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) DD.Report.hide();
            });
        },

        show() {
            render();
            lastFocus = document.activeElement;
            modal.hidden = false;
            document.body.classList.add('modal-open');
            modal.querySelector('.modal-card').scrollTop = 0;
            $('reportTitle').focus({ preventScroll: true });
            DD.Audio.click();
        },

        hide() {
            if (!modal || modal.hidden) return;
            modal.hidden = true;
            document.body.classList.remove('modal-open');
            if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        },

        isOpen: () => !!modal && !modal.hidden
    };
})(window.DD);
