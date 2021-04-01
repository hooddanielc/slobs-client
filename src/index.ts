import SockJS from 'sockjs-client';

export class SlobsClient {
  socket: WebSocket;
  connectionStatus: string;
  nextRequestId: number;
  requests: {[id: string]: any};
  subscriptions: {[id: string]: any};
  requestString: string;

  static connect(url: string, token: string): Promise<SlobsClient> {
    return new Promise<SlobsClient>((resolve, reject) => {
      const socket = new SockJS(url);
      const client = new SlobsClient(socket);

      socket.onopen = () => {
        client.request('TcpServerService', 'auth', token).then(() => {
          client.onConnectionHandler();
          resolve(client);
        }).catch(reject);
      }

      socket.onmessage = (e) => {
        client.onMessageHandler(e.data);
        client.logMessage(e.data.toString(), 'response');
      }
    });
  }

  constructor(socket: WebSocket) {
    this.nextRequestId = 1;
    this.requests = {};
    this.subscriptions = {};
    this.connectionStatus = 'pending';
    this.requestString = '';
    this.socket = socket;

    this.socket.onclose = (e) => {
      this.connectionStatus = 'disconnected';
      throw new Error('disconnected: ' + e.reason);
      console.log('close', e);
    }
  }

  onConnectionHandler() {
    this.connectionStatus = 'connected';
  }

  request(resourceId: string, methodName: string, ...args: any[]) {
    let id = this.nextRequestId++;
    let requestBody = {
      jsonrpc: '2.0',
      id,
      method: methodName,
      params: { resource: resourceId, args }
    };

    return this.sendMessage(requestBody);
  }

  async sendMessage(message: any): Promise<any> {
    let requestBody = message;
    if (typeof message === 'string') {
      try {
        requestBody = JSON.parse(message);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }

    if (!requestBody.id) {
      throw new Error('id is required');
    }

    this.logMessage(requestBody, 'request');

    return new Promise<any>((resolve: any, reject: any) => {
      this.requests[requestBody.id] = {
        body: requestBody,
        resolve,
        reject,
        completed: false
      };
      this.socket.send(JSON.stringify(requestBody));
    });
  }

  onMessageHandler(data: any) {
    let message = JSON.parse(data);
    let request = this.requests[message.id];

    if (request) {
      if (message.error) {
        request.reject(message.error);
      } else if (message.result && message.result._type === 'SUBSCRIPTION' && message.result.emitter === 'PROMISE') {
        this.subscriptions[message.result.resourceId] = (res: any) => request.resolve(res);
      } else {
        request.resolve(message.result);
      }
      delete this.requests[message.id];
    }

    const result = message.result;
    if (!result) return;

    if (result._type === 'EVENT') {
      switch (result.emitter) {
        case 'STREAM': {
          this.subscriptions[message.result.resourceId](result.data);
          break;
        }
        case 'PROMISE': {
          this.subscriptions[message.result.resourceId](result.data);
          delete this.subscriptions[message.result.resourceId];
          break;
        }
      }
    }
  }

  subscribe(resourceId: string, channelName: string, cb: any) {
    this.request(resourceId, channelName).then((subscriptionInfo: any) => {
      this.subscriptions[subscriptionInfo.resourceId] = cb;
    });
  }

  logMessage(data: any, type: any) {
    console.log('LOG MESSAGE', type, data);
  }
}
