/* Local planning calculations using pinned SunCalc 1.9.0, BSD-2-Clause.
   The hut elevation is deliberately not used as observer height above a flat horizon. */
(function(root){
'use strict';
const sun=typeof module==='object'&&module.exports?require('./suncalc-1.9.0.cjs'):root.SunCalc;
sun.addTime(-8,'morningBlueStart','eveningBlueEnd');
sun.addTime(-4,'morningBlueEnd','eveningBlueStart');
const zone='Europe/Vienna';
const labels={sunrise:'Sunrise',sunset:'Sunset',goldenMorning:'Morning golden window',goldenEvening:'Evening golden window',blueMorning:'Morning blue window',blueEvening:'Evening blue window'};
function validDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;
 const d=new Date(value+'T12:00:00Z');
 return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value&&value>='1900-01-01'&&value<='2100-12-31';
}
function clock(d){
 return d&&Number.isFinite(+d)?new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d):'Not available';
}
function fraction(d){
 if(!d||!Number.isFinite(+d))return null;
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const values=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return (Number(values.hour)*3600+Number(values.minute)*60+Number(values.second))/86400;
}
function solarTimes(value,lat,lon){
 if(!validDate(value)||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 const t=sun.getTimes(new Date(value+'T12:00:00Z'),lat,lon,0);
 const range=(a,b)=>clock(a)+'–'+clock(b);
 const az=d=>d&&Number.isFinite(+d)?Math.round((((sun.getPosition(d,lat,lon).azimuth*180/Math.PI)+180)%360)*10)/10:null;
 return {date:value,zone,latitude:lat,longitude:lon,sunrise:clock(t.sunrise),sunset:clock(t.sunset),
 goldenMorning:range(t.sunrise,t.goldenHourEnd),goldenEvening:range(t.goldenHour,t.sunset),
 blueMorning:range(t.morningBlueStart,t.morningBlueEnd),blueEvening:range(t.eveningBlueStart,t.eveningBlueEnd),
 sunriseAzimuth:az(t.sunrise),sunsetAzimuth:az(t.sunset),
 excel:{sunrise:fraction(t.sunrise),sunset:fraction(t.sunset)},
 utc:{sunrise:Number.isFinite(+t.sunrise)?t.sunrise.toISOString():null,sunset:Number.isFinite(+t.sunset)?t.sunset.toISOString():null},
 qualification:'Astronomical estimate for a flat horizon, displayed to minutes. Mountain shadow, clouds and on-site visibility are not modelled. Blue window: sun -8° to -4°; golden window: sunrise/sunset to +6°. Bearings are sun directions, not hut orientation.'};
}
const api={solarTimes,validDate,zone,labels};
if(typeof module==='object'&&module.exports)module.exports=api;else root.AlpenSolar=api;
})(typeof window==='object'?window:globalThis);
