import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns the data payload { status: "ok" } (enveloped by ResponseInterceptor)', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
