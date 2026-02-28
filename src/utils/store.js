const STORE_KEY = 'prep_civique_profile';

export function getProfile() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return {
    diagnosticDone: false,
    scores: {},
    globalScore: 0,
    streak: 0,
    lastSessionDate: null,
    srs: {}
  };
}

export function saveProfile(profile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORE_KEY, JSON.stringify(profile));
}

export function saveDiagnostic(scores, globalScore) {
  const profile = getProfile();
  if (!profile) return;
  profile.diagnosticDone = true;
  profile.scores = scores;
  profile.globalScore = globalScore;
  saveProfile(profile);
}

// SM-2 logic
// grade: 0=Again, 1=Hard, 2=Good, 3=Easy
export function updateSrsItem(slug, grade) {
  const profile = getProfile();
  if (!profile) return;
  let item = profile.srs[slug];
  
  if (!item) {
    item = { ease: 2.5, interval: 0, reps: 0, nextReview: Date.now() };
  }
  
  // Grade map from Anki-like (0-3) to SM-2 (0-5)
  // Again(0)->0, Hard(1)->3, Good(2)->4, Easy(3)->5
  let quality = 0;
  if (grade === 1) quality = 3;
  else if (grade === 2) quality = 4;
  else if (grade === 3) quality = 5;

  if (quality < 3) {
    item.reps = 0;
    item.interval = 1;
  } else {
    if (item.reps === 0) item.interval = 1;
    else if (item.reps === 1) item.interval = 6;
    else {
      item.interval = Math.round(item.interval * item.ease);
    }
    item.reps += 1;
  }
  
  item.ease = item.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (item.ease < 1.3) item.ease = 1.3;
  
  // Set next review to end of day of the target interval to avoid immediate reviews
  // For simplicity, we just add days in milliseconds
  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  // If grade was 0 (Again), next review is now (so it could be repeated, but we just set it to now to be due immediately next session)
  item.nextReview = Date.now() + (quality < 3 ? 0 : item.interval * DAY_IN_MS);
  
  profile.srs[slug] = item;
  saveProfile(profile);
}

export function getDueItems(allSlugs, maxDue = 10, maxNew = 5) {
  const profile = getProfile();
  if (!profile) return { due: [], newItems: [] };
  const now = Date.now();
  let due = [];
  let newItems = [];
  
  for (const slug of allSlugs) {
    const item = profile.srs[slug];
    if (item) {
      if (item.nextReview <= now) {
        due.push(slug);
      }
    } else {
      newItems.push(slug);
    }
  }
  
  // Shuffle due and new items
  due = due.sort(() => Math.random() - 0.5).slice(0, maxDue);
  newItems = newItems.sort(() => Math.random() - 0.5).slice(0, maxNew);
  
  return { due, newItems };
}

export function recordSessionComplete() {
  const profile = getProfile();
  if (!profile) return;
  const today = new Date().toISOString().split('T')[0];
  
  if (profile.lastSessionDate !== today) {
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterday = yesterdayDate.toISOString().split('T')[0];
    if (profile.lastSessionDate === yesterday) {
      profile.streak += 1;
    } else {
      profile.streak = 1;
    }
    profile.lastSessionDate = today;
    saveProfile(profile);
  }
}

export function clearProfile() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORE_KEY);
  }
}
