import { LoggerModule } from 'nestjs-pino';

export const LoggerConfig = LoggerModule.forRoot({
  pinoHttp: {
    transport: {
      targets: [
        {
          target: 'pino/file',
          options: {
            destination: 1,
          },
        },
        {
          target: 'pino-socket',
          options: {
            address: 'logstash',
            port: 5000,
            mode: 'tcp',
            reconnect: true,
          },
        },
      ],
    },
  },
});