declare const wx: any;

interface MessageQueueItem {
  config: any,
  content: any,
  timestamp: number
}

interface Config {
  url: string;
  data?: any;
  header?: any;
  method?: string;
  retryTimes?: number,        // 重连次数，默认无限重连
  retryInterval?: number,     // 重连间隔，默认3s，可以设置最低100ms
  success?: () => any;
  fail?: () => any;
  complete?: () => any;
}

interface SendMessageConfig {
  noResponse?: boolean,          // 无需等待服务器响应，只要数据发送成功，则resolve
  timeout?: number               // 超时，数据发出之后，xx毫秒没有相应则算超时，reject
}

class WxSocket {

  private ALL: string = 'ALL';
  private retryCount: number = 0;
  private listener: any = {};
  private promiseMaps: any = {};
  public socketOpen: boolean = false;
  public messageQueue: any[] = [];

  constructor(private config: Config) {
    this.config.retryInterval = this.config.retryInterval && this.config.retryInterval > 100 ? this.config.retryInterval : 3000;
    this.listen().connect().afterConnect();
  }

  /**
   * 发送消息
   * @param msg {*}
   * @param [config]  {*}
   * @returns {Promise<T>}
   */
  public send(msg: any, config?: SendMessageConfig): Promise<any> {
    let content: any = this.wrapMsg(msg);
    config = config || {};
    const WxSocket: WxSocket = this;
    return new Promise(function (resolve, reject) {
      WxSocket.promiseMaps[content.id] = {
        resolve,
        reject,
        promise: this
      };

      // socket未连接上，先放到消息队列里面
      if (!WxSocket.socketOpen) {
        WxSocket.messageQueue.push({
          content,
          config,
          timestamp: new Date().getTime()
        });
      }
      // socket已连接，尝试发送消息
      else {
        try {
          wx.sendSocketMessage({
            data: JSON.stringify(content),
            success(){
              if (config.noResponse) {
                WxSocket.finishRequest(content.id);
                resolve();
              }
            },
            fail(){
              WxSocket.finishRequest(content.id);
              reject();
            }
          });
        } catch (err) {
          reject(err);
          WxSocket.finishRequest(content.id);
        }
      }
    });
  }

  /**
   * 监听消息
   * @param typeOrCallBack
   * @param callback
   * @returns {()=>T[]}
   */
  public on(typeOrCallBack: string | (() => any), callback?: () => any): () => any[] {
    let type;

    switch (arguments.length) {
      case 1:
        type = this.ALL;
        callback = arguments[0];
        break;
      case 2:
        type = arguments[0];
        callback = arguments[1];
        break;
      default:
        throw new Error('Invalid argument');
    }

    if (!WxSocket.helper.isString(type)) throw new Error('type argument must be a string');
    if (!WxSocket.helper.isFunction(callback)) throw new Error('callback argument must be a function');

    this.listener[type] = this.listener[type] || [];

    this.listener[type].push(callback);

    let index = this.listener[type].length - 1;

    return () => {
      return this.listener[type].splice(index, 1);
    };
  }

  static helper = {
    messageIndex: 0,
    isFunction(any: any): boolean{
      return typeof any === 'function';
    },
    isString(any: any): boolean{
      return Object.prototype.toString.call(any) === '[object String]';
    },
    isObject(any){
      return typeof any === 'object' && any !== null;
    },
    isPlainObject(any){
      return Object.prototype.toString.call(any) === '[object Object]';
    },
    get nextId() {
      return this.messageIndex++;
    },
    get id(): string {
      return Date.now() + '.' + this.nextId;
    }
  };

  private listen(): WxSocket {
    wx.onSocketOpen(() => {
      console.info('WebSocket已连接');
      this.retryCount = 0;
      this.socketOpen = true;
      this.messageQueue.forEach((queue: MessageQueueItem) => this.send(queue.content, queue.config));
      this.messageQueue = []
    });
    wx.onSocketError(() => {
      console.error('WebSocket连接打开失败，请检查！');
      this.socketOpen = false;
    });
    return this;
  }

  private connect(): WxSocket {
    wx.connectSocket({
      url: this.config.url,
      header: {
        'content-type': 'application/json'
      }
    });
    return this;
  }

  private afterConnect(): WxSocket {
    wx.onSocketClose(() => {
      this.socketOpen = false;
      setTimeout(() => this.retry(), this.config.retryInterval);
    });
    wx.onSocketMessage(({data}) => {
      try {
        data = JSON.parse(data);
      } catch (err) {
      }

      // resolve the request promise
      let deferred = this.promiseMaps[data.id];
      if (data.id && deferred) {
        this.finishRequest(data.id);
        deferred.resolve.call(deferred.promise, data);
      }

      let callbacks = [];

      for (let type in this.listener) {
        if (this.listener.hasOwnProperty(type)) {
          data.type === type && (callbacks = this.listener[type]);
        }
      }

      callbacks = (this.listener[this.ALL] || []).concat(callbacks);

      callbacks.forEach(func => WxSocket.helper.isFunction(func) && func(data));

    });
    return this;
  }

  /**
   * 包装消息
   * @param msg
   * @returns {*}
   * @private
   */
  private wrapMsg(msg): string {
    if (WxSocket.helper.isPlainObject(msg)) {
      if (msg.type) {
        !msg.id ? msg.id = WxSocket.helper.id : void 0;
        return msg;
      } else {
        return this.wrapMsg({type: 'message', msg: msg, id: WxSocket.helper.id});
      }
    } else {
      return this.wrapMsg({type: 'message', msg: msg, id: WxSocket.helper.id});
    }
  }

  private finishRequest(requestID: number): WxSocket {
    this.promiseMaps[requestID] = null;
    delete this.promiseMaps[requestID];
    return this;
  }

  /**
   * 断线重连
   * @returns {WxSocket}
   */
  private retry(): WxSocket {
    // 服务器已经连上，或者超出了最大重连次数
    if (this.socketOpen || this.config.retryTimes > 0 && this.config.retryTimes <= this.retryCount) return;
    this.retryCount += 1;
    console.warn(`第[ ${this.retryCount} ]次尝试重连WebSocket`);
    this.connect();
    return this;
  }

}

export default WxSocket;