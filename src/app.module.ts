import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [NatsModule, PaymentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
