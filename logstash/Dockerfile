FROM docker.elastic.co/logstash/logstash:9.5.5

USER root

RUN rm -f /usr/share/logstash/pipeline/*

RUN echo "allow_superuser: true" >> /usr/share/logstash/config/logstash.yml

COPY pipeline/ /usr/share/logstash/pipeline/
