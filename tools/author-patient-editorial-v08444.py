#!/usr/bin/env python3
"""Explicit, repeatable patient editorial migration. Never changes clinician rules.

The input catalogue is the frozen .43 inventory, embedded in the audit record on
first execution. Re-running uses that audit record and is a no-op for already
revised source objects. Clinical schedules are retained under their original
NCCP/medicine sources; educational prose is independently written below.
"""
from pathlib import Path
import copy, hashlib, json, re, sys

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'validation/patient-design-v08444'
OUT.mkdir(parents=True,exist_ok=True)
DATE='2026-11-07'
VERSION='0.84.44'
INVENTORY=OUT/'editorial-baseline-inventory.json'
if not INVENTORY.exists():
    supplied=Path(sys.argv[1]) if len(sys.argv)>1 else None
    if not supplied or not supplied.is_file():
        raise SystemExit('First run requires the frozen v0.84.43 NCCN payload inventory')
    INVENTORY.write_text(supplied.read_text())
inventory=json.loads(INVENTORY.read_text())

# Original SACTCheck explanations, written for the patient's question. The
# dictionary is deliberately explicit: no generative fallback or generic panel.
TEXT={
0:'Before each visit, check four things: the blood-test booking, how you will get there, your medicine supply and any help you need. Ask who will review the results and tell you whether the next dose can go ahead.',
1:'Keep the handbook, short guide and treatment card in one place. Ask your team to fill in the real daytime and emergency numbers and print a replacement when the plan changes. A phone is optional.',
2:'Record where the melanoma began, its pathology result and the sites involved now. This pathway treats melanoma that cannot be fully removed or has spread. Treatment after complete removal has a different aim and a separate plan.',
3:'The laboratory checks a sample of the melanoma for a BRAF V600 change. The result can identify a target for certain medicines. A change found in the tumour does not, by itself, establish an inherited condition.',
4:'Add planned scans, any operation and any radiotherapy to the same calendar. Ask what each part is intended to achieve and which team arranges it.',
5:'Tell your team about a changing mole, a persistent sore, a new lump or an unexplained symptom. Improvement in a known tumour does not explain a new problem elsewhere.',
6:'Write down where blood samples are taken, who receives the results and how you obtain the next appointment or medicine supply. Request a printed plan if that is easier to use.',
7:'Bring up difficulties with eating, sleep, pain, energy, work or caring for someone. The team can arrange symptom support while cancer treatment continues.',
8:'Choose food, fluids and movement that you can manage, within any personal restrictions. Ask for help early if you are losing weight, drinking less or finding everyday activity harder.',
9:'You can request a private discussion about intimacy, sexual symptoms or relationships. Ask for help if the agreed pregnancy precautions are difficult to follow.',
10:'Supportive care addresses symptoms and daily life during cancer treatment. Palliative care can be part of that support; accepting it does not mean you must stop anticancer treatment.',
11:'Choose whether to involve a relative or supporter and what may be shared with them. Ask for an interpreter or a different information format. Check that you can explain the next dose, tests and urgent-contact plan in your own words.',
12:'Keep the current treatment summary, medicine list, test plan and contact card together. Use the printed instructions when you need them; the QR code is an optional link to further information.',
13:'Ask for a treatment summary showing what you received, important side effects, admissions, the last dose and the follow-up team. Share the current version with your GP and other clinicians.',
14:'Before leaving, confirm the next test and review, how you will receive results and whom to call sooner. Keep those numbers available after treatment ends.',
16:'Let the team know if cramps, altered taste or poor appetite make eating or moving difficult. Ask for practical food and activity advice that fits your symptoms and any other illness.',
18:'Plan blood tests, travel and medicine collection in advance. If you need an interpreter or someone to help at home, tell the team before the appointment.',
19:'Ask for your latest schedule and contact details on paper. Replace old versions when treatment changes so everyone helping you uses the same plan.',
20:'Basal cell carcinoma starts in the skin. It usually grows locally; spread to distant organs is uncommon. Your team assesses the affected area and whether surgery or radiotherapy can treat it.',
21:'Vismodegib is used in the advanced basal cell carcinoma settings specified in your treatment protocol. Ask the team to explain why this medicine is suitable and why an operation or radiotherapy alone is not the agreed option.',
22:'Record previous operations, radiotherapy and other treatment to the same area. These details help the team plan further treatment and interpret changes in the skin.',
23:'Several basal cell cancers at a young age or a suggestive family history may warrant a genetics assessment. Gorlin syndrome is one possible inherited cause. Testing is selected for the person; it is not required for every skin cancer.',
24:'The team may measure or photograph a visible lesion and examine deeper tissue or lymph nodes. Scans are used when they answer a specific question. A photograph alone cannot show the full extent of disease.',
25:'Ask how the medicine fits with previous or planned local treatment. The timing of an operation, radiotherapy and a tablet course should be written in one agreed plan.',
26:'Bring your medicine list, allergy information and questions. Tell the team about practical problems with travel, swallowing, wound care or remembering doses before treatment starts.',
27:'Keep a named contact for bookings and results. If an expected appointment or result is missing, call that service; do not take silence as confirmation that everything is complete.',
28:'Report nausea, mouth discomfort, diarrhoea or weight loss before they make eating and drinking difficult. The team can adjust symptom support and arrange dietitian or rehabilitation advice.',
29:'Protect exposed skin with clothing, a hat and shade. Use broad-spectrum sunscreen with SPF 30 or higher and reapply as directed. Avoid sunbeds. Cloudy weather does not remove ultraviolet exposure.',
30:'Ask the team to show you how to check your skin and treated area. Use a mirror or a helper for areas you cannot see. Report a new lump, a changing lesion or a sore that does not heal.',
31:'A private, dated photograph can help describe a change if your team finds it useful. Keep the lighting and size reference consistent. Photographs support a discussion; they do not replace examination and need not be uploaded.',
32:'Follow the wound and skin-care instructions for the treated area. Ask before adding a cream or remedy. Increasing redness, discharge, pain, bleeding or difficulty using the area needs assessment.',
33:'Ask what outcome this treatment aims to improve for your diagnosis and what alternatives exist. Results from a study group help a discussion but cannot promise your own result.',
34:'Agree the next decision point and what would make the plan change. Ask about other suitable treatments, trials and symptom care. Support for comfort and function can continue alongside cancer treatment.',
35:'Tell the team what is hardest in daily life: travel, work, caring duties, costs, sleep or confidence. Ask who can help and how to contact them.',
36:'Before going home, check that you can describe your medicine schedule, next tests and urgent-contact route. Ask for an interpreter, larger print or a supporter if that would help.',
37:'Follow-up covers the treated area and the rest of your skin. The team chooses examinations and scans for your situation. Vismodegib pregnancy-prevention and donation restrictions continue for the periods listed in your safety plan after the final dose.',
38:'Use this handbook as your paper record. Keep the current schedule, medicines, tests and contacts together, and replace outdated pages after a change. The matching QR link is optional.',
39:'A neuroendocrine tumour begins in cells with hormone-making features. Its starting organ and the places it has spread are separate parts of the diagnosis. A pancreatic neuroendocrine tumour differs from pancreatic adenocarcinoma; a deposit in the liver may have come from another organ.',
40:'The pathology report describes how organised the cells look (differentiation) and their growth activity (grade). Ki-67 measures cells showing a growth-related protein in the sample. Its percentage describes that sample, not the amount of your body affected or your chance of survival.',
41:'Stage describes extent; grade describes tumour biology. Either can vary independently. A well-differentiated grade 3 neuroendocrine tumour and a poorly differentiated neuroendocrine carcinoma are distinct diagnoses and may need different treatments.',
42:'A functioning tumour produces a hormone syndrome. A nonfunctioning tumour can still cause problems through growth or pressure. Somatostatin receptor uptake on a scan shows a treatment target; it does not, on its own, identify a hormone syndrome.',
43:'Ask for one diagnosis summary: starting organ, grade, differentiation, Ki-67 result if reported, sites involved, hormone syndrome and receptor-imaging result. Keep pending results clearly marked.',
44:'Blood counts assess oxygen-carrying cells, infection-fighting cells and platelets. Kidney and liver results help assess treatment safety. These checks are needed even when you feel well; a reassuring scan answers a different question.',
45:'CT and MRI show anatomy and tumour size. Somatostatin receptor imaging tests whether a particular receptor target is present. An FDG-PET scan measures uptake of a glucose-like tracer and is used selectively. Your team chooses the scans that can guide your care.',
46:'Selected markers may help answer a hormone or tumour question. Examples include 5-HIAA for serotonin-related symptoms, chromogranin A, or a specific pancreatic hormone. They are not a routine panel for every neuroendocrine tumour. Interpret changes with symptoms and imaging.',
47:'Use the laboratory instructions for fasting, food restrictions and any timed urine collection. Some medicines affect marker results, including acid-suppressing medicines and chromogranin A. Ask the team what to do; do not stop a prescribed medicine yourself.',
48:'Some hormone syndromes can affect heart valves, so an ultrasound of the heart may be requested. Inherited-risk assessment depends on the tumour and family history; multiple endocrine neoplasia type 1 is one example. An inherited-risk test and a test of tumour tissue answer different questions.',
49:'For each test, write its name, purpose, booking date and result-review contact. Ask the team to set your next scan or marker date. A schedule for someone after surgery may not apply during your treatment.',
50:'Keep a brief record of your usual bowel pattern, flushing, appetite, weight, pain and energy. Note new changes and when they started. This helps the team assess whether treatment, hormones or another problem needs attention.',
51:'Hormone symptoms depend on the tumour: examples include flushing and watery diarrhoea, acid-related symptoms, or changes in blood sugar. An insulin-producing tumour can lower blood sugar. Ask which symptoms apply to you and whether you need a written rescue plan.',
52:'Hormone-control medicines have their own schedule. A pause in anticancer tablets does not automatically mean pausing those medicines. Before peptide receptor radionuclide therapy, the specialist team coordinates any interruption and restart of somatostatin analogue injections.',
53:'Tell teams arranging an operation, anaesthetic or other procedure about a hormone-producing tumour or previous hormone crisis. Your specialist decides whether extra preparation is needed. Carry the agreed emergency instructions and current medicine list.',
54:'Agree your treatment aim: slowing growth, reducing tumour size, controlling hormone symptoms or preserving daily function. A scan showing no growth may be a useful result even when the tumour has not shrunk.',
55:'Your plan may use different treatments at different times, including surgery, medicines, receptor-targeted radiation or treatment directed at the liver. Ask the team to mark your own sequence and who coordinates it.',
56:'Ask why the proposed option fits the tumour site, grade, receptor findings, symptoms and your health. Discuss reasonable alternatives, observation when appropriate and suitable trials. Your team explains which options are available to you.',
57:'Studies measure different outcomes, such as shrinkage, time before worsening and survival. Ask which outcome matters for your plan and how closely the study group matches your diagnosis. No study average can predict one person’s course.',
58:'Agree when to review the plan and what could lead to continuing, pausing or changing treatment. Include the effects on work, caring duties, travel and the activities that matter to you.',
59:'Report weight loss, persistent diarrhoea, greasy stools or difficulty eating. Different causes need different treatment. Ask for a dietitian and whether reduced digestive-enzyme function needs assessment.',
60:'Use your personal fluid advice, especially with diarrhoea or heart or kidney disease. Adjust activity and rest to your energy. Report dizziness, breathlessness or fatigue that limits daily tasks so treatable causes can be checked.',
61:'Ask for help with mood, sleep, relationships, intimacy or caring responsibilities when you need it. Symptom and palliative-care teams can support comfort and quality of life while anticancer treatment continues.',
62:'Ask your specialist nurse or social worker about transport, employment, finances and help at home. Tell them about caring responsibilities and ask which support organisations fit your needs.',
63:'Keep a paper schedule, current medicine list and real contact numbers together. The handbook can be read without internet access. Use the written emergency plan whenever you need urgent help.',
64:'For the next visit, choose the questions that matter most: my exact diagnosis; the aim of treatment; which tests I need and why; who explains results; when to call; and what help is available.',
66:'If prescribed, keep steroids and seizure medicines on separate written schedules. Chemotherapy rest days do not tell you when to stop them. Ask the pharmacist to check interactions and explain any dose changes.',
68:'Agree who can help with medicines, travel and appointments if memory, sight, fatigue or hand strength makes them difficult. Record your preferences and consent for sharing information.',
70:'Use your written emergency plan even on days without chemotherapy. Fever, shivering or suddenly feeling unwell needs urgent advice. Call 112 or 999 for a new seizure, sudden weakness or speech difficulty, loss of consciousness, severe breathing difficulty or uncontrolled bleeding. Follow any existing seizure rescue plan. Promptly report worsening headache, repeated vomiting, cough, breathlessness, unusual bruising, yellow skin or eyes, or inability to drink. A held chemotherapy dose must not be restarted without instructions.',
72:'A glioma is a tumour arising in the brain or spinal cord. Astrocytoma, oligodendroglioma and glioblastoma are different types. Cancer that travels to the brain from another organ is a brain metastasis and follows a different pathway.',
73:'Glioma reports combine the tumour type, grade and molecular findings. Grade is not a measure of spread around the body: a grade 4 brain tumour does not mean body-wide metastases. Ask your specialist to explain older terms in your records.',
74:'Changes in the IDH genes and loss of chromosome regions 1p and 19q help classify certain gliomas. The pattern of results matters. These are usually tumour-sample tests; they do not by themselves show that a change runs in the family.',
75:'The MGMT gene makes a protein that repairs a particular type of DNA damage. Methylation in its control region can reduce that repair and inform discussion of temozolomide benefit. This is a tumour-tissue result, not a blood marker or a personal survival percentage.',
76:'Keep the exact pathology diagnosis, sample date, grade and available molecular results together. Label a result as pending or not tested when appropriate. Ask whether further pathology review would affect the plan.',
77:'A full blood count measures red cells, white cells and platelets. Kidney and liver tests assess other aspects of treatment safety. Follow the blood-test schedule even when you feel well or the scan is reassuring.',
78:'MRI gives detailed pictures of the brain. The team also checks symptoms, movement, speech, thinking and daily function. Before scanning, tell staff about implants, metal, kidney problems or previous contrast reactions, and ask for help if the scan worries you.',
79:'Treatment-related changes can resemble tumour growth on MRI; this is called pseudoprogression. The specialist interprets the scan with symptoms and may need another scan or further assessment. Report worsening symptoms promptly rather than assuming a scan change is harmless.',
80:'Record the next MRI and the contact who will explain it. Your diagnosis, treatment phase and previous results determine the interval. Other scans or blood markers are ordered for a specific reason, not automatically before every cycle.',
81:'Mark tests as booked, done and reviewed so the next action is clear. Contact the named service about a missing result. Do not change chemotherapy or steroids in response to a report without instructions.',
82:'Before treatment, note your usual walking, strength, speech, sight, memory, sleep and seizure pattern. Record new changes and their timing. A trusted person can help if you want them involved.',
83:'Fever, shivering or suddenly feeling unwell needs urgent advice, including on treatment rest days. Call 112 or 999 for a new seizure, sudden weakness or speech difficulty, loss of consciousness, severe breathing difficulty or uncontrolled bleeding. Follow the emergency instructions in any established seizure rescue plan.',
84:'Steroids may reduce swelling around a brain tumour. If needed, ask for a written dose, review date and reduction plan; do not stop suddenly or adjust the dose yourself. Report infection symptoms, marked thirst, weakness or troublesome sleep or mood changes.',
85:'Take prescribed seizure medicine on its own schedule. Ask what to do after a missed or vomited dose and how to manage a breakthrough seizure. Do not switch or stop it yourself. Anyone giving a rescue medicine needs the personal instructions and training.',
86:'Discuss driving, work, bathing, swimming, heights and machinery with your team, taking account of symptoms and seizures. Individual medical and licensing advice is needed. Occupational therapy can help make daily routines safer.',
87:'Place biopsy or surgery, radiotherapy, medicines and follow-up on one plan. Concurrent means treatments overlap; adjuvant means treatment follows the main treatment. A new phase can require different doses, tests and support medicines.',
88:'Ask what treatment can reasonably achieve for your tumour and which effects matter most to you. Discuss benefits, burdens, alternatives and the reasons for a pause or stop.',
89:'A study result applies to a particular group, diagnosis and schedule. Older studies may use different tumour names. Ask which evidence fits your plan; an average cannot forecast your response or lifespan.',
90:'Ask about suitable trials, another specialist opinion and other treatment or symptom-care options. Your multidisciplinary team explains what is appropriate and available for you.',
91:'Bring up thinking, independence, family time, work and the side effects you most want to avoid. Ask for time, written notes or a supporter if that helps you weigh the choices.',
92:'Tell the team about changes in memory, language, attention, sight or planning. Rehabilitation can involve physiotherapy, occupational therapy, speech and language therapy or psychology. Ask for practical help with routines and medicines.',
93:'Use your prescribed nausea and bowel plan and report problems early. Ask for dietitian help if intake or weight falls. Adapt movement to your balance and strength, and ask the team to assess fatigue that disrupts daily life.',
94:'Tell the team about changes in mood, behaviour or coping. Patients and carers may each need psychological or practical support. Agree who can receive information and ask for help before caring becomes overwhelming.',
95:'Plan travel, time away from work, caring duties and help with appointments. A nurse or social worker can identify practical support; agree who can help with tablets if needed.',
96:'Supportive and palliative care can help manage symptoms while treatment continues. When you are ready, discuss future care preferences and whom you want involved. Ask your team to help document these wishes.',
97:'Keep the latest paper schedule, medicine list, results plan and emergency contacts together. The treatment card helps others identify your regimen. It supports, but does not replace, the prescription and emergency instructions.',
100:'Keep prescribed steroids and seizure medicines on a separate plan from chemotherapy. Before vincristine, report new weakness, tingling, walking difficulty or constipation. Check new symptom medicines with the team.',
107:'Record the original melanoma site and pathology findings. Breslow thickness and ulceration describe features of the skin tumour; stage describes its extent. Melanoma arising in the eye or a mucosal surface may need a different pathway.',
108:'A BRAF V600 result identifies whether the targeted medicines in this plan can act on the tumour. Keep the laboratory result and date. A tumour change is not, on its own, evidence of an inherited condition.',
109:'Ask whether medicine is intended to reduce recurrence after complete surgery or control cancer that remains. Add any operation or radiotherapy to the plan with its own purpose, timing and risks.',
110:'Stage describes the extent of disease. Response describes a change in measurable cancer during treatment. After complete removal there may be no visible tumour to measure; follow-up then looks for recurrence and treatment effects.',
111:'Report a new or changing mole, a sore that persists, a new lump or an unexplained symptom. A photo or a good response in one area cannot rule out a separate problem.',
112:'Your stage, symptoms and treatment determine follow-up. Write down the skin and lymph-node checks, any body or brain scans and the service arranging them. Confirm your own dates with the team.',
117:'BRAF V600 testing can identify an alternative targeted-treatment option in some melanomas. It is separate from the immunotherapy described here. Ask what your tumour result means for the choices available to you.',
123:'Keep prescribed steroids and seizure medicines on their own schedules. Ask about missed or vomited doses. Agree a bowel plan if other medicines cause constipation and check interactions before adding a medicine.',
125:'Agree help with prescriptions, travel, calls and symptom notes if fatigue, memory, sight or weakness makes these difficult. Your preferences guide who is involved. Keep the printed plan and real urgent contacts together.',
126:'Tell the nurse or social worker about travel, employment, finances and caring responsibilities. Arrange practical help with medicines or appointments if symptoms make those tasks difficult.',
131:'This pathway is for squamous cell carcinoma starting in the skin. Squamous cancers that begin in an internal organ follow different pathways. Keep the original skin site, pathology date and any sites of recurrence or spread in your record.',
132:'The team considers the tumour’s size, depth, site and involvement of nearby structures or nerves, along with recurrence and immune status. Ask which features affect your plan. A risk category is not a measurement of treatment response.',
133:'This cemiplimab pathway applies when advanced skin squamous cell carcinoma cannot appropriately be treated with curative surgery or radiotherapy. Ask the team to record the treatment aim and why this option fits your situation.',
134:'Tell the team about a transplant, autoimmune illness and all immune-suppressing medicines. These can alter the risks of immune treatment. Oncology and the relevant specialists need a shared plan; do not stop transplant medicines or steroids yourself.',
135:'Ask for help with wound care, pain, bleeding, eating, movement or sleep. Keep a contact for worsening bleeding, infection symptoms, new nerve pain or weakness. These changes need assessment rather than waiting for the next photograph.',
136:'Follow-up examines the treated area, other skin and relevant lymph nodes. The team adds scans or other specialist checks for your disease and symptoms. Keep wound care and skin surveillance in the same plan.',
}

AGENTS={
15:'Vismodegib blocks Smoothened, a protein in the Hedgehog signalling pathway. Abnormal activity in this pathway can drive basal cell cancer. Blocking it can slow tumour growth, while effects on normal tissues help explain cramps, taste changes and hair loss.',
65:'Radiotherapy directs a planned dose of radiation to the tumour area. Radiation damages cellular DNA; planning aims to limit exposure of nearby healthy brain. The dose and treated area affect both benefit and side effects.',
103:'Dabrafenib inhibits an altered BRAF protein that sends growth signals inside eligible melanoma cells. Trametinib blocks another step in that pathway. The tumour’s BRAF result is checked before selecting this treatment.',
104:'Trametinib inhibits MEK proteins, which pass growth signals onward inside cells. It is used with dabrafenib in this plan. Normal tissues can also be affected, so heart checks and prompt reporting of eye or breathing symptoms remain important.',
113:'Nivolumab prevents the PD-1 checkpoint from dampening T-cell activity. This can strengthen an immune attack on melanoma. It can also trigger inflammation in healthy organs, including after treatment has ended.',
114:'Ipilimumab blocks the CTLA-4 checkpoint that limits T-cell activity. In this plan it is combined with nivolumab during induction. The stronger immune effect can also increase inflammation in healthy organs.',
119:'Encorafenib blocks altered BRAF signalling in eligible melanoma. Binimetinib acts at a different step in the same growth pathway. Each medicine retains its own dosing and safety instructions.',
120:'Binimetinib inhibits MEK proteins in the growth-signalling pathway. Alongside effects on cancer cells, it can affect muscle, heart and retinal tissue. The prescribed blood and heart checks and prompt review of new eye symptoms help detect these effects.',
128:'Cemiplimab blocks the PD-1 immune checkpoint. This can help T cells recognise and attack skin squamous cell cancer, but increased immune activity can also inflame healthy organs.',
140:'Pembrolizumab blocks the PD-1 checkpoint, allowing T cells to remain more active against cancer. Immune activity can also affect normal organs, so new symptoms matter during treatment and after it stops.',
145:'Nivolumab blocks the PD-1 checkpoint that restrains T cells. The resulting immune activity may control melanoma but can also inflame normal organs. Side effects may first appear after the final dose.',
}

PRIMARY={
 'ed-net-patient':('NCI: gastrointestinal neuroendocrine tumours — patient information','https://www.cancer.gov/types/gi-neuroendocrine-tumors/patient/gi-neuroendocrine-treatment-pdq'),
 'ed-net-markers':('NCI: gastrointestinal neuroendocrine tumours — clinical evidence','https://www.cancer.gov/types/gi-neuroendocrine-tumors/hp/gi-neuroendocrine-treatment-pdq'),
 'ed-pnet-diagnosis':('NCI: pancreatic neuroendocrine tumour diagnosis and tests','https://www.cancer.gov/types/pancreatic/neuroendocrine-tumors/diagnosis'),
 'ed-pnet-types':('NCI: pancreatic neuroendocrine tumour types','https://www.cancer.gov/types/pancreatic/neuroendocrine-tumors'),
 'ed-pnet-symptoms':('NCI: pancreatic neuroendocrine tumour symptoms','https://www.cancer.gov/types/pancreatic/neuroendocrine-tumors/signs-symptoms'),
 'ed-pnet-treatment':('NCI: pancreatic neuroendocrine tumour treatment','https://www.cancer.gov/types/pancreatic/neuroendocrine-tumors/treatment'),
 'ed-nanets-grade':('NANETS expert consensus: high-grade neuroendocrine neoplasms, 2023','https://pmc.ncbi.nlm.nih.gov/articles/PMC10388681/'),
 'ed-brain-patient':('NCI: adult central nervous system tumours — patient information','https://www.cancer.gov/types/brain/patient/adult-brain-treatment-pdq'),
 'ed-brain-molecular':('NCI: adult central nervous system tumours — clinical evidence','https://www.cancer.gov/types/brain/hp/adult-brain-treatment-pdq'),
 'ed-eano':('EANO guideline: diffuse gliomas of adulthood, 2021','https://pmc.ncbi.nlm.nih.gov/articles/PMC7904519/'),
 'ed-rano':('RANO 2.0: response assessment in adult glioma, 2023','https://pmc.ncbi.nlm.nih.gov/articles/PMC10860967/'),
 'ed-melanoma':('NCI: melanoma — patient information','https://www.cancer.gov/types/skin/patient/melanoma-treatment-pdq'),
 'ed-melanoma-clinical':('NCI: melanoma treatment — clinical evidence','https://www.cancer.gov/types/skin/hp/melanoma-treatment-pdq'),
 'ed-skin':('NCI: skin cancer — patient information','https://www.cancer.gov/types/skin/patient/skin-treatment-pdq'),
 'ed-skin-clinical':('NCI: skin cancer treatment — clinical evidence','https://www.cancer.gov/types/skin/hp/skin-treatment-pdq'),
 'ed-sunsmart':('HSE SunSmart: protection from sun and sunbeds','https://www.hse.ie/conditions/cancer/protect-skin-sun-sunbeds/'),
 'ed-palliative':('NCI: palliative care during cancer treatment','https://www.cancer.gov/about-cancer/advanced-cancer/care-choices/palliative-care-fact-sheet'),
 'ed-nutrition':('NCI: eating and nutrition during cancer treatment','https://www.cancer.gov/about-cancer/treatment/side-effects/nutrition'),
 'ed-fatigue':('NCI: fatigue during cancer treatment','https://www.cancer.gov/about-cancer/treatment/side-effects/fatigue'),
 'ed-cea':('NCI: colon cancer treatment — CEA and follow-up','https://www.cancer.gov/types/colorectal/hp/colon-treatment-pdq'),
 'ed-afp':('NCI: adult primary liver cancer — AFP interpretation','https://www.cancer.gov/types/liver/hp/adult-liver-treatment-pdq'),
}
for drug in ['erivedge','tafinlar','mekinist','opdivo','yervoy','braftovi','mektovi','libtayo','keytruda']:
    PRIMARY['ed-ema-'+drug]=('EMA: '+drug.capitalize()+' medicine overview','https://www.ema.europa.eu/en/medicines/human/EPAR/'+drug)

PRACTICAL={0,1,4,6,9,11,12,13,14,18,19,22,25,26,27,31,35,36,38,43,49,50,57,58,62,63,64,68,76,80,81,82,86,87,88,89,90,91,94,95,97,109,112,125,126}
SOURCE_OVERRIDES={
3:['ed-melanoma-clinical'],7:['ed-palliative'],8:['ed-nutrition','ed-fatigue'],10:['ed-palliative'],16:['ed-nutrition'],23:['ed-skin-clinical'],28:['ed-nutrition'],29:['ed-sunsmart'],33:[],34:['ed-palliative'],
39:['ed-net-patient','ed-pnet-types'],40:['ed-nanets-grade'],41:['ed-nanets-grade'],42:['ed-pnet-types'],44:[],45:['ed-pnet-diagnosis','ed-nanets-grade'],46:['ed-net-markers','ed-pnet-diagnosis'],47:['ed-net-markers'],48:['ed-net-markers','ed-pnet-diagnosis'],51:['ed-pnet-symptoms'],52:[],53:['ed-net-patient'],54:['ed-pnet-treatment'],55:['ed-pnet-treatment'],56:['ed-pnet-treatment'],59:['ed-nutrition'],60:['ed-fatigue'],61:['ed-palliative'],
65:['ed-brain-patient'],66:['ed-eano'],69:['ed-brain-patient'],70:[],71:[],72:['ed-brain-patient'],73:['ed-eano'],74:['ed-brain-molecular'],75:['ed-brain-molecular'],77:[],78:['ed-brain-patient'],79:['ed-rano'],83:[],84:['ed-eano'],85:['ed-eano'],92:['ed-brain-patient'],93:['ed-nutrition','ed-fatigue'],96:['ed-palliative'],99:[],100:[],102:[],107:['ed-melanoma'],108:['ed-melanoma-clinical'],110:['ed-melanoma'],117:['ed-melanoma-clinical'],123:[],131:['ed-skin'],132:['ed-skin-clinical'],133:[],134:['ed-ema-libtayo'],135:[],136:['ed-skin'],
}
AGENT_SOURCES={15:'erivedge',103:'tafinlar',104:'mekinist',113:'opdivo',114:'yervoy',119:'braftovi',120:'mektovi',128:'libtayo',140:'keytruda',145:'opdivo'}

def unique(items): return list(dict.fromkeys(items))
def hash_payload(v):
    payload={k:x for k,x in v.items() if k not in ['source_ids','source_pages']}
    return hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()[:16]

def sources_for(index,old):
    retained=[x for x in old if 'nccn' not in x.lower()]
    if index in PRACTICAL: return retained
    if index in AGENT_SOURCES: return unique(retained+['ed-ema-'+AGENT_SOURCES[index]])
    if index in SOURCE_OVERRIDES: return unique(retained+SOURCE_OVERRIDES[index])
    if index in list(range(2,6))+list(range(107,113)): return unique(retained+['ed-melanoma'])
    if index in list(range(20,39)): return unique(retained+['ed-skin'])
    # Clinical monitoring and evidence already have regimen/SmPC sources.
    return retained

def revised(block):
    i=block['index']; n=copy.deepcopy(block['content'])
    if i in TEXT: n['text']=TEXT[i]
    elif i in AGENTS: n['explanation']=AGENTS[i]
    elif i==69:
        n['text']='Temozolomide produces chemical damage in DNA. Cells unable to repair that damage may stop dividing or die. Blood-forming cells can also be affected, which explains the need for blood counts and infection precautions. Radiotherapy damages DNA in the planned treatment area. Its team explains the separate dose, skin care and effects on the brain.'
    elif i in [71,99,102]:
        # Keep medicine-specific dose/support conditions; replace their repeated
        # general neurological advice with the independently authored wording.
        n['text']=n['text'].replace('Keep steroids and seizure medicines on their own written schedules if prescribed. They are not routine medicines for every patient, and chemotherapy rest days do not automatically mean stopping them. Ask the pharmacist to check interactions.',TEXT[66]).replace('Keep any prescribed seizure medicine and steroid plan separate from the PCV calendar. Report new weakness, tingling, gait change or constipation before vincristine. A medicine review is needed before adding any treatment for symptoms.',TEXT[100])
    elif 'rows' in n and 'columns' in n:
        # These are original source-bound monitoring rules, not educational
        # excerpts. Retain all clinical values and only replace duplicated prose.
        pass
    elif 'limitations' in n:
        n['intro']='Discuss the evidence for your diagnosis, tumour test results and treatment setting.'
        n['limitations']=[x for x in n['limitations'] if 'NCCN' not in x and 'This handoff' not in x]
        n['limitations'].append('Your team explains the evidence that applies to this treatment plan and the uncertainty for you as an individual.')
    else: raise ValueError(f'No deliberate disposition for inventory block {i}')
    n['source_ids']=sources_for(i,block['source_ids'])
    return n

catalog={b['hash']:(b,revised(b)) for b in inventory['blocks']}
literal={}
for b,n in catalog.values():
    for k in ['text','explanation','intro']:
        if isinstance(b['content'].get(k),str) and n.get(k)!=b['content'][k]:
            literal[b['content'][k]]=n[k]
    if 'limitations' in n:
        for old in b['content']['limitations']:
            if 'NCCN' in old: literal[old]='SACTCheck explanations use the open clinical and medicine sources collected at the end of this document.'

audit=[]
changed=[]
file_records=[]
scope=json.loads((ROOT/'validation/patient-design-v08443/scope.json').read_text())
sourcepaths=sorted(set(scope['source_jsons'].values())|set(inventory['files']))

def transform_tree(value,path,fn):
    if isinstance(value,dict):
        ids=value.get('source_ids',[])
        if isinstance(ids,list) and any('nccn' in str(x).lower() for x in ids):
            h=hash_payload(value)
            if h not in catalog: raise ValueError(f'Uninventoried NCCN payload {fn}:{path} {h}')
            block,new=catalog[h]
            old=copy.deepcopy(value)
            # Retain page citations for the retained original clinical sources.
            pages=value.get('source_pages')
            value.clear();value.update(copy.deepcopy(new))
            value['source_ids']=sources_for(block['index'],old['source_ids'])
            if isinstance(pages,dict):
                pages={k:v for k,v in pages.items() if 'nccn' not in k.lower()}
            if pages: value['source_pages']=pages
            audit.append({'file':fn,'path':path,'baseline_hash':h,'inventory_index':block['index'],'before':old,'after':copy.deepcopy(value),'disposition':'clinical schedule retained under existing primary sources' if 'rows' in value else 'independent SACTCheck patient explanation'})
        for k,v in list(value.items()):
            if k.endswith('source_ids') and isinstance(v,list):
                value[k]=[x for x in v if 'nccn' not in str(x).lower()]
                continue
            if k in ['patient_editorial_revision','sources','source_pages']: continue
            if isinstance(v,str):
                if v in literal: value[k]=literal[v]
                value[k]=direct_language(value[k])
            else:transform_tree(v,path+'/'+str(k),fn)
    elif isinstance(value,list):
        for i,v in enumerate(value):
            if isinstance(v,str): value[i]=direct_language(literal.get(v,v))
            else: transform_tree(v,path+'/'+str(i),fn)

DISTANCING={
 'Your Irish PRRT service plan in print':'Your specialist treatment plan in print',
 'The Irish service leaflet':'Your treatment information',
 'The Irish service describes':'Your specialist team plans',
 'the Irish service leaflet':'the treatment information',
 'the Irish service':'your specialist team',
 'The Irish service':'Your specialist team',
 'Irish PRRT service':'PRRT service',
 'Irish service':'specialist service',
 'Irish leaflet':'treatment information',
 'Irish treatment context':'treatment plan',
 'Your Irish treating team':'Your treating team',
 'Irish regimen':'regimen',
 'Irish prescribing':'prescribing',
 'Irish advice':'advice from your team',
 'refractorySCLC':'refractory small-cell lung cancer (SCLC)',
 'The current Irish eligibility and specialist decision determine this regimen’s use.':'Your specialist team confirms that the treatment criteria apply to you.',
}
def direct_language(s):
    for a,b in DISTANCING.items():s=s.replace(a,b)
    return s

def detail(kind,label,timing,purpose,ids,scope='conditional',extra=''):
    return {'kind':kind,'label':label,'timing':timing,'purpose':purpose,'detail':extra,'scope':scope,'source_ids':ids}

netdetails=[
 detail('urine','5-hydroxyindoleacetic acid (5-HIAA)','Only if requested for your hormone syndrome; the team sets the dates.','Measures a breakdown product of serotonin to help assess selected neuroendocrine tumours.',['ed-net-markers'],'conditional','Often a timed urine collection. Follow the laboratory’s food and medicine instructions.'),
 detail('blood','Chromogranin A','Only when the team considers it informative for your tumour.','A selected tumour-marker result, interpreted with symptoms and scans.',['ed-net-markers'],'conditional','Acid-suppressing medicines and other conditions can alter the result. It is not a routine test before every treatment; do not stop medicines yourself.'),
 detail('blood','Selected pancreatic hormones','Only for the hormone question identified by your specialist.','Examples include gastrin, insulin or glucagon when the diagnosis or symptoms call for them.',['ed-pnet-diagnosis','ed-pnet-symptoms'],'conditional','The team names the test, preparation and review date; these are not a standard panel for every patient.'),
]

prrt_details=[
 detail('blood','Full blood count','Before treatment; once 2–4 weeks before and shortly before each administration; every 2 weeks between treatments.','Checks haemoglobin, white cells with differential, and platelets.',['nccp','smpc'],'routine','After the last administration: every 4 weeks for at least 3 months, then every 3 months for the following year. Your written plan may include extra early checks.'),
 detail('blood','Kidney function','With the blood-test schedule above; monitor for at least the first year after treatment.','Serum creatinine and calculated creatinine clearance assess kidney safety.',['nccp','smpc'],'routine','The team calculates clearance using the required method. A normal symptom check does not replace these tests.'),
 detail('blood','Liver function','With the blood-test schedule above.','Tests include ALT, AST, albumin, bilirubin and INR to assess liver function and protein production.',['smpc','nccp'],'routine'),
 detail('blood','Potassium','Before the kidney-protective amino-acid infusion; further checks if indicated.','Detects potassium disturbances that the amino-acid infusion can worsen.',['smpc'],'routine'),
 detail('echo','Heart pumping assessment','Before starting, as specified in the regimen.','An echocardiogram or MUGA scan assesses heart pumping function.',['nccp'],'routine'),
]

def consolidate_prrt(d):
    """One canonical home for repeated PRRT prose, with explicit retention map."""
    sections=d['logistics']['sections']
    by_title={s['title']:s for s in sections}
    changes=[]
    def revise(title,newtext,merge_titles=()):
        item=by_title[title]
        before=item['text']
        if before!=newtext:
            literal[before]=newtext
            item['text']=newtext
            changes.append({'kind':'condensed practical section','title':title,'before':before,'after':newtext})
        for other in merge_titles:
            if other in by_title:
                item['source_ids']=unique(item['source_ids']+by_title[other]['source_ids'])
                sections.remove(by_title[other])
                changes.append({'kind':'merged section','from':other,'to':title,'removed':by_title[other]})
    revise('At home after treatment',
      'Before discharge, obtain a paper plan with the end date for each restriction on contact, sleeping, work, travel and body-fluid handling. First-week instructions include daily bathing, careful handwashing, sitting to pass urine and separately washing body-fluid-soiled laundry. Ask for specific advice about pads, incontinence or a catheter. Examples include sleeping separately from a partner for 14 days and from pregnant people or children for three weeks; restrictions differ by contact and circumstance. Your medical physicist sets your personal instructions. Tell them before discharge if you cannot follow the plan at home.',
      ['Paper radiation instructions for home'])
    revise('Travel and other healthcare',
      'Carry the discharge letter and the official radiation-treatment card for the period the medical physicist specifies. They identify the treatment and date and help with travel, radiation detectors and other healthcare. The SACTCheck wallet card is an additional record and does not replace them. Tell healthcare staff about the treatment; radiation precautions must never delay urgent care.',
      ['Carry the official radiation card too'])
    revise('Your specialist team’s scan appointments',
      'Radiation-assessment scans measure where the treatment went and the radiation delivered to organs. They answer a different question from CT or MRI scans of tumour response. The detailed treatment information describes three radiation scans on separate days in the first week after the first infusion, starting the next day, and one after later infusions; response CT or MRI is described between the second and third infusions and after the course. Confirm your actual bookings with the team: these are service arrangements, not a universal timetable for every neuroendocrine tumour.')
    revise('Extra blood tests after the course',
      'Blood counts, kidney and liver tests continue every four weeks for at least three months after the last administration, then every three months for the following year. Your written discharge plan may also include two-weekly tests for the first eight weeks after the last infusion. The team confirms those extra early appointments and who reviews the results.')
    revise('If a visit is delayed',
      'Low blood counts, kidney or liver changes, other side effects or a change in the cancer may lead the specialist to postpone, reduce or stop treatment. A four-stamp record shows planned administrations, not medical clearance. A dose does not automatically become suitable at the maximum interval. Keep the blood-test and symptom plan while waiting for the team’s decision.')
    removed=[]
    destinations={
      'treatment':{'Why PRRT?':'purpose','How it works':'agents[0].explanation','Why the amino acids matter':'agents[1].explanation','Four intended administrations':'schedule_summary; phases; logistics/Treatment day','Evidence and its limits':'evidence.interpretation; evidence.limitations'},
      'preparing-prrt':{'*':'logistics.sections with matching titles'},
      'prrt-service-plan':{'*':'logistics.sections; scan/blood sections retained; home/card sections merged above'},
    }
    kept=[]
    for ch in d['chapters']:
        if ch['id'] in destinations:
            removed.append({'chapter':ch,'retained_at':destinations[ch['id']]});continue
        if ch['id']=='prrt-monitoring':
            duplicate=[x for x in ch['items'] if x['title']!='Delayed effects']
            if duplicate:
                removed.append({'chapter_items':duplicate,'retained_at':{'The full safety-test sequence':'monitoring_schedule; monitoring_summary; monitoring_test_details','What may change treatment':'logistics/If a visit is delayed','Post-treatment scans':'logistics/Your specialist team’s scan appointments'}})
            ch['title']='Later effects and continuing follow-up'
            ch['intro']='New or persistent symptoms still need review after the course.'
            ch['items']=[x for x in ch['items'] if x['title']=='Delayed effects']
        if ch['id']=='prrt-urgent':
            allowed=['Hormone crisis','Tumour breakdown and fluid changes']
            duplicate=[x for x in ch['items'] if x['title'] not in allowed]
            if duplicate:
                removed.append({'chapter_items':duplicate,'retained_at':{'When to seek help':'urgent_extra and the main urgent-help section','Pregnancy, breastfeeding and fertility':'logistics/Pregnancy, breastfeeding and fertility','If a visit is delayed':'logistics/If a visit is delayed','Contacts and paperwork':'logistics/Contacts and paperwork'}})
            ch['title']='Hormone and fluid changes to watch for'
            ch['intro']='Use the urgent-contact instructions whenever symptoms occur.'
            ch['items']=[x for x in ch['items'] if x['title'] in allowed]
        kept.append(ch)
    d['chapters']=kept
    d['patient_editorial_consolidation']={'version':VERSION,'single_content_home':True,'audit':'validation/patient-design-v08444/prrt-section-consolidation.json'}
    if removed or changes:
        target=OUT/'prrt-section-consolidation.json'
        prior=json.loads(target.read_text()) if target.exists() else {'version':VERSION,'route':'00642','changes':[],'removed_duplicates':[]}
        prior['changes']+=changes;prior['removed_duplicates']+=removed
        target.write_text(json.dumps(prior,ensure_ascii=False,indent=2)+'\n')

for rel in sourcepaths:
    p=ROOT/rel
    if not p.is_file():raise ValueError(f'Missing scoped patient source {rel}')
    before=p.read_text();d=json.loads(before)
    transform_tree(d,'',rel)
    # Remove the superseded educational sources only after every tagged object
    # has an explicit rewrite/retention entry. Historical originals stay in audit.
    d['sources']=[s for s in d.get('sources',[]) if 'nccn' not in (s.get('id','')+' '+s.get('url','')).lower()]
    for s in d['sources']:
        s['title']=direct_language(s.get('title','')).replace('current Irish Lutathera regimen','Lutathera regimen')
    code=d.get('code')
    route=next((r for r,src in scope['source_jsons'].items() if src==rel),code)
    family=scope.get('route_inventory',{}).get(route,{}).get('authoring_family','')
    if family=='Neuroendocrine' or rel=='data/patient-knowledge/00320.json':
        d['monitoring_test_details']=copy.deepcopy(netdetails)
    elif code=='00742' and d.get('monitoring_test_details')==netdetails:
        del d['monitoring_test_details']
    if code=='00642': d['monitoring_test_details']=copy.deepcopy(prrt_details+netdetails)
    if code=='00642': consolidate_prrt(d)
    if code=='00373':
        d['monitoring_test_details']=[
         detail('blood','Lactate dehydrogenase (LDH)','Before treatment and before each 28-day cycle.','A blood result followed alongside the clinical assessment in this regimen.',['nccp'],'routine','A change is interpreted with other findings; it does not establish tumour growth by itself.'),
         detail('blood','Creatine kinase (CK / CPK) and creatinine','Before treatment and monthly during treatment, or sooner for symptoms.','Checks for muscle injury and its effect on the kidneys.',['cotellic-pi'],'routine','Report new muscle pain, weakness or dark urine promptly.')]
    if str(family).lower()=='colorectal':
        d['monitoring_test_details']=[detail('blood','Carcinoembryonic antigen (CEA) — colorectal plans','For a colorectal cancer plan, if your team uses CEA; your team sets the interval.','A marker trend interpreted alongside symptoms, examination and scans.',['ed-cea'],'conditional','Record the baseline, latest result and next date. A marker change alone does not establish progression.')]
    if code=='00831':
        d['monitoring_test_details']=[detail('blood','Alpha-fetoprotein (AFP)','If it was raised and is informative for your tumour; your team sets the dates.','A selected marker interpreted with imaging and the clinical review.',['ed-afp'],'conditional','Other liver conditions can raise AFP, and a normal result does not exclude cancer.')]
    # Add only sources referenced by the revised data, never an unused generic
    # reading list. Keep existing clinically relevant source links intact.
    needed=set()
    def collect(v):
        if isinstance(v,dict):
            needed.update(v.get('source_ids',[]))
            for k,x in v.items():
                if k not in ['sources','patient_editorial_revision']:collect(x)
        elif isinstance(v,list):
            for x in v:collect(x)
    collect(d)
    d['sources']=[s for s in d['sources'] if not s['id'].startswith('ed-') or s['id'] in needed]
    existing={s['id'] for s in d['sources']}
    for sid in sorted(needed-existing):
        if sid not in PRIMARY:raise ValueError(f'Unresolved source {rel} {sid}')
        title,url=PRIMARY[sid]
        d['sources'].append({'id':sid,'title':title,'url':url,'editorial_checked':DATE})
    if d!=json.loads(before):
        d['patient_editorial_revision']={
         'version':VERSION,'date':DATE,'authorship':'Original SACTCheck patient explanations; supported by the open clinical sources listed in this record.',
         'scope':'Patient education, explicit named monitoring and direct care language. Existing clinician decision rules and patient dosing/hold instructions remain unchanged.',
         'clinical_audit':'Historical clinical audit dates are retained. This editorial revision is not a new comprehensive regimen audit.',
         'provenance':'validation/patient-design-v08444/editorial-source-provenance.json'}
        after=json.dumps(d,ensure_ascii=False,indent=2)+'\n';p.write_text(after);changed.append(rel)
        file_records.append({'path':rel,'before_sha256':hashlib.sha256(before.encode()).hexdigest(),'after_sha256':hashlib.sha256(after.encode()).hexdigest()})

# A text-only map also migrates finished standalone pages whose generator uses a
# historical template. Its values are authored above, not a source-label filter.
prrt_audit=OUT/'prrt-section-consolidation.json'
if prrt_audit.exists():
    for item in json.loads(prrt_audit.read_text())['changes']:
        if isinstance(item.get('before'),str) and isinstance(item.get('after'),str):literal[item['before']]=item['after']
replacements={'version':VERSION,'date':DATE,'text':literal,'direct_language':DISTANCING}
(ROOT/'tools/patient-editorial-replacements-v08444.json').write_text(json.dumps(replacements,ensure_ascii=False,indent=2)+'\n')
if audit:
    (OUT/'editorial-object-changes.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
if file_records:
    manifest=OUT/'editorial-source-paths.json'
    previous=json.loads(manifest.read_text()).get('files',[]) if manifest.exists() else []
    by_path={x['path']:x for x in previous}
    for x in file_records:
        if x['path'] in by_path:x['before_sha256']=by_path[x['path']]['before_sha256']
        by_path[x['path']]=x
    manifest.write_text(json.dumps({'version':VERSION,'paths':sorted(by_path),'files':[by_path[p] for p in sorted(by_path)]},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'changed_files':len(changed),'source_paths':changed,'revised_objects':len(audit),'unique_catalogue_objects':len(catalog)}))
