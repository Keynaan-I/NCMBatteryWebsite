// Central client for both NCMBattery APIs:
//  - the public, unauthenticated read API (task types, existing parameter/instruction sets)
//  - the authenticated admin write API (login, create parameter/instruction/battery)
//
// Configure via .env.local (see NCMBatteryWebsite README) -- these fall back to localhost
// so `npm start` against a locally-running PHP server works without extra setup.
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost/api";
const ADMIN_API_BASE = process.env.REACT_APP_ADMIN_API_BASE || "http://localhost/api/admin";

async function handleResponse(res) {
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message = body && body.error ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

function getJSON(url) {
  return fetch(url).then(handleResponse);
}

function postJSON(url, body, csrfToken) {
  const headers = { "Content-Type": "application/json" };
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  return fetch(url, {
    method: "POST",
    credentials: "include", // send/receive the admin session cookie
    headers,
    body: JSON.stringify(body),
  }).then(handleResponse);
}

// -- Public read API ---------------------------------------------------------

export function listTaskTypes() {
  return getJSON(`${API_BASE}/API_list_config.php?resource=task_types`);
}

// taskTypeId is optional for both: omit it to list every task type's sets.
// Each row includes used_by (how many battery tasks reference the set).
export function listParameters(taskTypeId) {
  const q = taskTypeId ? `&task_type_id=${taskTypeId}` : "";
  return getJSON(`${API_BASE}/API_list_config.php?resource=parameters${q}`);
}

export function listInstructions(taskTypeId) {
  const q = taskTypeId ? `&task_type_id=${taskTypeId}` : "";
  return getJSON(`${API_BASE}/API_list_config.php?resource=instructions${q}`);
}

export function listBatteries() {
  return getJSON(`${API_BASE}/API_list_config.php?resource=batteries`);
}

export function getParameterDetail(taskName, parameterName) {
  const q = new URLSearchParams({ type: "parameters", task: taskName, name: parameterName });
  return getJSON(`${API_BASE}/API_task_config.php?${q}`);
}

export function getInstructionDetail(taskName, instructionName, language = "EN") {
  const q = new URLSearchParams({ type: "instructions", task: taskName, name: instructionName, lang: language });
  return getJSON(`${API_BASE}/API_task_config.php?${q}`);
}

// -- Admin auth ---------------------------------------------------------------

export function login(username, password) {
  return postJSON(`${ADMIN_API_BASE}/API_admin_login.php`, { username, password });
}

export function logout() {
  return postJSON(`${ADMIN_API_BASE}/API_admin_logout.php`, {});
}

/** Checks whether the httpOnly session cookie still represents a logged-in admin. */
export function whoami() {
  return fetch(`${ADMIN_API_BASE}/API_admin_whoami.php`, { credentials: "include" }).then(handleResponse);
}

// -- Admin writes (all require a csrfToken from login()/whoami()) -------------

export function createParameter(csrfToken, { taskTypeId, taskName, parameterName, language, parameters }) {
  return postJSON(
    `${ADMIN_API_BASE}/API_admin_create_parameter.php`,
    { task_type_id: taskTypeId, task_name: taskName, parameter_name: parameterName, language, parameters },
    csrfToken
  );
}

export function createInstruction(csrfToken, { taskTypeId, taskName, instructionName, language, instructions }) {
  return postJSON(
    `${ADMIN_API_BASE}/API_admin_create_instruction.php`,
    { task_type_id: taskTypeId, task_name: taskName, instruction_name: instructionName, language, instructions },
    csrfToken
  );
}

export function createBattery(csrfToken, batteryPayload) {
  return postJSON(`${ADMIN_API_BASE}/API_admin_create_battery.php`, batteryPayload, csrfToken);
}

// -- Admin reads and lifecycle (copy-on-edit) ---------------------------------
// Nothing is edited in place: the UI loads a record with getRecord(), and saves
// changes as a NEW record via createParameter/createInstruction/createBattery.

/** type is "parameter" | "instruction" | "battery"; id is that table's primary key. */
export function getRecord(type, id) {
  const q = new URLSearchParams({ type, id });
  return fetch(`${ADMIN_API_BASE}/API_admin_get.php?${q}`, { credentials: "include" }).then(handleResponse);
}

/** Refused by the server if a parameter/instruction set is in use, or a battery is still active. */
export function deleteRecord(csrfToken, type, id) {
  return postJSON(`${ADMIN_API_BASE}/API_admin_delete.php`, { type, id }, csrfToken);
}

export function setBatteryActive(csrfToken, batteryId, active) {
  return postJSON(`${ADMIN_API_BASE}/API_admin_set_battery_active.php`, { battery_id: batteryId, active }, csrfToken);
}
