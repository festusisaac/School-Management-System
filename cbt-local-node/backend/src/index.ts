import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { initDb, run, get, all } from './database';

const app = express();
app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

const getClientId = (req: express.Request) => {
    const explicit = req.headers['x-client-id'];
    if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
    return req.ip || 'unknown-client';
};

const safeJson = (value: any, fallback: any) => {
    try {
        if (value === undefined || value === null || value === '') return fallback;
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
        return fallback;
    }
};

const pickStudentPhotoUrl = (student: any): string => {
    const candidates = [
        student?.photoUrl,
        student?.passportUrl,
        student?.imageUrl,
        student?.avatarUrl,
        student?.profilePhoto,
        student?.profileImage,
        student?.photo,
    ];
    const picked = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
    return picked ? picked.trim() : '';
};

const toBool = (value: any, fallback = false) => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
    return fallback;
};

const setManifestValue = async (key: string, value: string) => {
    await run(`INSERT OR REPLACE INTO manifest (key, value) VALUES (?, ?)`, [key, value]);
};

const getManifestValue = async (key: string) => {
    return get<{ value?: string }>(`SELECT value FROM manifest WHERE key = ?`, [key]);
};

const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers['authorization'];
    const queryToken = req.query.authorization;
    const queryIsValid = typeof queryToken === 'string' && queryToken === ADMIN_PASSCODE;
    if (token === `Bearer ${ADMIN_PASSCODE}` || queryIsValid) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Invalid Admin Passcode.' });
    }
};

const logAudit = async (req: express.Request, action: string, details: Record<string, any> = {}, actor = 'admin') => {
    try {
        await run(
            `INSERT INTO admin_audit_logs (action, actor, clientId, details, createdAt) VALUES (?, ?, ?, ?, ?)`,
            [action, actor, getClientId(req), JSON.stringify(details), new Date().toISOString()]
        );
    } catch {
        // Avoid breaking the main request flow if audit insert fails.
    }
};

const seededShuffle = (array: any[], seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }

    const random = () => {
        const x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
    };

    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

app.post('/api/auth/admin', async (req, res) => {
    const { passcode } = req.body;
    if (passcode === ADMIN_PASSCODE) {
        await logAudit(req, 'admin.login.success', { hostname: getClientId(req) });
        res.json({ token: ADMIN_PASSCODE });
    } else {
        await logAudit(req, 'admin.login.failed');
        res.status(401).json({ error: 'Incorrect passcode' });
    }
});

app.post('/api/sync', adminAuth, async (req, res) => {
    const { syncKey: rawKey, cloudUrl: rawUrl } = req.body;
    if (!rawKey || !rawUrl) {
        return res.status(400).json({ error: 'syncKey and cloudUrl are required' });
    }

    const syncKey = rawKey.trim().toUpperCase();
    let cloudUrl = rawUrl.trim().replace(/\/$/, '');
    if (!cloudUrl.includes('/api/v')) {
        cloudUrl = `${cloudUrl}/api/v1`;
    }

    const fullSyncUrl = `${cloudUrl}/examination/cbt/sync/${syncKey}`;

    try {
        const response = await axios.get(fullSyncUrl, { timeout: 30000 });
        const manifest = response.data?.data || response.data;

        if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.students) || !Array.isArray(manifest.questions)) {
            throw new Error('Cloud server returned invalid sync data.');
        }

        await run(`DELETE FROM students`);
        await run(`DELETE FROM questions`);
        await run(`DELETE FROM exam_sessions`);
        await run(`DELETE FROM manifest`);

        await setManifestValue('exam_details', JSON.stringify(manifest.exam || {}));
        await setManifestValue('syncKey', syncKey);
        await setManifestValue('cloudUrl', cloudUrl);
        await setManifestValue('isPaused', '0');
        await setManifestValue('randomizeQuestions', '1');
        await setManifestValue('randomizeOptions', '1');

        for (const student of manifest.students) {
            await run(`INSERT INTO students (id, admissionNo, fullName, photoUrl) VALUES (?, ?, ?, ?)`, [
                student.id,
                student.admissionNo,
                student.fullName,
                pickStudentPhotoUrl(student),
            ]);
        }

        for (const q of manifest.questions) {
            await run(`INSERT INTO questions (id, content, marks, options) VALUES (?, ?, ?, ?)`, [
                q.id,
                q.content,
                q.marks,
                JSON.stringify(q.options || [])
            ]);
        }

        await logAudit(req, 'sync.pull', {
            syncKey,
            cloudUrl,
            studentCount: manifest.students.length,
            questionCount: manifest.questions.length
        });

        res.json({
            message: 'Sync successful',
            exam: manifest.exam,
            studentCount: manifest.students.length,
            questionCount: manifest.questions.length
        });
    } catch (error: any) {
        await logAudit(req, 'sync.pull.failed', { reason: error.message });
        res.status(500).json({ error: 'Sync failed: ' + error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { admissionNo } = req.body;
    if (!admissionNo) return res.status(400).json({ error: 'Admission Number is required' });

    try {
        const student = await get<any>(`SELECT * FROM students WHERE admissionNo = ?`, [admissionNo]);
        if (!student) return res.status(401).json({ error: 'Invalid Admission Number. Student not found in local sync data.' });

        const examDetailsRaw = await getManifestValue('exam_details');
        const examDetails = safeJson(examDetailsRaw?.value, {});

        const isPausedRaw = await getManifestValue('isPaused');
        const isPaused = toBool(isPausedRaw?.value);

        let session = await get<any>(`SELECT * FROM exam_sessions WHERE studentId = ?`, [student.id]);
        if (!session) {
            session = {
                studentId: student.id,
                startTime: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                endTime: null,
                isSubmitted: 0,
                extraTimeMinutes: 0,
                lastQuestionIndex: 0,
                answerTimeline: '{}',
                answers: '{}'
            };
            await run(
                `INSERT INTO exam_sessions (studentId, startTime, updatedAt, isSubmitted, extraTimeMinutes, lastQuestionIndex, answerTimeline, answers) VALUES (?, ?, ?, 0, 0, 0, '{}', '{}')`,
                [session.studentId, session.startTime, session.updatedAt]
            );
        }

        res.json({
            student,
            examDetails,
            session: {
                ...session,
                answers: session.answers || '{}',
                answerTimeline: session.answerTimeline || '{}',
                lastQuestionIndex: Number(session.lastQuestionIndex || 0),
            },
            isPaused
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/questions', async (req, res) => {
    const { studentId } = req.query;
    try {
        const questionsRaw = await all<any>(`SELECT * FROM questions`);
        const randomQ = toBool((await getManifestValue('randomizeQuestions'))?.value, true);
        const randomOpts = toBool((await getManifestValue('randomizeOptions'))?.value, true);

        let questions = questionsRaw.map(q => ({
            ...q,
            options: safeJson(q.options, [])
        }));

        if (studentId && randomQ) {
            questions = seededShuffle(questions, studentId as string);
        }

        if (studentId && randomOpts) {
            questions = questions.map(q => ({
                ...q,
                options: seededShuffle(q.options || [], `${studentId as string}:${q.id}`)
            }));
        }

        res.json(questions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/session/save', async (req, res) => {
    const { studentId, questionId, optionId, currentIndex } = req.body;
    if (!studentId || !questionId || !optionId) return res.status(400).json({ error: 'Missing parameters' });

    try {
        const session = await get<any>(`SELECT * FROM exam_sessions WHERE studentId = ?`, [studentId]);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.isSubmitted) return res.status(400).json({ error: 'Exam already submitted' });

        const answers = safeJson(session.answers, {});
        const answerTimeline = safeJson(session.answerTimeline, {});
        const nowIso = new Date().toISOString();

        answers[questionId] = optionId;
        if (!answerTimeline[questionId]) {
            answerTimeline[questionId] = nowIso;
        }

        const idx = Math.max(0, Number(currentIndex || session.lastQuestionIndex || 0));

        await run(
            `UPDATE exam_sessions SET answers = ?, answerTimeline = ?, lastQuestionIndex = ?, updatedAt = ? WHERE studentId = ?`,
            [JSON.stringify(answers), JSON.stringify(answerTimeline), idx, nowIso, studentId]
        );
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/session/progress', async (req, res) => {
    const { studentId, currentIndex } = req.body;
    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

    try {
        await run(
            `UPDATE exam_sessions SET lastQuestionIndex = ?, updatedAt = ? WHERE studentId = ? AND isSubmitted = 0`,
            [Math.max(0, Number(currentIndex || 0)), new Date().toISOString(), studentId]
        );
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/session/bulk-save', async (req, res) => {
    const { studentId, answers: incomingAnswers, currentIndex } = req.body;
    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

    try {
        const session = await get<any>(`SELECT * FROM exam_sessions WHERE studentId = ?`, [studentId]);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        if (session.isSubmitted) return res.status(400).json({ error: 'Exam already submitted' });

        const serverAnswers = safeJson(session.answers, {});
        const answerTimeline = safeJson(session.answerTimeline, {});
        const clientAnswers = typeof incomingAnswers === 'object' && incomingAnswers ? incomingAnswers : {};
        const nowIso = new Date().toISOString();

        const mergedAnswers = { ...serverAnswers, ...clientAnswers };
        for (const qid of Object.keys(clientAnswers)) {
            if (!answerTimeline[qid]) answerTimeline[qid] = nowIso;
        }

        await run(
            `UPDATE exam_sessions SET answers = ?, answerTimeline = ?, lastQuestionIndex = ?, updatedAt = ? WHERE studentId = ?`,
            [
                JSON.stringify(mergedAnswers),
                JSON.stringify(answerTimeline),
                Math.max(0, Number(currentIndex || session.lastQuestionIndex || 0)),
                nowIso,
                studentId
            ]
        );

        res.json({ success: true, answers: mergedAnswers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/session/submit', async (req, res) => {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

    try {
        await run(
            `UPDATE exam_sessions SET isSubmitted = 1, endTime = ?, updatedAt = ? WHERE studentId = ?`,
            [new Date().toISOString(), new Date().toISOString(), studentId]
        );
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/push/summary', adminAuth, async (req, res) => {
    try {
        const students = await all<any>(`SELECT id, admissionNo, fullName FROM students`);
        const sessions = await all<any>(`SELECT studentId, isSubmitted FROM exam_sessions`);
        const submittedIds = new Set(sessions.filter(s => s.isSubmitted === 1).map(s => s.studentId));
        const missing = students.filter(s => !submittedIds.has(s.id)).map(s => ({
            studentId: s.id,
            admissionNo: s.admissionNo,
            fullName: s.fullName
        }));

        res.json({
            totalStudents: students.length,
            totalSessions: sessions.length,
            submittedCount: submittedIds.size,
            missingCount: missing.length,
            missingStudents: missing
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/push', adminAuth, async (req, res) => {
    try {
        const force = !!req.body?.force;
        const summaryStudents = await all<any>(`SELECT id, admissionNo FROM students`);
        const summarySessions = await all<any>(`SELECT studentId, isSubmitted FROM exam_sessions`);
        const submittedIds = new Set(summarySessions.filter(s => s.isSubmitted === 1).map(s => s.studentId));
        const missingCount = summaryStudents.filter(s => !submittedIds.has(s.id)).length;

        if (missingCount > 0 && !force) {
            return res.status(409).json({
                error: `Verification failed: ${missingCount} candidate session(s) are not submitted.`,
                missingCount
            });
        }

        const syncKeyRaw = await getManifestValue('syncKey');
        const cloudUrlRaw = await getManifestValue('cloudUrl');
        const examDetailsRaw = await getManifestValue('exam_details');

        if (!syncKeyRaw?.value || !cloudUrlRaw?.value || !examDetailsRaw?.value) {
            return res.status(400).json({ error: 'No synced exam found.' });
        }

        const syncKey = syncKeyRaw.value;
        const cloudUrl = cloudUrlRaw.value;
        const examDetails = safeJson(examDetailsRaw.value, {});

        const sessionsRaw = await all<any>(`SELECT * FROM exam_sessions`);
        const studentsRaw = await all<any>(`SELECT * FROM students`);

        const payload = sessionsRaw.map(s => {
            const student = studentsRaw.find(st => st.id === s.studentId);
            return {
                admissionNo: student ? student.admissionNo : s.studentId,
                answers: safeJson(s.answers, {}),
                score: 0,
            };
        });

        const uploadUrl = cloudUrl.includes('/api/v')
            ? `${cloudUrl}/examination/cbt/sync/upload-scores/${syncKey}`
            : `${cloudUrl}/api/v1/examination/cbt/sync/upload-scores/${syncKey}`;

        await axios.post(uploadUrl, {
            data: payload,
            assessmentTypeId: examDetails.assessmentTypeId
        });

        await logAudit(req, 'sync.push', {
            pushedCount: payload.length,
            missingCount,
            forced: force
        });

        res.json({ success: true, count: payload.length });
    } catch (error: any) {
        await logAudit(req, 'sync.push.failed', { reason: error.message });
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/monitor', adminAuth, async (req, res) => {
    try {
        const studentsRaw = await all<any>(`SELECT * FROM students`);
        const sessionsRaw = await all<any>(`SELECT * FROM exam_sessions`);
        const connectedStudents = studentsRaw.map(student => {
            const session = sessionsRaw.find(s => s.studentId === student.id);
            return { ...student, session: session || null };
        });

        const isPausedRaw = await getManifestValue('isPaused');
        res.json({ students: connectedStudents, isPaused: toBool(isPausedRaw?.value) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/session/status', async (req, res) => {
    try {
        const isPausedRaw = await getManifestValue('isPaused');
        res.json({ isPaused: toBool(isPausedRaw?.value) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/monitor/force-submit', adminAuth, async (req, res) => {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

    try {
        await run(
            `UPDATE exam_sessions SET isSubmitted = 1, endTime = ?, updatedAt = ? WHERE studentId = ?`,
            [new Date().toISOString(), new Date().toISOString(), studentId]
        );
        await logAudit(req, 'session.force_submit', { studentId });
        res.json({ success: true, message: 'Session forcefully submitted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/reset', adminAuth, async (req, res) => {
    try {
        await run(`DELETE FROM students`);
        await run(`DELETE FROM questions`);
        await run(`DELETE FROM exam_sessions`);
        await run(`DELETE FROM manifest`);
        await logAudit(req, 'node.reset');
        res.json({ success: true, message: 'Laboratory node reset and wiped.' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/toggle-pause', adminAuth, async (req, res) => {
    try {
        const current = await getManifestValue('isPaused');
        const newState = current?.value === '1' ? '0' : '1';
        await setManifestValue('isPaused', newState);
        if (newState === '1') {
            await setManifestValue('pauseStartedAt', new Date().toISOString());
        } else {
            await run(`DELETE FROM manifest WHERE key = 'pauseStartedAt'`);
        }
        await logAudit(req, 'hall.pause_toggle', { isPaused: newState === '1' });
        res.json({ success: true, isPaused: newState === '1' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/add-time', adminAuth, async (req, res) => {
    const { studentId, minutes } = req.body;
    if (!studentId || !minutes) return res.status(400).json({ error: 'Missing parameters' });

    try {
        await run(`UPDATE exam_sessions SET extraTimeMinutes = extraTimeMinutes + ?, updatedAt = ? WHERE studentId = ?`, [
            minutes,
            new Date().toISOString(),
            studentId
        ]);
        await logAudit(req, 'session.add_time', { studentId, minutes: Number(minutes) });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/export', adminAuth, async (req, res) => {
    try {
        const students = await all(`SELECT * FROM students`);
        const sessions = await all<any>(`SELECT * FROM exam_sessions`);
        const examDetails = await getManifestValue('exam_details');

        const backup = {
            exam: safeJson(examDetails?.value, {}),
            exportDate: new Date().toISOString(),
            students,
            sessions: sessions.map(s => ({
                ...s,
                answers: safeJson(s.answers, {}),
                answerTimeline: safeJson(s.answerTimeline, {})
            }))
        };

        await logAudit(req, 'node.export', { sessionCount: sessions.length });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=cbt-backup-${Date.now()}.json`);
        res.send(JSON.stringify(backup, null, 2));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/randomization', adminAuth, async (req, res) => {
    try {
        const randomizeQuestions = toBool((await getManifestValue('randomizeQuestions'))?.value, true);
        const randomizeOptions = toBool((await getManifestValue('randomizeOptions'))?.value, true);
        res.json({ randomizeQuestions, randomizeOptions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/randomization', adminAuth, async (req, res) => {
    const { randomizeQuestions, randomizeOptions } = req.body;
    try {
        await setManifestValue('randomizeQuestions', toBool(randomizeQuestions, true) ? '1' : '0');
        await setManifestValue('randomizeOptions', toBool(randomizeOptions, true) ? '1' : '0');
        await logAudit(req, 'settings.randomization', {
            randomizeQuestions: toBool(randomizeQuestions, true),
            randomizeOptions: toBool(randomizeOptions, true)
        });
        res.json({
            success: true,
            randomizeQuestions: toBool(randomizeQuestions, true),
            randomizeOptions: toBool(randomizeOptions, true)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/analytics', adminAuth, async (req, res) => {
    try {
        const students = await all<any>(`SELECT * FROM students`);
        const sessions = await all<any>(`SELECT * FROM exam_sessions`);
        const questions = await all<any>(`SELECT * FROM questions`);

        const submitted = sessions.filter(s => s.isSubmitted === 1);
        const totalStudents = students.length;
        const submittedCount = submitted.length;
        const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;

        const answeredPerSession = submitted.map(s => Object.keys(safeJson(s.answers, {})).length);
        const avgAnswered = answeredPerSession.length > 0
            ? answeredPerSession.reduce((a, b) => a + b, 0) / answeredPerSession.length
            : 0;

        const questionStats = questions.map((q) => {
            const options = safeJson(q.options, []);
            const correctOption = options.find((opt: any) => opt?.isCorrect === true || opt?.correct === true);
            const correctOptionId = correctOption?.id;

            let attempts = 0;
            let correctCount = 0;
            let totalSecondsToAnswer = 0;
            let timedAttempts = 0;

            for (const session of submitted) {
                const answers = safeJson(session.answers, {});
                const timeline = safeJson(session.answerTimeline, {});
                const selected = answers[q.id];
                if (!selected) continue;

                attempts += 1;
                if (correctOptionId && selected === correctOptionId) correctCount += 1;

                const answeredAt = timeline[q.id];
                if (answeredAt && session.startTime) {
                    const sec = Math.max(0, (new Date(answeredAt).getTime() - new Date(session.startTime).getTime()) / 1000);
                    if (Number.isFinite(sec)) {
                        totalSecondsToAnswer += sec;
                        timedAttempts += 1;
                    }
                }
            }

            const attemptRate = submittedCount > 0 ? (attempts / submittedCount) * 100 : 0;
            const correctnessRate = correctOptionId && attempts > 0 ? (correctCount / attempts) * 100 : null;
            const avgSecondsToAnswer = timedAttempts > 0 ? totalSecondsToAnswer / timedAttempts : null;

            return {
                id: q.id,
                content: q.content,
                attempts,
                attemptRate,
                correctCount,
                correctnessRate,
                avgSecondsToAnswer,
                hasCorrectKey: !!correctOptionId
            };
        });

        const mostMissed = questionStats
            .filter(q => q.hasCorrectKey && q.correctnessRate !== null)
            .sort((a, b) => (a.correctnessRate as number) - (b.correctnessRate as number))
            .slice(0, 5);

        const slowestQuestions = questionStats
            .filter(q => q.avgSecondsToAnswer !== null)
            .sort((a, b) => (b.avgSecondsToAnswer as number) - (a.avgSecondsToAnswer as number))
            .slice(0, 5);

        const timelinePerSession = submitted
            .map((s) => {
                const answers = safeJson(s.answers, {});
                const answeredCount = Object.keys(answers).length;
                if (answeredCount === 0 || !s.startTime || !s.endTime) return null;
                const durationSec = Math.max(0, (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000);
                return durationSec / answeredCount;
            })
            .filter((v): v is number => v !== null);

        const avgSecondsPerQuestion = timelinePerSession.length > 0
            ? timelinePerSession.reduce((a, b) => a + b, 0) / timelinePerSession.length
            : 0;

        res.json({
            summary: {
                totalStudents,
                submittedCount,
                submissionRate,
                averageAnsweredQuestions: avgAnswered,
                averageSecondsPerQuestion: avgSecondsPerQuestion
            },
            mostMissed,
            slowestQuestions,
            questionStats
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/audit', adminAuth, async (req, res) => {
    try {
        const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
        const logs = await all<any>(`SELECT * FROM admin_audit_logs ORDER BY id DESC LIMIT ?`, [limit]);
        res.json({
            logs: logs.map((log) => ({
                ...log,
                details: safeJson(log.details, {})
            }))
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = Number(process.env.PORT) || 4000;
initDb().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`=========================================`);
        console.log(`OFFLINE CBT SERVER RUNNING!`);
        console.log(`Access Admin Portal at: http://localhost:${PORT}/admin`);
        console.log(`Students can access at: http://<YOUR_IP_ADDRESS>:${PORT}`);
        console.log(`=========================================`);
    });
});
