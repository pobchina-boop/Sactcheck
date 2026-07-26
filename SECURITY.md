# Security policy

## Supported version

Only the current production release of SACTCheck is supported. Older development ZIP files and local copies should be treated as superseded once a new production release is published.

## Reporting a vulnerability

Please use **GitHub private vulnerability reporting** from the repository **Security** tab. Do not open a public issue for a suspected security vulnerability.

Include:

- the affected SACTCheck version;
- the relevant URL or file;
- reproducible steps using hypothetical, non-identifiable information;
- the expected and observed behaviour;
- the potential impact;
- any suggested mitigation.

Do not include patient-identifiable information, real clinical records, passwords, API keys, access tokens or other secrets.

## Clinical-content discrepancies

A suspected clinical-rule or NCCP-source discrepancy is not normally a software-security vulnerability. Use the structured **Protocol-content discrepancy** issue form and provide the official NCCP source/version. Do not include information about a real patient.

## Data boundary

SACTCheck is designed for clinician-entered hypothetical or non-identifiable assessment information during feasibility evaluation. Credentials, secrets and identifiable health information must never be committed to this repository or entered into public issue reports.
