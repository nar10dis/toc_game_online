import { Controller, Get} from '@nestjs/common';

@Controller('test')
export class TestController {
	@Get()
	printTest(): string {
	return 'This is a test !';
	}
}
