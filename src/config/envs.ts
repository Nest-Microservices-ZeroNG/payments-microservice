import 'dotenv/config';
import * as joi from 'joi';
import * as process from 'node:process';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  STRIPE_WEBHOOK_ENDPOINT_SECRET: string;

  NATS_SERVERS: string[];
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    STRIPE_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
    STRIPE_WEBHOOK_ENDPOINT_SECRET: joi.string().required(),

    NATS_SERVERS: joi.array().items(joi.string().required()),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  stripeSecret: envVars.STRIPE_SECRET,
  stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
  stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
  stripeWebhookEndpointSecret: envVars.STRIPE_WEBHOOK_ENDPOINT_SECRET,
  natsServers: envVars.NATS_SERVERS,
};
