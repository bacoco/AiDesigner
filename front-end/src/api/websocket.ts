import { io, Socket } from 'socket.io-client';
import type {
  WSStateUpdatedEvent,
  WSMessageAddedEvent,
  WSDeliverableCreatedEvent,
  WSDecisionRecordedEvent,
  WSAgentExecutedEvent,
} from './types';

const WS_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type EventHandler<T = any> = (data: T) => void;

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(projectId: string): void {
    if (this.socket) {
      this.socket.emit('join-project', projectId);
    }
  }

  leaveProject(projectId: string): void {
    if (this.socket) {
      this.socket.emit('leave-project', projectId);
    }
  }

  onStateUpdated(handler: EventHandler<WSStateUpdatedEvent>): () => void {
    return this.on('state:updated', handler);
  }

  onMessageAdded(handler: EventHandler<WSMessageAddedEvent>): () => void {
    return this.on('message:added', handler);
  }

  onDeliverableCreated(handler: EventHandler<WSDeliverableCreatedEvent>): () => void {
    return this.on('deliverable:created', handler);
  }

  onDecisionRecorded(handler: EventHandler<WSDecisionRecordedEvent>): () => void {
    return this.on('decision:recorded', handler);
  }

  onAgentExecuted(handler: EventHandler<WSAgentExecutedEvent>): () => void {
    return this.on('agent:executed', handler);
  }

  private on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.socket) {
      console.warn(`Cannot register handler for ${event}: socket not connected`);
      return () => {};
    }

    this.socket.on(event, handler);

    return () => {
      if (this.socket) {
        this.socket.off(event, handler);
      }
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsClient = new WebSocketClient();
