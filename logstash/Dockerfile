FROM docker.elastic.co/logstash/logstash:9.5.4

RUN rm -f /usr/share/logstash/pipeline/*

COPY pipeline/ /usr/share/logstash/pipeline/
