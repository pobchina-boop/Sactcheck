'use strict';
// These archived batches reused the public version numbers of other tumour groups.
const releases = {
  '0.84.62': new Set(['00374', '00205', '00228', '00462', '00554']),
  '0.84.64': new Set(['00675', '00747', '00504', '00754', '00757'])
};
module.exports = function sarcomaTemplateReleases(code) {
  return Object.keys(releases).filter(release => releases[release].has(code));
};
