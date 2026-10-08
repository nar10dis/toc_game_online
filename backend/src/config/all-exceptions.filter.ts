  import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
  import { BaseExceptionFilter } from '@nestjs/core';

//catch qui attrape TOUTES les erreurs quon throw a nest !
@Catch()

export class AllExceptionFilter extends BaseExceptionFilter {
	//contexte == HTTP
	private readonly logger = new Logger('HTTP');

	catch(exception: unknown, host: ArgumentsHost) {
		const req = host.switchToHttp().getRequest();
		const status = exception instanceof HttpException ? exception.getStatus() : 500;
		const details = { err: exception, status, method: req.method, url: req.url};

		if (status >= 500)
			this.logger.error(details, 'unhandled error'); //bug
		else
			this.logger.warn(details, 'request refused');

		//on repasse la main a nest.
		//super = la classe parente !
		super.catch(exception, host);
	}
}
