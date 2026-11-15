#!/bin/bash
set -e
node tests/patient-design-migration-v08443.test.cjs
node tests/patient-design-migration-v08444.test.cjs
npm run test:colorectal-v08434
npm run test:colorectal-v08435
npm run test:colorectal-v08436
npm run test:neuroendocrine-v08437
npm run test:neuro-oncology-v08438
npm run test:neuro-oncology-v08439
npm run test:skin-melanoma-v08440
npm run test:skin-melanoma-v08441
npm run test:skin-melanoma-v08442
npm run test:patient-design
npm run test:head-neck-v08445
npm run test:head-neck-v08446
npm run test:head-neck-v08447
npm run test:head-neck-v08448
npm run test:head-neck-v08449
npm run test:head-neck-v08450
npm run test:prostate-v08451
npm run test:adt-v08452
npm run test:adt-v08453
