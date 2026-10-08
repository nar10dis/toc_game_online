import { LoggerModule } from 'nestjs-pino';

export const LoggerConfig = LoggerModule.forRoot({
  pinoHttp: {
    //level == le minimum de ce quon garde : ici == tout (debug = 20, par defaut pino les tej)
    level: 'debug',
    //400 -> faut du client // 500 = notre faute
    customLogLevel: (req, res, err)=> {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info'
    },
    // NEVER SEND JWT
    redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
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
