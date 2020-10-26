from flask import Flask, render_template, request, redirect, url_for, jsonify
import json
import os
import requests
from ibm_watson import AssistantV2
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
try:
    import ibm_db
except:
    pass
from geopy.geocoders import Nominatim

app = Flask(__name__)

app.config["UPLOAD_DIR"] = 'static/raw/'
apikey = ''
url = ''
assistantid = ''
sessionid = ''


with open('ibm-db2-credentials.json', 'r') as credentialsFile:
    credentials1 = json.loads(credentialsFile.read())

dsn_driver = "IBM DB2 ODBC DRIVER"
dsn_database = credentials1['db']
dsn_hostname = credentials1['host']
dsn_port = "50000"
dsn_uid = credentials1['username']
dsn_pwd = credentials1['password']

dsn = (
    "DRIVER={{IBM DB2 ODBC DRIVER}};"
    "DATABASE={0};"
    "HOSTNAME={1};"
    "PORT={2};"
    "PROTOCOL=TCPIP;"
    "UID={3};"
    "PWD={4};").format(dsn_database, dsn_hostname, dsn_port, dsn_uid, dsn_pwd)
try:
    conn = ibm_db.connect(dsn, "", "")
except:
    pass

#########################
# Create Orders Table
#########################
table = ' CREATE TABLE ORDERS( \
    ID int,NAME varchar(255), \
    PHONE varchar(255), \
    ORDERS varchar(255), \
    ADDRESS varchar(255)	); ' 
try:
    ibm_db.exec_immediate(conn, table)
except:
    pass


with open('watson-assistant-credentials.json', 'r') as credentialsFile:
    credentials = json.loads(credentialsFile.read())

apikey = credentials.get('apikey')
url = credentials.get('url')
assistantid = credentials.get('assistant-id')

#########################
# Watson Assistant Authentication
#########################

authenticator = IAMAuthenticator(apikey)
assistant = AssistantV2(
    version='2020-04-01',
    authenticator=authenticator
)

assistant.set_service_url(url)

#########################
# Watson Assistant Sessions
#########################


def createSession():
    global sessionid
    session = assistant.create_session(assistantid).get_result()
    sessionid = session.get('session_id')
    print('New Session created ID: ', sessionid)


def destroySession():
    try:
        response = assistant.delete_session(
        assistant_id=assistantid, session_id=sessionid).get_result()
        print(response)
    except Exception as e:
        pass

# assistant.delete_session(skillid, "<YOUR SESSION ID>").get_result()

@app.route('/getWatsonAssistantResponse', methods=['GET', 'POST'])
def test():
    msg = request.args['msg']

    message = assistant.message(
        assistantid,
        sessionid,
        input={'text': msg}
    ).get_result()
    print(msg)
    # print(json.dumps(message, indent=2))
    try:
        payload = {
            "message": message['output']['generic'][0]['text'],
            "options": message['output']['generic'][1]['options'],
            "response_type": message['output']['generic'][1]['response_type']
        }
    except:
        payload = {
            "message": message['output']['generic'][0]['text'],
            "options": "",
            "response_type": ""
        }

    # print(msg)
    # print(json.dumps(message, indent=2))
    return jsonify(payload)


@app.route("/getlocation", methods=["GET"])
def getlocation():
    lat = request.args['lat']
    lon = request.args['lon']
    location = str(lat)+","+str(lon)
    geolocator = Nominatim(user_agent="smart_avatar_application")
    location = geolocator.reverse(location)
    place = location.address
    outputjson = {"place": place}

    return jsonify(outputjson)


@app.route('/dashboard')
def chatbot():
    return render_template('dashboard.html')


@app.route('/addDatabaseContents', methods=['GET', 'POST'])
def addDatabaseContentsJson():
    if request.method == 'POST':
        try:
            conn = ibm_db.connect(dsn, "", "")
        except:
            pass
        
        opt = request.form
        data = json.loads(opt['orderDetails'])
        try:
            ids = getIDs(conn) + 1
        except:
            ids = 1
        

        a = "\'"
        n = a+data.get('name')+a
        o = a+data.get('orders')+a
        p = a+data.get('phone')+a
        add = a+data.get('address')+a
        insert = 'INSERT INTO {0}.ORDERS VALUES(%d, %s, %s, %s, %s)'.format(dsn_uid) % (
            ids, n, p, o, add)
    
        try:
            ibm_db.exec_immediate(conn, insert)
            return {'flag': 'success'}
        except:
            return {'flag': 'failed'}
        

@app.route('/getDatabaseContents')
def getDatabaseContentsJson():
    try:
        conn = ibm_db.connect(dsn, "", "")
    except:
        pass
    
    select_statement = 'SELECT * FROM {0}.ORDERS ORDER BY ID desc;'.format(
        dsn_uid)
    res = ibm_db.exec_immediate(conn, select_statement)
    
    result = ibm_db.fetch_both(res)
    resultDict = []
    while(result):
        returnDictBuffer = {'ID': result['ID'],
                          'NAME': result['NAME'],
                           'PHONE': result['PHONE'],
                          'ORDERS': result['ORDERS'],
                          'ADDRESS': result['ADDRESS']}
        resultDict.append(returnDictBuffer)
        result = ibm_db.fetch_both(res)
        
    return jsonify(resultDict)

    
def getIDs(conn):
    select_statement = 'SELECT ID FROM {0}.ORDERS ORDER BY ID desc;'.format(
        dsn_uid)
    stmt = ibm_db.exec_immediate(conn, select_statement)
    finalID = 0
    result = ibm_db.fetch_both(stmt)
    finalID = int(result['ID'])
    return finalID

@app.route('/restartSession', methods=['GET', 'POST'])
def restartSession():
    global sessionid
    if sessionid == '':
        createSession()
    else:
        destroySession()
        createSession()


@app.route('/')
def index():
    global sessionid
    if sessionid == '':
        createSession()
    else:
        destroySession()
        createSession()
    return render_template('index.html')


port = os.getenv('VCAP_APP_PORT', '8080')
if __name__ == "__main__":
    app.secret_key = os.urandom(12)
    app.run(debug=True, host='0.0.0.0', port=port)
