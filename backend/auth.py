"""Single-owner authentication, deliberately separate from business-data backups."""
import hashlib, hmac, os, secrets, sqlite3, time
from pathlib import Path
from urllib.parse import urlparse
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ConfigDict, field_validator

COOKIE='tms_session'
SESSION_SECONDS=12*60*60

class Credentials(BaseModel):
    model_config=ConfigDict(extra='forbid')
    username: str=Field(min_length=3,max_length=80)
    password: str=Field(min_length=1,max_length=128)
    setup_key: str=Field(default='',max_length=256)
    @field_validator('username')
    @classmethod
    def normalize(cls,v):
        v=v.strip().casefold()
        if len(v)<3 or any(not (c.isalnum() or c in '._@+-') for c in v):raise ValueError('Use at least 3 letters or numbers for the username.')
        return v

def password_hash(password,salt):
    return hashlib.scrypt(password.encode('utf8'),salt=bytes.fromhex(salt),n=32768,r=8,p=1,dklen=32,maxmem=64*1024*1024).hex()
def digest(token):return hashlib.sha256(token.encode()).hexdigest()

def install(app,data:Path):
    database=data/'authentication.db'
    public_origin=os.environ.get('TMS_PUBLIC_ORIGIN','').rstrip('/')
    secure=bool(public_origin)
    if public_origin:
        u=urlparse(public_origin)
        if u.scheme!='https' or not u.hostname or u.path or u.query or u.fragment or u.username:raise RuntimeError('TMS_PUBLIC_ORIGIN must be an HTTPS origin, for example https://tailoring.example.com')
    def connect():
        c=sqlite3.connect(database,timeout=10);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');return c
    with connect() as c:
        c.executescript('''CREATE TABLE IF NOT EXISTS owner(id INTEGER PRIMARY KEY CHECK(id=1),username TEXT NOT NULL UNIQUE,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY CHECK(id=1),count INTEGER NOT NULL,until INTEGER NOT NULL);''')
    if os.name!='nt':os.chmod(database,0o600)
    def session(request):
        token=request.cookies.get(COOKIE,'')
        if not token or len(token)>128:return None
        with connect() as c:
            return c.execute('SELECT * FROM sessions WHERE token_hash=? AND expires>?',(digest(token),int(time.time()))).fetchone()
    def issue(c):
        token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(32)
        c.execute('DELETE FROM sessions WHERE expires<=?',(int(time.time()),))
        c.execute('INSERT INTO sessions VALUES(?,?,?)',(digest(token),csrf,int(time.time())+SESSION_SECONDS))
        response=JSONResponse({'ok':True,'csrf':csrf})
        response.set_cookie(COOKIE,token,httponly=True,secure=secure,samesite='strict',max_age=SESSION_SECONDS,path='/')
        response.headers['Cache-Control']='no-store';return response
    @app.middleware('http')
    async def authenticate(request,call_next):
        path=request.url.path
        public=path in ('/api/auth/status','/api/auth/signup','/api/auth/signin')
        if path.startswith('/api/') and not public:
            s=session(request)
            if not s:return JSONResponse({'detail':'Please sign in to continue.'},401)
            if request.method not in ('GET','HEAD','OPTIONS') and not hmac.compare_digest(request.headers.get('X-TMS-CSRF',''),s['csrf']):return JSONResponse({'detail':'Your session changed. Reload and try again.'},403)
        response=await call_next(request)
        if path.startswith('/api/'):
            response.headers['Cache-Control']='no-store'
            response.headers['Pragma']='no-cache'
        response.headers['X-Content-Type-Options']='nosniff'
        response.headers['Referrer-Policy']='same-origin'
        response.headers['X-Frame-Options']='DENY'
        return response
    @app.get('/api/auth/status')
    def status(request:Request):
        s=session(request)
        with connect() as c:owner=c.execute('SELECT username FROM owner WHERE id=1').fetchone()
        return {'signup_allowed':owner is None,'authenticated':bool(s and owner),'username':owner['username'] if s and owner else None,'csrf':s['csrf'] if s and owner else None,'setup_key_required':bool(public_origin) and owner is None}
    @app.post('/api/auth/signup')
    def signup(x:Credentials,request:Request):
        # A database-enforced singleton and immediate transaction prevent concurrent first-owner claims.
        with connect() as c:
            c.execute('BEGIN IMMEDIATE')
            if c.execute('SELECT 1 FROM owner WHERE id=1').fetchone():raise HTTPException(409,'Signup is closed. The owner account already exists.')
            if public_origin:
                key=os.environ.get('TMS_SETUP_KEY','')
                if len(key)<20 or not hmac.compare_digest(x.setup_key,key):raise HTTPException(403,'A valid server setup key is required for first signup.')
            if len(x.password)<10 or not x.password.strip():raise HTTPException(400,'Use a password with at least 10 characters.')
            salt=secrets.token_hex(16)
            c.execute('INSERT INTO owner VALUES(1,?,?,?)',(x.username,salt,password_hash(x.password,salt)))
            return issue(c)
    @app.post('/api/auth/signin')
    def signin(x:Credentials):
        with connect() as c:
            c.execute('BEGIN IMMEDIATE')
            attempt=c.execute('SELECT * FROM attempts WHERE id=1').fetchone()
            timestamp=int(time.time())
            if attempt and attempt['until']>timestamp and attempt['count']>=10:raise HTTPException(429,'Too many attempts. Try again in 15 minutes.')
            owner=c.execute('SELECT * FROM owner WHERE id=1').fetchone()
            salt=owner['salt'] if owner else '00'*16
            candidate=password_hash(x.password,salt)
            if not owner or not hmac.compare_digest(candidate,owner['password_hash']) or x.username!=owner['username']:
                count=attempt['count']+1 if attempt and attempt['until']>timestamp else 1
                until=attempt['until'] if attempt and attempt['until']>timestamp else timestamp+900
                c.execute('INSERT OR REPLACE INTO attempts VALUES(1,?,?)',(count,until))
                c.commit()
                raise HTTPException(401,'Incorrect username or password.')
            c.execute('DELETE FROM attempts')
            return issue(c)
    @app.post('/api/auth/signout')
    def signout(request:Request):
        with connect() as c:c.execute('DELETE FROM sessions WHERE token_hash=?',(digest(request.cookies.get(COOKIE,'')),))
        r=JSONResponse({'ok':True});r.delete_cookie(COOKIE,path='/',secure=secure,httponly=True,samesite='strict');return r
