import request from 'supertest';
import express from 'express';
import { createServer, Server as HttpServer } from 'http';
import { setupRoutes } from '../src/routes';
import { errorHandler } from '../src/middleware/errorHandler';
import { initializeSocketIO, closeSocketIO } from '../src/config/socketio';

let app: express.Application;
let httpServer: HttpServer;

beforeAll(() => {
  app = express();
  app.use(express.json());

  httpServer = createServer(app);
  initializeSocketIO(httpServer);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  setupRoutes(app);
  app.use(errorHandler);
});

afterAll((done) => {
  closeSocketIO();
  if (httpServer) {
    httpServer.close(done);
  } else {
    done();
  }
});

describe('API Smoke Tests', () => {
  describe('Health Check', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Project Creation', () => {
    it('should create a project with valid data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('projectId');
      expect(response.body).toHaveProperty('state');
      expect(response.body.projectId).toMatch(/^proj-/);
    });

    it('should create a project without name', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({});
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('projectId');
    });

    it('should reject project with invalid name', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: '' });
      
      expect(response.status).toBe(400);
    });

    it('should reject project with name too long', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'a'.repeat(256) });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Project State', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' });
      projectId = response.body.projectId;
    });

    it('should get project state', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/state`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('projectName', 'Test Project');
    });

    it('should update project state', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/state`)
        .send({ currentPhase: 'planning' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentPhase', 'planning');
    });

    it('should reject invalid project ID format', async () => {
      const response = await request(app)
        .get('/api/projects/invalid-id/state');
      
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/proj-00000000-0000-0000-0000-000000000000/state');
      
      expect(response.status).toBe(404);
    });

    it('should reject invalid state update', async () => {
      const response = await request(app)
        .patch(`/api/projects/${projectId}/state`)
        .send({ projectName: '' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Conversation', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' });
      projectId = response.body.projectId;
    });

    it('should add a message', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/conversation`)
        .send({ role: 'user', content: 'Hello, world!' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get conversation', async () => {
      await request(app)
        .post(`/api/projects/${projectId}/conversation`)
        .send({ role: 'user', content: 'Test message' });

      const response = await request(app)
        .get(`/api/projects/${projectId}/conversation`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
    });

    it('should reject message without role', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/conversation`)
        .send({ content: 'Hello' });
      
      expect(response.status).toBe(400);
    });

    it('should reject message without content', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/conversation`)
        .send({ role: 'user' });
      
      expect(response.status).toBe(400);
    });

    it('should reject message with invalid role', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/conversation`)
        .send({ role: 'invalid', content: 'Hello' });
      
      expect(response.status).toBe(400);
    });

    it('should support conversation limit query param', async () => {
      await request(app)
        .post(`/api/projects/${projectId}/conversation`)
        .send({ role: 'user', content: 'Message 1' });
      
      await request(app)
        .post(`/api/projects/${projectId}/conversation`)
        .send({ role: 'user', content: 'Message 2' });

      const response = await request(app)
        .get(`/api/projects/${projectId}/conversation?limit=1`);
      
      expect(response.status).toBe(200);
      expect(response.body.messages.length).toBeLessThanOrEqual(1);
    });

    it('should reject invalid limit', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/conversation?limit=invalid`);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Deliverables', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' });
      projectId = response.body.projectId;
    });

    it('should create a deliverable', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/deliverables`)
        .send({ type: 'prd', content: 'Test PRD content' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get deliverables', async () => {
      await request(app)
        .post(`/api/projects/${projectId}/deliverables`)
        .send({ type: 'prd', content: 'Test PRD' });

      const response = await request(app)
        .get(`/api/projects/${projectId}/deliverables`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('deliverables');
      expect(Array.isArray(response.body.deliverables)).toBe(true);
    });

    it('should get specific deliverable', async () => {
      await request(app)
        .post(`/api/projects/${projectId}/deliverables`)
        .send({ type: 'prd', content: 'Test PRD' });

      const response = await request(app)
        .get(`/api/projects/${projectId}/deliverables/prd`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('type', 'prd');
    });

    it('should return 404 for non-existent deliverable', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/deliverables/non-existent`);
      
      expect(response.status).toBe(404);
    });

    it('should reject deliverable without type', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/deliverables`)
        .send({ content: 'Test content' });
      
      expect(response.status).toBe(400);
    });

    it('should reject deliverable without content', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/deliverables`)
        .send({ type: 'prd' });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Decisions', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ name: 'Test Project' });
      projectId = response.body.projectId;
    });

    it('should record a decision', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/decisions`)
        .send({ key: 'tech-stack', value: 'Node.js', rationale: 'Best fit' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get decisions', async () => {
      await request(app)
        .post(`/api/projects/${projectId}/decisions`)
        .send({ key: 'tech-stack', value: 'Node.js' });

      const response = await request(app)
        .get(`/api/projects/${projectId}/decisions`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('decisions');
    });

    it('should reject decision without key', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/decisions`)
        .send({ value: 'Node.js' });
      
      expect(response.status).toBe(400);
    });

    it('should reject decision without value', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/decisions`)
        .send({ key: 'tech-stack' });
      
      expect(response.status).toBe(400);
    });

    it('should allow value as false', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/decisions`)
        .send({ key: 'use-typescript', value: false });
      
      expect(response.status).toBe(201);
    });
  });
});
