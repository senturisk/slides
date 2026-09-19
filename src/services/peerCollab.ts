import Peer, { DataConnection } from 'peerjs';
import { Collaborator, CollabMessage, Presentation, Slide } from '../types';

export type CollabEventCallback = (event: string, data: unknown) => void;

const COLLAB_COLORS = [
  '#EA8600', // Amber
  '#0B57D0', // Blue
  '#6750A4', // Purple
  '#386A20', // Sage green
  '#B3261E', // Crimson
  '#00639B', // Teal
  '#7D5260', // Rose
];

export class PeerCollabService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private listeners: Set<CollabEventCallback> = new Set();
  
  public myPeerId: string = '';
  public myName: string = 'User ' + Math.floor(1000 + Math.random() * 9000);
  public myColor: string = COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
  public isHost: boolean = false;
  public roomId: string = '';
  public collaborators: Map<string, Collaborator> = new Map();
  public isConnected: boolean = false;
  public statusMessage: string = 'Offline';

  public onCollaboratorsChange: ((list: Collaborator[]) => void) | null = null;
  public onRemotePresentationUpdate: ((presentation: Presentation) => void) | null = null;

  constructor() {
    const savedName = localStorage.getItem('sen_slides_user_name');
    if (savedName) this.myName = savedName;
  }

  public setUserName(name: string) {
    this.myName = name;
    localStorage.setItem('sen_slides_user_name', name);
    this.notify('profile_update', { name: this.myName, color: this.myColor });
  }

  public subscribe(cb: CollabEventCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(event: string, data: unknown) {
    if (event === 'collaborators_update' && this.onCollaboratorsChange) {
      this.onCollaboratorsChange(data as Collaborator[]);
    }
    if ((event === 'sync_presentation' || event === 'remote_presentation_update') && this.onRemotePresentationUpdate) {
      this.onRemotePresentationUpdate(data as Presentation);
    }

    this.listeners.forEach((cb) => {
      try {
        cb(event, data);
      } catch (err) {
        console.error('Collab callback error', err);
      }
    });
  }

  /**
   * Start hosting a collaborative session
   */
  public async startHosting(initialPresentation: Presentation): Promise<string> {
    this.leaveSession();
    this.isHost = true;
    this.statusMessage = 'Connecting to peer network...';
    this.notify('status_change', this.statusMessage);

    const generatedRoomCode = 'sen-' + Math.random().toString(36).substring(2, 8);

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(generatedRoomCode, {
          debug: 1,
        });

        peer.on('open', (id) => {
          this.peer = peer;
          this.myPeerId = id;
          this.roomId = id;
          this.isConnected = true;
          this.statusMessage = 'Hosting room';
          this.notify('host_ready', { roomId: id });
          resolve(id);
        });

        peer.on('connection', (conn) => {
          this.setupConnection(conn, initialPresentation);
        });

        peer.on('error', (err) => {
          console.warn('PeerJS error:', err);
          // If ID is taken, try auto-assigned id
          if (err.type === 'unavailable-id') {
            const fallbackPeer = new Peer();
            fallbackPeer.on('open', (id) => {
              this.peer = fallbackPeer;
              this.myPeerId = id;
              this.roomId = id;
              this.isConnected = true;
              this.statusMessage = 'Hosting room';
              this.notify('host_ready', { roomId: id });
              resolve(id);
            });
            fallbackPeer.on('connection', (c) => this.setupConnection(c, initialPresentation));
          } else {
            this.statusMessage = 'Connection error: ' + (err.message || 'Unknown');
            this.notify('status_change', this.statusMessage);
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Join an existing session by Host Room / Peer ID
   */
  public async joinSession(targetRoomId: string): Promise<boolean> {
    this.leaveSession();
    this.isHost = false;
    this.roomId = targetRoomId.trim();
    this.statusMessage = 'Connecting to room: ' + this.roomId;
    this.notify('status_change', this.statusMessage);

    return new Promise((resolve) => {
      try {
        const peer = new Peer();

        peer.on('open', (myId) => {
          this.peer = peer;
          this.myPeerId = myId;

          const conn = peer.connect(this.roomId, {
            reliable: true,
          });

          conn.on('open', () => {
            this.isConnected = true;
            this.connections.set(this.roomId, conn);
            this.statusMessage = 'Connected to room';
            this.notify('status_change', this.statusMessage);

            // Send introduction
            conn.send({
              type: 'join',
              name: this.myName,
              color: this.myColor,
            });

            resolve(true);
          });

          conn.on('data', (data) => {
            this.handleIncomingData(conn.peer, data as CollabMessage);
          });

          conn.on('close', () => {
            this.connections.delete(conn.peer);
            this.statusMessage = 'Host disconnected';
            this.notify('status_change', this.statusMessage);
          });

          conn.on('error', (err) => {
            console.warn('Connection error to host:', err);
            this.statusMessage = 'Connection error: ' + err.message;
            this.notify('status_change', this.statusMessage);
            resolve(false);
          });
        });

        peer.on('error', (err) => {
          console.warn('Peer error during join:', err);
          this.statusMessage = 'Failed to join: ' + err.message;
          this.notify('status_change', this.statusMessage);
          resolve(false);
        });
      } catch (err) {
        console.error('Join exception', err);
        resolve(false);
      }
    });
  }

  private setupConnection(conn: DataConnection, currentPresentation?: Presentation) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

      // If we are host, send current presentation state
      if (this.isHost && currentPresentation) {
        conn.send({
          type: 'welcome',
          presentation: currentPresentation,
          collaborators: Array.from(this.collaborators.values()),
        });
      }
    });

    conn.on('data', (data) => {
      this.handleIncomingData(conn.peer, data as CollabMessage);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.collaborators.delete(conn.peer);
      this.broadcast({ type: 'user_left', peerId: conn.peer }, conn.peer);
      this.notify('collaborators_update', Array.from(this.collaborators.values()));
    });
  }

  private handleIncomingData(senderPeerId: string, message: CollabMessage) {
    if (!message || typeof message !== 'object') return;

    switch (message.type) {
      case 'join': {
        const newCollab: Collaborator = {
          peerId: senderPeerId,
          name: message.name || 'Anonymous',
          color: message.color || COLLAB_COLORS[0],
          lastActive: Date.now(),
        };
        this.collaborators.set(senderPeerId, newCollab);
        this.notify('collaborators_update', Array.from(this.collaborators.values()));

        if (this.isHost) {
          // Broadcast to all other peers
          this.broadcast(
            {
              type: 'welcome',
              presentation: (window as unknown as { __CURRENT_PRES_GETTER__?: () => Presentation })
                .__CURRENT_PRES_GETTER__?.() as Presentation,
              collaborators: Array.from(this.collaborators.values()),
            },
            senderPeerId
          );
        }
        break;
      }

      case 'welcome': {
        if (message.presentation) {
          this.notify('sync_presentation', message.presentation);
        }
        if (message.collaborators) {
          message.collaborators.forEach((c) => {
            if (c.peerId !== this.myPeerId) {
              this.collaborators.set(c.peerId, c);
            }
          });
          this.notify('collaborators_update', Array.from(this.collaborators.values()));
        }
        break;
      }

      case 'cursor': {
        const collab = this.collaborators.get(senderPeerId);
        if (collab) {
          collab.cursor = {
            x: message.x,
            y: message.y,
            slideId: message.slideId,
          };
          collab.selectedElementId = message.selectedElementId;
          collab.lastActive = Date.now();
          this.notify('cursor_update', collab);
        }

        // Host re-broadcasts to others
        if (this.isHost) {
          this.broadcast(message, senderPeerId);
        }
        break;
      }

      case 'update_slide': {
        this.notify('remote_slide_update', message.slide);
        if (this.isHost) {
          this.broadcast(message, senderPeerId);
        }
        break;
      }

      case 'update_presentation': {
        this.notify('remote_presentation_update', message.presentation);
        if (this.isHost) {
          this.broadcast(message, senderPeerId);
        }
        break;
      }

      case 'change_slide': {
        this.notify('remote_slide_change', message.slideId);
        if (this.isHost) {
          this.broadcast(message, senderPeerId);
        }
        break;
      }

      case 'user_left': {
        this.collaborators.delete(message.peerId);
        this.notify('collaborators_update', Array.from(this.collaborators.values()));
        break;
      }
    }
  }

  public broadcast(message: CollabMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(message);
        } catch (err) {
          console.warn('Failed to send data to peer', peerId, err);
        }
      }
    });
  }

  public broadcastCursor(x: number, y: number, slideId: string, selectedElementId?: string | null) {
    if (!this.isConnected) return;
    this.broadcast({
      type: 'cursor',
      x,
      y,
      slideId,
      selectedElementId,
    });
  }

  public broadcastSlideUpdate(slide: Slide) {
    if (!this.isConnected) return;
    this.broadcast({
      type: 'update_slide',
      slide,
    });
  }

  public broadcastPresentationUpdate(presentation: Presentation) {
    if (!this.isConnected) return;
    this.broadcast({
      type: 'update_presentation',
      presentation,
    });
  }

  public broadcastSlideChange(slideId: string) {
    if (!this.isConnected) return;
    this.broadcast({
      type: 'change_slide',
      slideId,
    });
  }

  public leaveSession() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.collaborators.clear();
    this.isConnected = false;
    this.roomId = '';
    this.myPeerId = '';
    this.statusMessage = 'Disconnected';
    this.notify('status_change', this.statusMessage);
    this.notify('collaborators_update', []);
  }
}

export const collabService = new PeerCollabService();
