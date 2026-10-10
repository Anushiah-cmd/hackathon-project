(function () {
  const STORAGE_KEY = 'crimvexa-demo-v1';

  const seedCases = [
    {
      id: 'CVX-DEMO-0001',
      reporterName: 'Aisha N.',
      email: 'aisha@example.com',
      incidentType: 'Theft',
      incidentDate: '2026-10-01',
      location: 'College gate parking bay',
      description: 'Someone stole my bicycle lock and helmet from the campus rack near the main gate. I saw a man in a red jacket leaving toward the east gate and there is a CCTV camera there.',
      status: 'UNDER_REVIEW',
      category: 'THEFT',
      analysis: {
        level: 'MEDIUM',
        score: 62,
        reasons: ['Property reported missing', 'Possible camera coverage at the area', 'No immediate threat described'],
        missingFields: ['witness_details']
      },
      caseLinks: [
        { id: 'CVX-DEMO-0031', score: 0.74, reason: 'Stolen bicycle near campus gate' }
      ],
      mockPortal: null,
      statusHistory: [
        { status: 'SUBMITTED', timestamp: '2026-10-01T09:00:00.000Z', actor: 'system', note: 'Complaint created.' },
        { status: 'UNDER_REVIEW', timestamp: '2026-10-01T09:22:00.000Z', actor: 'Officer', note: 'Case assigned to review.' }
      ],
      createdAt: '2026-10-01T09:00:00.000Z',
      evidence: []
    },
    {
      id: 'CVX-DEMO-0002',
      reporterName: 'Karan P.',
      email: 'karan@example.com',
      incidentType: 'Assault',
      incidentDate: '2026-10-04',
      location: 'Demo market lane',
      description: 'A person attacked a shopkeeper with a stick near the market lane. A witness called the police and the assailant ran toward the bus stop.',
      status: 'NEEDS_INFORMATION',
      category: 'ASSAULT',
      analysis: {
        level: 'HIGH',
        score: 84,
        reasons: ['Violence was reported', 'Possible ongoing threat', 'Witness information may help follow-up'],
        missingFields: ['injury_details']
      },
      caseLinks: [
        { id: 'CVX-DEMO-0042', score: 0.81, reason: 'Similar assault in nearby market lane' }
      ],
      mockPortal: null,
      statusHistory: [
        { status: 'SUBMITTED', timestamp: '2026-10-04T16:25:00.000Z', actor: 'system', note: 'Complaint created.' },
        { status: 'NEEDS_INFORMATION', timestamp: '2026-10-04T16:45:00.000Z', actor: 'Officer', note: 'Requesting injury and witness details.' }
      ],
      createdAt: '2026-10-04T16:25:00.000Z',
      evidence: []
    }
  ];

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ cases: seedCases, lastCaseNumber: 2 }));
        return { cases: seedCases, lastCaseNumber: 2 };
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.cases)) {
        parsed.cases = seedCases;
      }
      if (!('lastCaseNumber' in parsed)) {
        parsed.lastCaseNumber = parsed.cases.length;
      }
      return parsed;
    } catch (error) {
      return { cases: seedCases, lastCaseNumber: seedCases.length };
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getCaseById(caseId) {
    const data = loadData();
    return data.cases.find((item) => item.id === caseId) || null;
  }

  function padNumber(value) {
    return String(value).padStart(4, '0');
  }

  function nextCaseNumber() {
    const data = loadData();
    const next = (data.lastCaseNumber || data.cases.length || 0) + 1;
    data.lastCaseNumber = next;
    saveData(data);
    return next;
  }

  function generateCaseId() {
    const count = nextCaseNumber();
    return `CVX-DEMO-${padNumber(count)}`;
  }

  function calculatePriority(text) {
    let score = 25;
    const reasons = [];
    const lower = (text || '').toLowerCase();

    if (/(injured|hurt|bleeding|attack|assault|gun|knife|threat|chased|abuse|kidnapp)/i.test(lower)) {
      score += 30;
      reasons.push('Immediate harm or threat described.');
    }
    if (/(stolen|robbed|missing|lost|theft|snatched|broken into)/i.test(lower)) {
      score += 18;
      reasons.push('Property loss or theft reported.');
    }
    if (/(witness|camera|video|vehicle|plate|license)/i.test(lower)) {
      score += 12;
      reasons.push('Useful evidence details were provided.');
    }
    if (/(today|now|currently|ongoing|still there)/i.test(lower)) {
      score += 10;
      reasons.push('The incident appears recent or ongoing.');
    }
    if (/(unknown|not sure|unclear)/i.test(lower)) {
      score -= 8;
      reasons.push('Some details remain uncertain.');
    }

    if (reasons.length === 0) {
      reasons.push('The report was reviewed as a general incident.');
    }

    let level = 'LOW';
    if (score >= 75) level = 'HIGH';
    else if (score >= 45) level = 'MEDIUM';

    return {
      level,
      score: Math.min(100, Math.max(10, score)),
      reasons: reasons.slice(0, 3)
    };
  }

  function inferCategory(text) {
    const lower = (text || '').toLowerCase();
    if (/(assault|attack|hurt|beat|stab|threat|abuse)/i.test(lower)) return 'ASSAULT';
    if (/(fraud|scam|bank|payment|fake|cheat|phishing)/i.test(lower)) return 'ONLINE_FRAUD';
    if (/(stolen|theft|missing|snatched|robbed|bike|phone|wallet|bag)/i.test(lower)) return 'THEFT';
    if (/(harass|harrassment|stalking|abuse|threat|followed)/i.test(lower)) return 'HARASSMENT';
    if (/(missing person|missing|person gone|disappeared)/i.test(lower)) return 'MISSING_PERSON';
    if (/(burglary|break in|robbery|house|shop broken)/i.test(lower)) return 'BURGLARY';
    return 'OTHER';
  }

  function findCaseLinks(description, category, limit = 3) {
    const data = loadData();
    const target = (description || '').toLowerCase();
    const candidates = data.cases
      .filter((caseItem) => caseItem.id !== null)
      .map((caseItem) => {
        const text = `${caseItem.description || ''} ${caseItem.location || ''} ${caseItem.category || ''}`.toLowerCase();
        const overlap = [...new Set((target.match(/[a-z]+/g) || []).filter((word) => word.length > 3))]
          .filter((word) => text.includes(word));
        const score = overlap.length ? (overlap.length / Math.max(1, text.split(/[\s]+/).length)) : 0;
        return { id: caseItem.id, score: Number(Math.min(0.95, 0.5 + score).toFixed(2)), reason: overlap.length ? `Matches keywords: ${overlap.slice(0, 3).join(', ')}` : 'Shared incident area or type.' };
      })
      .filter((link) => link.score > 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return candidates.length ? candidates : [{ id: 'NO-LINKS', score: 0, reason: 'No strong synthetic matches found.' }];
  }

  function buildAnalysis(description, location, incidentType) {
    const priority = calculatePriority(`${description} ${location} ${incidentType}`);
    const category = inferCategory(`${description} ${location} ${incidentType}`);
    const missingFields = [];

    if (!location || location.trim().length < 4) missingFields.push('location');
    if (!description || description.trim().length < 20) missingFields.push('description');
    if (!incidentType || incidentType.trim().length === 0) missingFields.push('incidentType');

    return {
      category,
      priority,
      missingFields,
      caseLinks: findCaseLinks(description, category)
    };
  }

  function createStatusHistory(status, actor = 'system', note = '') {
    return {
      status,
      actor,
      note: note || `${actor} updated the status to ${status}.`,
      timestamp: new Date().toISOString()
    };
  }

  function addCase(newCase) {
    const data = loadData();
    const analysis = buildAnalysis(newCase.description, newCase.location, newCase.incidentType);
    const finalCase = {
      id: newCase.id || generateCaseId(),
      reporterName: newCase.reporterName || 'Anonymous Reporter',
      email: newCase.email || '',
      incidentType: newCase.incidentType || 'Other',
      incidentDate: newCase.incidentDate || new Date().toISOString().slice(0, 10),
      location: newCase.location || 'Not provided',
      description: newCase.description || '',
      language: newCase.language || 'en',
      evidence: Array.isArray(newCase.evidence) ? newCase.evidence : [],
      category: newCase.category || analysis.category,
      status: newCase.status || 'SUBMITTED',
      analysis: newCase.analysis || {
        level: analysis.priority.level,
        score: analysis.priority.score,
        reasons: analysis.priority.reasons,
        missingFields: analysis.missingFields
      },
      caseLinks: newCase.caseLinks || analysis.caseLinks,
      mockPortal: newCase.mockPortal || null,
      createdAt: newCase.createdAt || new Date().toISOString(),
      statusHistory: Array.isArray(newCase.statusHistory) && newCase.statusHistory.length
        ? newCase.statusHistory
        : [createStatusHistory(newCase.status || 'SUBMITTED', 'system', 'Complaint submitted by citizen.')]
    };

    const existingIndex = data.cases.findIndex((item) => item.id === finalCase.id);
    if (existingIndex >= 0) {
      data.cases[existingIndex] = finalCase;
    } else {
      data.cases.unshift(finalCase);
      data.lastCaseNumber = Math.max(data.lastCaseNumber || 0, Number((finalCase.id.match(/(\d+)$/) || [0, 0])[1]));
    }
    saveData(data);
    return finalCase;
  }

  function updateStatus(caseId, nextStatus, actor = 'Officer', message = '') {
    const data = loadData();
    const target = data.cases.find((item) => item.id === caseId);
    if (!target) return null;

    const statusEntry = createStatusHistory(nextStatus, actor, message || `${actor} updated the case to ${nextStatus}.`);
    target.status = nextStatus;
    target.statusHistory = Array.isArray(target.statusHistory) ? [statusEntry, ...target.statusHistory] : [statusEntry];
    saveData(data);
    return target;
  }

  function formatDate(dateValue) {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

  window.Crimvexa = {
    STORAGE_KEY,
    loadData,
    saveData,
    getCaseById,
    addCase,
    updateStatus,
    generateCaseId,
    buildAnalysis,
    formatDate,
    findCaseLinks,
    calculatePriority,
    inferCategory
  };
})();
