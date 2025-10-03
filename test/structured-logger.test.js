const fs = require('node:fs');
const path = require('node:path');
const { PassThrough } = require('node:stream');

const distPath = path.join(__dirname, '..', 'dist', 'codex', 'observability.js');

if (!fs.existsSync(distPath)) {
  throw new Error(
    'Structured logger build output missing. Run `npm run build:mcp` before executing this test suite.',
  );
}

const { createStructuredLogger } = require(distPath);

describe('Structured logger', () => {
  test('emits JSON log lines with structured fields', () => {
    const stream = new PassThrough();
    const chunks = [];
    stream.on('data', (chunk) => {
      chunks.push(chunk.toString());
    });

    const logger = createStructuredLogger({
      name: 'test-service',
      stream,
      base: { component: 'unit-test' },
    });

    logger.info('lane_selection', { lane: 'quick', confidence: 0.92 });

    const [entry] = chunks
      .join('')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));

    expect(entry.msg).toBe('lane_selection');
    expect(entry.lane).toBe('quick');
    expect(entry.confidence).toBe(0.92);
    expect(entry.component).toBe('unit-test');
    expect(entry.service).toBe('test-service');
  });

  test('records timing metrics via sinks', async () => {
    const stream = new PassThrough();
    stream.resume();
    const sink = jest.fn();

    const logger = createStructuredLogger({
      stream,
      metrics: sink,
    });

    const result = await logger.time(
      'tool_completed',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return 'ok';
      },
      { operation: 'select_development_lane', lane: 'complex' },
      'test.metric.duration',
    );

    await new Promise((resolve) => setImmediate(resolve));

    expect(result).toBe('ok');
    expect(sink).toHaveBeenCalled();

    const event = sink.mock.calls[0][0];
    expect(event.name).toBe('test.metric.duration');
    expect(event.type).toBe('timing');
    expect(event.unit).toBe('ms');
    expect(event.attributes.operation).toBe('select_development_lane');
    expect(event.attributes.lane).toBe('complex');
  });
});
