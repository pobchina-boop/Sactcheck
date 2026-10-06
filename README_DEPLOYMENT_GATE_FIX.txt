SACTCheck v0.81.1 deployment-gate test correction

Purpose
-------
This patch changes NO runtime application files and NO clinical content.
It updates one historical regression test so it tests the v0.81 architecture correctly.

Why Pages was still failing
---------------------------
v0.81 moved dedicated patient guides away from the historical dynamic about:blank
renderer and into protected static /patient/<code>/guide.pdf assets. The old test still
required the dynamic renderer to generate the HCC anatomy for a dedicated regimen.

Correct behaviour now tested
----------------------------
1. NCCP 00831 dedicated Patient Guide opens:
   https://sactcheck.com/patient/00831/guide.pdf
2. Dedicated guide output must not use about:blank.
3. The historical dynamic renderer is still regression-tested in its remaining
   consent-support/fallback role, including the HCC anatomy and bevacizumab risks.

App version remains v0.81.1 because this is test/deployment-gate maintenance only.
