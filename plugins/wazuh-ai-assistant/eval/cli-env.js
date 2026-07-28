'use strict';

/**
 * Shared CLI bootstrap for eval/'s dashboard-hitting runners (run_live.js, run_plumbing.js,
 * run_multiturn.js, run_persistence.js): the `EVAL_BASE_URL`/`EVAL_USER`/`EVAL_PASS` env parsing
 * and the `fail(message)` exit-2 helper. Zero-dependency CommonJS (Node built-ins only), matching
 * this harness's "zero deps" constraint (see eval/README.md).
 *
 * Not used by run_load.js (its own `getParam` variant also accepts argv tokens -- a different
 * contract) or sse_client.js (no env parsing of its own).
 *
 * `PASS` is validated at import time so a runner fails immediately with an actionable message
 * rather than on its first authenticated request.
 */

const BASE_URL = (
  process.env.EVAL_BASE_URL || 'https://localhost:8443'
).replace(/\/$/, '');
const USER = process.env.EVAL_USER || 'admin';
const PASS = process.env.EVAL_PASS;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

if (!PASS)
  fail('EVAL_PASS is required (the dashboard password for EVAL_USER).');

module.exports = { BASE_URL, USER, PASS, fail };
