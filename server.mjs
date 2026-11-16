import http from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const event = JSON.parse(readFileSync(join(root, 'event.json'), 'utf8'));
const dataDir = process.env.DATA_DIR || join(root, 'data');
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(join(dataDir, 'guests.sqlite'));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS guests (token TEXT PRIMARY KEY, name TEXT NOT NULL, attendance TEXT NOT NULL, count INTEGER NOT NULL, note TEXT NOT NULL, updated TEXT NOT NULL)');
const limits = new Map();
const clean = (value, max) => typeof value === 'string' ? value.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, max) : '';
const hash = token => createHash('sha256').update(token).digest('hex');
const files = { '/': ['index.html','text/html; charset=utf-8'], '/style.css':['style.css','text/css; charset=utf-8'], '/app.js':['app.js','text/javascript; charset=utf-8'], '/favicon.svg':['favicon.svg','image/svg+xml'] };
for (const name of ['hero','gallery-1','gallery-2','gallery-3']) files[`/${name}.jpg`] = [`${name}.jpg`, 'image/jpeg'];
const icsEscape = s => s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const utc = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
function reply(res, status, value) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(value)); }
async function body(req) {
  let value = '';
  for await (const chunk of req) { value += chunk; if (Buffer.byteLength(value) > 8192) throw new Error('BODY_TOO_LARGE'); }
  try { return JSON.parse(value); } catch { throw new Error('INVALID_JSON'); }
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.google.com; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/health') return reply(res,200,{ok:true});
    if (req.method === 'GET' && url.pathname === '/api/event') return reply(res,200,event);
    if (req.method === 'GET' && url.pathname === '/api/guests') {
      const expected = process.env.ADMIN_TOKEN;
      const supplied = (req.headers.authorization || '').replace(/^Bearer /,'');
      if (!expected || !timingSafeEqual(Buffer.from(hash(supplied)),Buffer.from(hash(expected)))) return reply(res,401,{error:'Ruxsat yo‘q.'});
      return reply(res,200,{guests:db.prepare('SELECT name, attendance, count, note, updated FROM guests ORDER BY updated DESC').all()});
    }
    if (req.method === 'POST' && url.pathname === '/api/rsvp') {
      if (!req.headers['content-type']?.startsWith('application/json')) return reply(res,415,{error:'JSON talab qilinadi.'});
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return reply(res,403,{error:'So‘rov manbasi noto‘g‘ri.'});
      const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
      const now = Date.now();
      if (limits.size > 2000) for (const [key,value] of limits) if (now-value.start > 600000) limits.delete(key);
      const bucket = limits.get(ip) || {start:now,count:0};
      if (now-bucket.start > 600000) {bucket.start=now;bucket.count=0;}
      bucket.count++; limits.set(ip,bucket);
      if (bucket.count > 20) return reply(res,429,{error:'Biroz kutib, qayta urinib ko‘ring.'});
      const input = await body(req);
      if (input.website) return reply(res,400,{error:'So‘rov qabul qilinmadi.'});
      if (now > new Date(event.rsvpDeadline).getTime()) return reply(res,410,{error:'Javob yuborish muddati tugadi.'});
      const name = clean(input.name,80), note = clean(input.note,500);
      if (name.length < 2 || !['yes','no'].includes(input.attendance) || !Number.isInteger(input.count) || input.count < 1 || input.count > 6) return reply(res,400,{error:'Ism va mehmonlar sonini to‘g‘ri kiriting.'});
      const token = typeof input.token === 'string' && /^[a-f0-9]{48}$/.test(input.token) ? input.token : randomBytes(24).toString('hex');
      db.prepare('INSERT INTO guests VALUES (?,?,?,?,?,?) ON CONFLICT(token) DO UPDATE SET name=excluded.name, attendance=excluded.attendance, count=excluded.count, note=excluded.note, updated=excluded.updated').run(hash(token),name,input.attendance,input.attendance==='yes'?input.count:0,note,new Date().toISOString());
      return reply(res,200,{ok:true,token,message:'Javobingiz saqlandi. Rahmat!'});
    }
    if (req.method === 'GET' && url.pathname === '/event.ics') {
      const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Visol//Invitation//UZ','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:visol-'+utc(event.start)+'@invitation','DTSTAMP:'+utc(new Date()),'DTSTART:'+utc(event.start),'DTEND:'+utc(event.end),'SUMMARY:'+icsEscape(event.groom+' va '+event.bride+' — nikoh to‘yi'),'LOCATION:'+icsEscape(event.venue+', '+event.address),'DESCRIPTION:'+icsEscape(event.demo ? 'Namuna taklifnoma. '+event.venueNote : event.venueNote),'END:VEVENT','END:VCALENDAR',''];
      res.writeHead(200,{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="visol.ics"'}); return res.end(lines.join('\r\n'));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res,405,{error:'Usul qo‘llab-quvvatlanmaydi.'});
    const file = files[url.pathname];
    if (!file) return reply(res,404,{error:'Sahifa topilmadi.'});
    res.writeHead(200,{'Content-Type':file[1],'Cache-Control':file[1].startsWith('image/')?'public, max-age=86400':'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : readFileSync(join(root,file[0])));
  } catch (error) {
    const clientError = ['BODY_TOO_LARGE','INVALID_JSON'].includes(error.message);
    if (!clientError) console.error('Request error:',error.message);
    if (!res.headersSent) reply(res,clientError?400:500,{error:clientError?'So‘rov noto‘g‘ri.':'Xatolik yuz berdi. Qayta urinib ko‘ring.'});
    else res.end();
  }
});
server.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log(`Visol ready at http://localhost:${process.env.PORT || 3000}`));
function shutdown() {server.close(()=>{db.close();process.exit(0);});}
process.on('SIGTERM',shutdown); process.on('SIGINT',shutdown);
