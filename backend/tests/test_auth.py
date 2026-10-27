import importlib, sqlite3
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient

CREDS={'username':'Owner','password':'test-password-123'}
@pytest.fixture
def raw(tmp_path,monkeypatch):
    monkeypatch.setenv('TMS_DATA_DIR',str(tmp_path))
    monkeypatch.delenv('TMS_PUBLIC_ORIGIN',raising=False)
    import app
    app.engine.dispose()
    module=importlib.reload(app)
    with TestClient(module.app) as c:yield c,tmp_path,module

def signup(c):
    r=c.post('/api/auth/signup',json=CREDS);assert r.status_code==200,r.text
    c.headers['X-TMS-CSRF']=r.json()['csrf']
    return r

def test_protected_and_single_owner(raw):
    c,path,module=raw
    assert c.get('/api/auth/status').json()['signup_allowed']
    for route in ('/api/state','/api/backup'):
        assert c.get(route).status_code==401
    assert c.post('/api/customers',json={'name':'Test'}).status_code==401
    r=signup(c)
    assert 'HttpOnly' in r.headers['set-cookie'] and 'SameSite=strict' in r.headers['set-cookie']
    assert c.get('/api/state').status_code==200
    assert c.post('/api/auth/signup',json=CREDS).status_code==409
    assert not c.get('/api/auth/status').json()['signup_allowed']
    with sqlite3.connect(path/'authentication.db') as db:
        owner=db.execute('select username,password_hash from owner').fetchone()
        assert owner[0]=='owner' and owner[1]!=CREDS['password']
        assert db.execute('select token_hash from sessions').fetchone()[0]!=c.cookies.get('tms_session')

def test_csrf_logout_and_signin(raw):
    c,path,module=raw;signup(c)
    csrf=c.headers.pop('X-TMS-CSRF')
    assert c.post('/api/customers',json={'name':'Test'}).status_code==403
    c.headers['X-TMS-CSRF']=csrf
    token=c.cookies.get('tms_session')
    assert c.post('/api/auth/signout').status_code==200
    assert not c.get('/api/auth/status').json()['authenticated']
    c.cookies.set('tms_session',token)
    assert c.get('/api/state').status_code==401
    c.cookies.clear()
    assert c.post('/api/auth/signin',json={**CREDS,'password':'wrong'}).status_code==401
    r=c.post('/api/auth/signin',json=CREDS);assert r.status_code==200
    assert c.get('/api/state').status_code==200

def test_backup_restore_preserves_account(raw):
    c,path,module=raw;signup(c)
    backup=c.get('/api/backup').content
    assert c.post('/api/customers',json={'name':'Test'}).status_code==200
    r=c.post('/api/restore',files={'file':('shop.db',backup,'application/octet-stream')})
    assert r.status_code==200,r.text
    assert c.get('/api/state').json()['customers']==[]
    assert c.post('/api/auth/signup',json=CREDS).status_code==409
    module.engine.dispose();module=importlib.reload(module)
    with TestClient(module.app) as fresh:
        assert not fresh.get('/api/auth/status').json()['signup_allowed']
        assert fresh.post('/api/auth/signin',json=CREDS).status_code==200

def test_concurrent_signup(raw):
    c,path,module=raw
    def attempt(i):
        other=TestClient(module.app)
        try:
            return other.post('/api/auth/signup',json={**CREDS,'username':f'owner{i}'}).status_code
        finally:other.close()
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(attempt,range(2)))
    assert sorted(results)==[200,409]

def test_expiry_and_rate_limit(raw):
    c,path,module=raw;signup(c)
    with sqlite3.connect(path/'authentication.db') as db:db.execute('update sessions set expires=0')
    assert c.get('/api/state').status_code==401
    for _ in range(10):assert c.post('/api/auth/signin',json={**CREDS,'password':'wrong'}).status_code==401
    assert c.post('/api/auth/signin',json=CREDS).status_code==429

def test_public_origin_setup_key(tmp_path,monkeypatch):
    monkeypatch.setenv('TMS_DATA_DIR',str(tmp_path))
    monkeypatch.setenv('TMS_PUBLIC_ORIGIN','https://shop.example')
    monkeypatch.setenv('TMS_SETUP_KEY','test-only-setup-key-123456789')
    import app
    app.engine.dispose();module=importlib.reload(app)
    with TestClient(module.app,base_url='https://shop.example') as c:
        assert c.get('/api/auth/status').json()['setup_key_required']
        assert c.post('/api/auth/signup',json=CREDS).status_code==403
        r=c.post('/api/auth/signup',json={**CREDS,'setup_key':'test-only-setup-key-123456789'})
        assert r.status_code==200 and 'Secure' in r.headers['set-cookie']
        assert c.get('/api/state').status_code==200
        assert c.post('/api/auth/signin',json=CREDS,headers={'origin':'https://evil.example'}).status_code==403
