"""Build only the five newly authored regimen routes, then independently decode them."""
from pathlib import Path
import json,hashlib
import qrcode,zxingcpp
from PIL import Image
R=Path(__file__).resolve().parents[1]
rows=[]
for route in json.loads((R/'validation/prostate-v08451/scope.json').read_text())['new_routes']:
 for name,tail in [('qr.png',''),('oncowiki-qr.png','knowledge.html')]:
  target='https://sactcheck.com/patient/'+route+'/'+tail
  p=R/'patient'/route/name;p.parent.mkdir(parents=True,exist_ok=True)
  qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=8,border=4);qr.add_data(target);qr.make(fit=True);qr.make_image(fill_color='black',back_color='white').save(p)
  values=[v.text for v in zxingcpp.read_barcodes(Image.open(p))]
  if values!=[target]:raise ValueError((str(p),target,values))
  rows.append({'file':str(p.relative_to(R)),'target':target,'decoded':values,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
p=R/'validation/prostate-v08451/pdf/qr-png.json';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps({'status':'pass','rows':rows},indent=2)+'\n')
print('10 exact regimen QR destinations verified')
