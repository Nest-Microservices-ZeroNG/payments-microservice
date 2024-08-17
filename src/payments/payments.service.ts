import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { envs, NATS_SERVICE } from '../config';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
  private readonly _stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentService');

  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await this._stripe.checkout.sessions.create({
      //TODO: Put here Order ID
      payment_intent_data: {
        metadata: {
          orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });
    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;
    // This is your Stripe CLI webhook secret for testing your endpoint locally.
    //? TESTING
    // const endpointSecret =
    //   'whsec_8628bc7d009362492ae9523eac67c773f0f8eb35bc18c952330ec6e95a3271ff';
    //! PROD -> other endpoint secret

    try {
      event = this._stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        envs.stripeWebhookEndpointSecret,
      );
    } catch (e) {
      res.status(400).send(`Webhook Error: ${e.message}`);
      return;
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceded = event.data.object;
        const metadata = event.data.object.metadata;
        const payload = {
          stripePaymentId: chargeSucceded.id,
          orderId: metadata.orderId,
          receiptUrl: chargeSucceded.receipt_url,
        };
        this.natsClient.emit('payment.succeeded', payload);
        break;
      default:
        console.log(`Event ${event.type} not handled!`);
        break;
    }

    return res.status(200).json({ sig });
  }
}
