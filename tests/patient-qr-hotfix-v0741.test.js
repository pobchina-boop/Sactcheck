"use strict";
const assert=require("assert");
const Qr=require("../js/patient-qr-hotfix-v0741.js");

assert.strictEqual(Qr.release,"0.74.1");
assert.strictEqual(Qr.publicBase,"https://sactcheck.com/");

const link=Qr.canonicalRegimenLink({protocol_id:"nccp-00688"});
assert.strictEqual(link,"https://sactcheck.com/?patientSupport=nccp-00688");
assert.ok(!/^file:/i.test(link));
assert.ok(!/localhost|127\.0\.0\.1/i.test(link));

const special=Qr.canonicalRegimenLink("NCCP 00688 / test");
assert.ok(special.startsWith("https://sactcheck.com/?patientSupport="));
assert.strictEqual(new URL(special).searchParams.get("patientSupport"),"NCCP 00688 / test");

const qr=Qr.canonicalQrUrl("nccp-00688");
const q=new URL(qr);
assert.strictEqual(q.hostname,"api.qrserver.com");
assert.strictEqual(
  decodeURIComponent(q.searchParams.get("data")),
  "https://sactcheck.com/?patientSupport=nccp-00688"
);

console.log("v0.74.1 QR routing tests passed: public HTTPS regimen links only.");
