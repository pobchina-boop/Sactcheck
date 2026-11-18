'use strict';
// Test classification follows the quantity being measured, not a mention of GFR.
function isRenalMeasurement(field,definition={}){
 const text=`${field} ${definition.label||''}`.toLowerCase(),unit=String(definition.unit||'').toLowerCase().trim();
 if(!/crcl|creatinine clearance|\bgfr\b|egfr/.test(text))return false;
 if(['%','percent','percentage','ratio'].includes(unit)&&/percent|percentage|ratio|baseline|reference|change/.test(text))return false;
 if(['h','hr','hours','days'].includes(unit)&&/age|old|elapsed|since/.test(text))return false;
 return true;
}
module.exports={isRenalMeasurement};
