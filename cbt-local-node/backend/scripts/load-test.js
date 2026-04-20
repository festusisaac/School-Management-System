const axios = require('axios');
const sqlite3 = require('sqlite3');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const TARGET_USERS = Number(process.env.USERS || 50);
const DURATION_SEC = Number(process.env.DURATION_SEC || 180);
const STATUS_INTERVAL_MS = Number(process.env.STATUS_INTERVAL_MS || 2000);
const PROGRESS_INTERVAL_MS = Number(process.env.PROGRESS_INTERVAL_MS || 5000);
const ANSWER_INTERVAL_MS = Number(process.env.ANSWER_INTERVAL_MS || 3500);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 10000);

const dbPath = path.join(__dirname, '..', 'cbt-local.db');
const http = axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const percentile = (sorted, p) => {
    if (!sorted.length) return 0;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
    return sorted[idx];
};

const createMetrics = () => ({
    total: 0,
    ok: 0,
    fail: 0,
    byEndpoint: {},
    statusCodes: {},
});

const trackMetric = (metrics, endpoint, ms, ok, statusCode) => {
    metrics.total += 1;
    if (ok) metrics.ok += 1;
    else metrics.fail += 1;

    if (statusCode) {
        metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
    }

    if (!metrics.byEndpoint[endpoint]) {
        metrics.byEndpoint[endpoint] = {
            count: 0,
            ok: 0,
            fail: 0,
            durations: [],
        };
    }

    const bucket = metrics.byEndpoint[endpoint];
    bucket.count += 1;
    if (ok) bucket.ok += 1;
    else bucket.fail += 1;
    bucket.durations.push(ms);
};

const requestWithMetrics = async (metrics, endpoint, fn) => {
    const start = Date.now();
    try {
        const res = await fn();
        trackMetric(metrics, endpoint, Date.now() - start, true, res.status);
        return res.data;
    } catch (error) {
        const statusCode = error?.response?.status || 'ERR';
        trackMetric(metrics, endpoint, Date.now() - start, false, statusCode);
        return null;
    }
};

const getAdmissions = (limit) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        db.all(
            `SELECT admissionNo FROM students ORDER BY admissionNo ASC LIMIT ?`,
            [Math.max(limit, 1)],
            (err, rows) => {
                db.close();
                if (err) return reject(err);
                resolve((rows || []).map((r) => r.admissionNo).filter(Boolean));
            },
        );
    });
};

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getOptionId = (opt) => {
    if (!opt || typeof opt !== 'object') return '';
    return String(opt.id || opt.optionId || opt.value || '').trim();
};
const getQuestionId = (q) => {
    if (!q || typeof q !== 'object') return '';
    return String(q.id || q.questionId || '').trim();
};

const runVirtualUser = async (client, deadline, metrics) => {
    let nextStatusAt = Date.now();
    let nextProgressAt = Date.now() + randomBetween(400, 1600);
    let nextAnswerAt = Date.now() + randomBetween(600, 2200);
    let currentIndex = Number(client.lastQuestionIndex || 0);

    while (Date.now() < deadline) {
        const now = Date.now();

        if (now >= nextStatusAt) {
            await requestWithMetrics(metrics, 'GET /api/session/status', () =>
                http.get(`/api/session/status?studentId=${encodeURIComponent(client.studentId)}`),
            );
            nextStatusAt = now + STATUS_INTERVAL_MS + randomBetween(-250, 250);
        }

        if (now >= nextProgressAt) {
            currentIndex = Math.min(client.questions.length - 1, Math.max(0, currentIndex + (Math.random() > 0.5 ? 1 : 0)));
            await requestWithMetrics(metrics, 'POST /api/session/progress', () =>
                http.post('/api/session/progress', {
                    studentId: client.studentId,
                    currentIndex,
                }),
            );
            nextProgressAt = now + PROGRESS_INTERVAL_MS + randomBetween(-700, 700);
        }

        if (now >= nextAnswerAt && client.questions.length > 0) {
            const q = client.questions[randomBetween(0, client.questions.length - 1)];
            const questionId = getQuestionId(q);
            const options = Array.isArray(q.options) ? q.options : [];
            if (options.length > 0) {
                const picked = options[randomBetween(0, options.length - 1)];
                const optionId = getOptionId(picked);
                if (questionId && optionId) {
                await requestWithMetrics(metrics, 'POST /api/session/save', () =>
                    http.post('/api/session/save', {
                        studentId: client.studentId,
                        questionId,
                        optionId,
                        currentIndex,
                    }),
                );
                }
            }
            nextAnswerAt = now + ANSWER_INTERVAL_MS + randomBetween(-900, 900);
        }

        await sleep(120);
    }
};

const printSummary = (metrics, durationSec, targetUsers, actualUsers) => {
    const rps = durationSec > 0 ? (metrics.total / durationSec).toFixed(2) : '0.00';
    const successRate = metrics.total > 0 ? ((metrics.ok / metrics.total) * 100).toFixed(2) : '0.00';
    console.log('\n=== CBT LOAD TEST SUMMARY ===');
    console.log(`Target users: ${targetUsers}`);
    console.log(`Active users: ${actualUsers}`);
    console.log(`Duration: ${durationSec}s`);
    console.log(`Total requests: ${metrics.total}`);
    console.log(`Successful requests: ${metrics.ok}`);
    console.log(`Failed requests: ${metrics.fail}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Throughput: ${rps} req/s`);
    console.log('\nStatus codes:');
    console.log(metrics.statusCodes);

    console.log('\nEndpoint breakdown:');
    Object.entries(metrics.byEndpoint).forEach(([endpoint, bucket]) => {
        const sorted = [...bucket.durations].sort((a, b) => a - b);
        const p50 = percentile(sorted, 50);
        const p95 = percentile(sorted, 95);
        const p99 = percentile(sorted, 99);
        const avg = sorted.length ? (sorted.reduce((acc, v) => acc + v, 0) / sorted.length).toFixed(1) : '0.0';

        console.log(
            `- ${endpoint}: count=${bucket.count}, ok=${bucket.ok}, fail=${bucket.fail}, avg=${avg}ms, p50=${p50}ms, p95=${p95}ms, p99=${p99}ms`,
        );
    });
    console.log('=============================\n');
};

const main = async () => {
    console.log(`Starting CBT load test against ${BASE_URL}`);
    console.log(
        `Config: users=${TARGET_USERS}, duration=${DURATION_SEC}s, statusInterval=${STATUS_INTERVAL_MS}ms, answerInterval=${ANSWER_INTERVAL_MS}ms, progressInterval=${PROGRESS_INTERVAL_MS}ms`,
    );

    const admissions = await getAdmissions(TARGET_USERS);
    if (!admissions.length) {
        console.error('No students found in local DB. Sync exam first before running load test.');
        process.exit(1);
    }

    const selectedAdmissions = [];
    for (let i = 0; i < TARGET_USERS; i++) {
        selectedAdmissions.push(admissions[i % admissions.length]);
    }

    const metrics = createMetrics();
    const clients = [];
    let submittedSkipped = 0;

    for (const admissionNo of selectedAdmissions) {
        const loginRes = await requestWithMetrics(metrics, 'POST /api/auth/login', () =>
            http.post('/api/auth/login', { admissionNo }),
        );
        if (!loginRes?.student?.id) continue;
        if (Number(loginRes?.session?.isSubmitted || 0) === 1) {
            submittedSkipped += 1;
            continue;
        }

        const questionRes = await requestWithMetrics(metrics, 'GET /api/questions', () =>
            http.get(`/api/questions?studentId=${encodeURIComponent(loginRes.student.id)}`),
        );
        const questions = Array.isArray(questionRes) ? questionRes : [];
        clients.push({
            admissionNo,
            studentId: loginRes.student.id,
            lastQuestionIndex: Number(loginRes.session?.lastQuestionIndex || 0),
            questions,
        });
    }

    if (!clients.length) {
        console.error('Could not initialize any active virtual users (all sessions may already be submitted).');
        process.exit(1);
    }

    if (submittedSkipped > 0) {
        console.log(`Skipped ${submittedSkipped} submitted session(s). Re-sync/reset for a full write-load simulation.`);
    }

    const start = Date.now();
    const deadline = start + DURATION_SEC * 1000;

    await Promise.all(clients.map((c) => runVirtualUser(c, deadline, metrics)));

    const actualDuration = Math.round((Date.now() - start) / 1000);
    printSummary(metrics, actualDuration, TARGET_USERS, clients.length);

    const successRate = metrics.total > 0 ? (metrics.ok / metrics.total) * 100 : 0;
    if (successRate < 98) {
        process.exitCode = 2;
    }
};

main().catch((error) => {
    console.error('Load test crashed:', error?.message || error);
    process.exit(1);
});
