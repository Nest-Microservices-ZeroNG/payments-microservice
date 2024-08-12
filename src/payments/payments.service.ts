import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config';

@Injectable()
export class PaymentsService {
  private readonly _stripe = new Stripe(envs.stripeSecret);
}
