/**
 * Risk Engine — deterministic, configurable.
 *
 * DEMONSTRATION RULES ONLY — these weights are illustrative and are NOT
 * universal financial risk standards. Configure via RISK_WEIGHTS env JSON.
 *
 * Default demo weights:
 *   AMOUNT_ANOMALY   = 20
 *   NEW_DEVICE       = 20
 *   NEW_LOCATION     = 15
 *   UNUSUAL_TIME     = 10
 *   PREVIOUS_ALERT   = 20
 *   SHARED_DEVICE    = 15
 *
 * Score capped at 100.
 *   0–25  LOW | 26–50 MEDIUM | 51–75 HIGH | 76–100 CRITICAL
 */

const DEFAULT_WEIGHTS = {
  AMOUNT_ANOMALY: 20,
  NEW_DEVICE: 20,
  NEW_LOCATION: 15,
  UNUSUAL_TIME: 10,
  PREVIOUS_ALERT: 20,
  SHARED_DEVICE: 15,
};

function getWeights() {
  try {
    const fromEnv = process.env.RISK_WEIGHTS ? JSON.parse(process.env.RISK_WEIGHTS) : {};
    return { ...DEFAULT_WEIGHTS, ...fromEnv };
  } catch {
    return { ...DEFAULT_WEIGHTS };
  }
}

function levelForScore(score) {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MEDIUM';
  return 'LOW';
}

/**
 * @param {Array} anomalies  output of AnomalyAgent
 * @param {Array} evidence   combined evidence registry items
 * @returns {{score:number, level:string, factors:Array}}
 */
function calculateRisk(anomalies, evidence) {
  const weights = getWeights();
  const factors = [];
  let score = 0;

  const has = (type) => anomalies.some((a) => a.type === type);
  const evIdsFor = (type) => evidence.filter((e) => e.type === type).map((e) => e.evidenceId);

  if (has('AMOUNT_ANOMALY')) {
    score += weights.AMOUNT_ANOMALY;
    factors.push({
      type: 'AMOUNT_ANOMALY',
      weight: weights.AMOUNT_ANOMALY,
      evidenceIds: evIdsFor('AMOUNT_ANOMALY').length
        ? evIdsFor('AMOUNT_ANOMALY')
        : evIdsFor('AMOUNT_DEVIATION').concat(evIdsFor('AMOUNT_CONTEXT')),
      description: 'Transaction amount significantly above historical baseline.',
    });
  }
  if (has('NEW_DEVICE')) {
    score += weights.NEW_DEVICE;
    factors.push({
      type: 'NEW_DEVICE',
      weight: weights.NEW_DEVICE,
      evidenceIds: evIdsFor('NEW_DEVICE'),
      description: 'Device not previously used by this customer.',
    });
  }
  if (has('UNUSUAL_LOCATION')) {
    score += weights.NEW_LOCATION;
    factors.push({
      type: 'NEW_LOCATION',
      weight: weights.NEW_LOCATION,
      evidenceIds: evIdsFor('UNUSUAL_LOCATION').concat(evIdsFor('LOCATION_ANOMALY'), evIdsFor('LOCATION_DEVIATION')),
      description: 'Transaction location outside usual pattern.',
    });
  }
  if (has('UNUSUAL_TIME')) {
    score += weights.UNUSUAL_TIME;
    factors.push({
      type: 'UNUSUAL_TIME',
      weight: weights.UNUSUAL_TIME,
      evidenceIds: evIdsFor('UNUSUAL_TIME').concat(evIdsFor('TIME_DEVIATION')),
      description: 'Transaction occurred during unusual hours.',
    });
  }
  if (has('PREVIOUS_ALERT') || evIdsFor('PREVIOUS_ALERT').length || evIdsFor('PREVIOUS_CASE').length) {
    score += weights.PREVIOUS_ALERT;
    factors.push({
      type: 'PREVIOUS_ALERT',
      weight: weights.PREVIOUS_ALERT,
      evidenceIds: evIdsFor('PREVIOUS_ALERT').concat(evIdsFor('PREVIOUS_CASE')),
      description: 'Device or customer linked to previous alerts/cases.',
    });
  }
  if (evIdsFor('SHARED_DEVICE').length) {
    score += weights.SHARED_DEVICE;
    factors.push({
      type: 'SHARED_DEVICE',
      weight: weights.SHARED_DEVICE,
      evidenceIds: evIdsFor('SHARED_DEVICE'),
      description: 'Device is shared across multiple customers.',
    });
  }

  score = Math.min(score, 100);
  return { score, level: levelForScore(score), factors };
}

module.exports = { calculateRisk, levelForScore, DEFAULT_WEIGHTS };
