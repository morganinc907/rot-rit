// Shared helpers for tests
const hasFn = (c, sig) => Boolean(c.interface && c.interface.functions && c.interface.functions[sig]);
const Slots = { HEAD:0, FACE:1, BODY:2, COLOR:3, BACKGROUND:4 };
const Relic = { KEY:1, FRAGMENT:2, MASK:3, DAGGER:4, VIAL:5, ASH:8 };
module.exports = { hasFn, Slots, Relic };


const expect = require("chai").expect;

/** expectEventArgs: checks that receipt emitted an event with matching name and partial args */
function expectEventArgs(txReceipt, eventName, matcher) {
  const evts = txReceipt.events?.filter(e => e.event === eventName) || [];
  expect(evts.length, `Event ${eventName} not found`).to.be.greaterThan(0);
  const evt = evts[0];
  matcher(evt.args);
}

function decodeBase64Json(dataUri) {
  const prefix = "data:application/json;base64,";
  if (!dataUri.startsWith(prefix)) throw new Error("Invalid data URI");
  const b64 = dataUri.slice(prefix.length);
  const jsonStr = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(jsonStr);
}

module.exports.expectEventArgs = expectEventArgs;
module.exports.decodeBase64Json = decodeBase64Json;
