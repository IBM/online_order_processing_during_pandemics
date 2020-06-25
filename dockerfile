FROM ubuntu:16.04

LABEL maintainer="Manoj Jahgirdar <manoj.jahgirdar@in.ibm.com>, \
Rahul Reddy Ravipally <raravi86@in.ibm.com> \
Srikanth Manne <srikanth.manne@in.ibm.com> \
Sharath Kumar RK <sharrkum@in.ibm.com>"

RUN apt-get update
RUN apt-get install -y python3 python3-dev python3-pip 

COPY ./ ./app
WORKDIR ./app
RUN pip3 install -r requirements.txt

CMD python3 app.py