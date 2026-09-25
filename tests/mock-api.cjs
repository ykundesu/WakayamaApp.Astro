const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3001);
const DATA_ROOT = path.join(__dirname, 'data');
const API_PREFIX = '/v1';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateKey(key) {
  const parts = key.split('-').map((part) => Number(part));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

function sendNotFound(res) {
  sendJson(res, 404, { error: 'Not Found' });
}

function safeJoin(root, requestPath) {
  const normalized = path.normalize(requestPath).replace(/^([/\\])+/g, '');
  const resolved = path.join(root, normalized);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function tryServeFile(res, filePath) {
  if (!filePath) return false;
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
  } catch {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', ext === '.json' ? 'application/json; charset=utf-8' : 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function buildMealsWeek(mondayKey) {
  const baseDate = parseDateKey(mondayKey) || new Date();
  const menus = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);
    const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][date.getDay() === 0 ? 6 : date.getDay() - 1];
    return {
      date: formatDate(date),
      breakfast: [
        {
          type: 'breakfast',
          mainType: 'Rice',
          main: `Breakfast Set (${dayLabel})`,
          subs: ['Miso soup', 'Salad'],
          nutrition: {
            energyKcal: 480,
            proteinG: 18,
            fatG: 14,
            calciumMg: 210,
            saltG: 2.1,
          },
        },
      ],
      lunch: [
        {
          type: 'lunch',
          mainType: 'Noodles',
          main: `Lunch Bowl (${dayLabel})`,
          subs: ['Side veggies', 'Fruit'],
          nutrition: {
            energyKcal: 650,
            proteinG: 24,
            fatG: 20,
            calciumMg: 180,
            saltG: 2.5,
          },
        },
      ],
      dinner: [
        {
          type: 'dinner',
          mainType: 'Curry',
          main: `Dinner Plate (${dayLabel})`,
          subs: ['Soup', 'Dessert'],
          nutrition: {
            energyKcal: 720,
            proteinG: 28,
            fatG: 22,
            calciumMg: 260,
            saltG: 2.8,
          },
        },
      ],
    };
  });

  return {
    week_start: formatDate(baseDate),
    menus,
  };
}

function buildClassesPayload(grade) {
  const classTimes = [
    { start: '09:00', end: '10:30' },
    { start: '10:40', end: '12:10' },
    { start: '13:10', end: '14:40' },
    { start: '14:50', end: '16:20' },
  ];
  const subjects = ['Mathematics', 'English', 'Physics', 'Programming', 'Lab Work'];

  const data = Array.from({ length: 5 }).map((_, day) => {
    const classes = classTimes.map((slot, idx) => ({
      start: slot.start,
      end: slot.end,
      name: `${subjects[(day + idx) % subjects.length]} ${grade}`,
      teacher: `Staff ${String.fromCharCode(65 + idx)}`,
    }));
    return { day, classes };
  });

  return { data };
}

function buildEventsPayload(year) {
  return {
    academic_year: year,
    events: [
      { date: '04/12', grade: null, name: 'Dorm Welcome Day' },
      { date: '05/02', grade: 1, name: 'Room Inspection' },
      { date: '06/05', grade: null, name: 'Dorm Sports Night' },
      { date: '09/10', grade: 3, name: 'Safety Drill' },
      { date: '12/15', grade: null, name: 'Winter Social' },
      { date: '02/20', grade: 5, name: 'Farewell Dinner' },
    ],
  };
}

function buildSchoolRulesIndex() {
  return {
    version: 'dev',
    generatedAt: new Date().toISOString(),
    chapters: [
      {
        id: 'ch1',
        title: 'General',
        order: 1,
        ruleIds: ['r1', 'r2'],
      },
    ],
    rules: [
      {
        id: 'r1',
        chapterId: 'ch1',
        title: 'Attendance',
        summary: 'Basic attendance guidelines.',
        order: 1,
        pdfUrl: '',
        sections: [
          {
            id: 's1',
            title: 'Required Presence',
            order: 1,
            articles: [
              {
                id: 'a1',
                label: 'Article 1',
                body: 'Residents must attend mandatory dorm meetings.',
              },
            ],
          },
        ],
      },
      {
        id: 'r2',
        chapterId: 'ch1',
        title: 'Quiet Hours',
        summary: 'Quiet hours are observed daily.',
        order: 2,
        pdfUrl: '',
        articles: [
          {
            id: 'a2',
            label: 'Article 2',
            body: 'Quiet hours run from 22:00 to 06:00.',
          },
        ],
      },
    ],
  };
}

function buildRuleDetail(ruleId) {
  const base = buildSchoolRulesIndex().rules.find((rule) => rule.id === ruleId);
  if (base) return base;
  return {
    id: ruleId,
    chapterId: 'ch1',
    title: `Rule ${ruleId}`,
    summary: 'Generated rule detail.',
    order: 99,
    pdfUrl: '',
    articles: [
      {
        id: 'a1',
        label: 'Article 1',
        body: 'This is a generated rule detail.',
      },
    ],
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (!pathname.startsWith(API_PREFIX)) {
    sendNotFound(res);
    return;
  }

  const filePath = safeJoin(DATA_ROOT, pathname);
  if (tryServeFile(res, filePath)) return;

  const mealsMatch = pathname.match(/^\/v1\/meals\/(\d{4}-\d{2}-\d{2})\.json$/);
  if (mealsMatch) {
    sendJson(res, 200, buildMealsWeek(mealsMatch[1]));
    return;
  }

  const classesMatch = pathname.match(/^\/v1\/classes\/[^/]+\/(\d+)_([01])\.json$/);
  if (classesMatch) {
    const grade = Number(classesMatch[1]) || 1;
    sendJson(res, 200, buildClassesPayload(grade));
    return;
  }

  const eventsMatch = pathname.match(/^\/v1\/dormitory\/events\/(\d{4})\.json$/);
  if (eventsMatch) {
    const year = Number(eventsMatch[1]) || new Date().getFullYear();
    sendJson(res, 200, buildEventsPayload(year));
    return;
  }

  if (pathname === '/v1/school-rules/index.json') {
    sendJson(res, 200, buildSchoolRulesIndex());
    return;
  }

  const ruleMatch = pathname.match(/^\/v1\/school-rules\/rules\/([^/]+)\.json$/);
  if (ruleMatch) {
    sendJson(res, 200, { rule: buildRuleDetail(ruleMatch[1]) });
    return;
  }

  sendNotFound(res);
});

server.listen(PORT, () => {
  console.log(`[dev-server] Mock API listening on http://localhost:${PORT}${API_PREFIX}`);
});
