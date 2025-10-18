import { describe, it, expect } from 'vitest';
import { handler } from './src/index';

describe('example-lambda', () => {
  it('deve retornar sucesso', async () => {
    const event = { key: 'value' }
    const result = await handler(event)
    expect(result.statusCode).toBe(200)
    expect(result.body).toContain('Lambda executada com sucesso!')
  })
})