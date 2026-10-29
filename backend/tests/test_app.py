import os, tempfile, uuid, importlib, sqlite3
from datetime import date,timedelta
from pathlib import Path
from contextlib import closing
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setenv('TMS_DATA_DIR',str(tmp_path))
    import app
    app.engine.dispose()
    module=importlib.reload(app)
    with TestClient(module.app) as c:
        r=c.post('/api/auth/signup',json={'username':'testowner','password':'test-password-123'})
        assert r.status_code==200,r.text
        c.headers['X-TMS-CSRF']=r.json()['csrf']
        yield c

def create_customer(c,name='Ahmad'):
    r=c.post('/api/customers',json={'name':name,'phone':'0700000000','notes':'Regular customer'})
    assert r.status_code==200,r.text
    return r.json()
def profile(c,cid,value=38):
    x={'customer_id':cid,'name':'Everyday fit','kind':'Shalwar Kameez','unit':'in','values':{'Chest':value,'Shoulder':18},'notes':'Loose fitting'}
    r=c.post('/api/profiles',json=x);assert r.status_code==200,r.text
    return r.json(),x
def order(c,cid,pid=None,advance=1000):
    x={'customer_id':cid,'due':(date.today()+timedelta(days=3)).isoformat(),'advance':advance,'request_id':str(uuid.uuid4()),'items':[{'kind':'Shalwar Kameez','quantity':2,'price':1500,'profile_id':pid},{'kind':'Alteration','quantity':1,'price':200}]}
    r=c.post('/api/orders',json=x);assert r.status_code==200,r.text
    return r.json(),x

def test_customer_edit_and_restart(client):
    customer=create_customer(client)
    r=client.put('/api/customers/'+customer['id'],json={'name':'Ahmad Sediqi','phone':'0700000001','notes':'Updated'})
    assert r.status_code==200
    import app
    app.engine.dispose()
    assert client.get('/api/state').json()['customers'][0]['name']=='Ahmad Sediqi'

def test_measurement_snapshot_and_history(client):
    c=create_customer(client);p,x=profile(client,c['id']);o,_=order(client,c['id'],p['id'])
    x['values']['Chest']=42
    assert client.put('/api/profiles/'+p['id'],json=x).status_code==200
    state=client.get('/api/state').json()
    assert state['profiles'][0]['values']['Chest']==42
    assert state['profiles'][0]['version']==2
    assert state['items'][0]['snapshot']['values']['Chest']==38
    assert client.get('/api/profiles/'+p['id']+'/versions').json()[0]['values']['Chest']==38

def test_multiple_items_and_advance(client):
    c=create_customer(client);o,_=order(client,c['id'])
    state=client.get('/api/state').json();o=state['orders'][0]
    assert o['total']==3200 and o['paid']==1000 and o['balance']==2200
    assert len(state['items'])==2

def test_duplicate_order_is_idempotent(client):
    c=create_customer(client);o,x=order(client,c['id'])
    r=client.post('/api/orders',json=x)
    assert r.json()['id']==o['id']
    assert len(client.get('/api/state').json()['orders'])==1
    assert len(client.get('/api/state').json()['payments'])==1

def test_partial_payments_reversal_and_duplicate(client):
    c=create_customer(client);o,_=order(client,c['id'])
    payload={'order_id':o['id'],'amount':1200,'request_id':str(uuid.uuid4())}
    p=client.post('/api/payments',json=payload).json()
    assert client.post('/api/payments',json=payload).json()['id']==p['id']
    assert client.get('/api/state').json()['orders'][0]['balance']==1000
    assert client.post('/api/payments',json={**payload,'request_id':str(uuid.uuid4()),'amount':1001}).status_code==400
    assert client.post('/api/payments/'+p['id']+'/reverse',json={'reason':'Wrong amount'}).status_code==200
    state=client.get('/api/state').json()
    assert state['orders'][0]['balance']==2200
    assert len(state['payments'])==3
    assert client.post('/api/payments/'+p['id']+'/reverse',json={'reason':'Again'}).status_code==400
    reversal=next(p for p in state['payments'] if p['amount']<0)
    assert client.post('/api/payments/'+reversal['id']+'/reverse',json={'reason':'Again'}).status_code==400

@pytest.mark.parametrize('amount',[-1,0,1.5,'20'])
def test_invalid_payment_amounts(client,amount):
    c=create_customer(client);o,_=order(client,c['id'])
    assert client.post('/api/payments',json={'order_id':o['id'],'amount':amount,'request_id':str(uuid.uuid4())}).status_code==422

def test_transaction_rolls_back_on_wrong_profile(client):
    c=create_customer(client);other=create_customer(client,'Other');p,_=profile(client,other['id'])
    r=client.post('/api/orders',json={'customer_id':c['id'],'due':date.today().isoformat(),'advance':20,'request_id':str(uuid.uuid4()),'items':[{'kind':'Shalwar Kameez','quantity':1,'price':100,'profile_id':p['id']}]})
    assert r.status_code==400
    state=client.get('/api/state').json()
    assert state['orders']==[] and state['items']==[] and state['payments']==[]

def test_status_delivery_and_reopen(client):
    c=create_customer(client);o,_=order(client,c['id'])
    for status in ['In progress','Ready','Delivered']:
        assert client.put('/api/orders/'+o['id']+'/status',json={'status':status}).status_code==200
    state=client.get('/api/state').json()
    assert state['orders'][0]['delivered']
    assert len(state['history'])==4
    assert client.put('/api/orders/'+o['id']+'/status',json={'status':'Pending'}).status_code==200
    assert client.get('/api/state').json()['orders'][0]['delivered'] is None
    assert client.put('/api/orders/'+o['id']+'/status',json={'status':'Unknown'}).status_code==422

def test_backup_restore_roundtrip(client):
    c=create_customer(client);p,_=profile(client,c['id']);order(client,c['id'],p['id'])
    before=client.get('/api/state').json()
    backup=client.get('/api/backup');assert backup.status_code==200
    create_customer(client,'After backup')
    r=client.post('/api/restore',files={'file':('backup.db',backup.content,'application/octet-stream')})
    assert r.status_code==200,r.text
    assert client.get('/api/state').json()==before
    import app
    assert len(list(app.DATA.glob('before-restore-*.db')))==1

def test_invalid_restore_preserves_data(client):
    create_customer(client)
    before=client.get('/api/state').json()
    assert client.post('/api/restore',files={'file':('bad.db',b'not sqlite')}).status_code==400
    assert client.get('/api/state').json()==before

def test_backup_restore_closes_sqlite_connections(client,monkeypatch):
    connections=[]
    connect=sqlite3.connect
    def track_connection(*args,**kwargs):
        kwargs['check_same_thread']=False
        connection=connect(*args,**kwargs)
        if Path(args[0]).name in ('backup.db','restore.db'):
            connections.append(connection)
        return connection
    monkeypatch.setattr(sqlite3,'connect',track_connection)
    backup=client.get('/api/backup')
    assert backup.status_code==200
    assert client.post('/api/restore',files={'file':('backup.db',backup.content)}).status_code==200
    assert client.post('/api/restore',files={'file':('bad.db',b'not sqlite')}).status_code==400
    assert connections
    for connection in connections:
        with pytest.raises(sqlite3.ProgrammingError,match='closed'):
            connection.execute('SELECT 1')

def test_backup_with_broken_balance_rejected(client,tmp_path):
    c=create_customer(client);order(client,c['id'])
    backup=client.get('/api/backup').content
    bad=tmp_path/'bad.db';bad.write_bytes(backup)
    with closing(sqlite3.connect(bad)) as db, db:db.execute('UPDATE payments SET amount=999999')
    assert client.post('/api/restore',files={'file':('bad.db',bad.read_bytes())}).status_code==400
    assert client.get('/api/state').json()['orders'][0]['balance']==2200

def test_validation(client):
    assert client.post('/api/customers',json={'name':'  '}).status_code==422
    c=create_customer(client)
    for values in [{},{'Chest':0},{'Chest':-1},{'Wrong field':10},{'Chest':501}]:
        assert client.post('/api/profiles',json={'customer_id':c['id'],'name':'test','kind':'Shalwar Kameez','values':values}).status_code==422
    payload={'customer_id':c['id'],'due':date.today().isoformat(),'request_id':str(uuid.uuid4()),'items':[{'kind':'Suit','quantity':1,'price':100}]}
    assert client.post('/api/orders',json={**payload,'advance':101}).status_code==400
    assert client.post('/api/orders',json={**payload,'due':(date.today()-timedelta(days=1)).isoformat()}).status_code==400
    assert client.post('/api/orders',json={**payload,'items':[]}).status_code==422

def test_local_origin_protection(client):
    assert client.post('/api/customers',headers={'Origin':'https://malicious.example'},json={'name':'x'}).status_code==403
    assert client.get('/api/state',headers={'Host':'evil.example'}).status_code==403

def test_settings_persist(client):
    data={'name':'Kabul Tailors','phone':'0700000000','address':'Kabul','language':'fa','receipt_width':'80mm'}
    assert client.put('/api/settings',json=data).status_code==200
    assert client.get('/api/state').json()['settings']==data

def test_migrations_are_repeatable(client):
    c=create_customer(client)
    import app
    app.migrate();app.migrate()
    assert client.get('/api/state').json()['customers'][0]['id']==c['id']

def test_settlement_reaches_zero(client):
    c=create_customer(client);o,_=order(client,c['id'])
    for amount in [1000,1200]:
        assert client.post('/api/payments',json={'order_id':o['id'],'amount':amount,'request_id':str(uuid.uuid4())}).status_code==200
    state=client.get('/api/state').json()
    assert state['orders'][0]['paid']==3200 and state['orders'][0]['balance']==0
    assert client.post('/api/payments',json={'order_id':o['id'],'amount':1,'request_id':str(uuid.uuid4())}).status_code==400

def test_duplicate_payment_key_with_changed_details_rejected(client):
    c=create_customer(client);o,_=order(client,c['id'])
    x={'order_id':o['id'],'amount':100,'request_id':str(uuid.uuid4())}
    assert client.post('/api/payments',json=x).status_code==200
    assert client.post('/api/payments',json={**x,'amount':200}).status_code==409
    assert client.get('/api/state').json()['orders'][0]['paid']==1100
