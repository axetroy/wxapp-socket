# 用于微信小程序的socket库

需要服务器配合，服务器需要返回一样的结构体

```typescript
interface MessageConstructor{
  type:string,      // 默认返回 "ALL"
  payload?:any,     // 要发送的数据体
  id?:string        // 此id为消息发送者的消息id，如果有，则返回
}
```

## 特性

- 简单易容的API
- 使得每次发送数据，都可以得到一个Promise


## Usage

```bash
yarn add @axetroy/wxapp-socket;
```

```javascript
const wxSocket = require('@axetroy/wxapp-socket');

new wxSocket({
    url: 'ws://0.0.0.0:10086'
});

wxSocket.on(function(msg) {
  // ...
});

wxSocket.send('hello world')
.then(function(res) {
  // ...
});

```

## API

### new wxSocket(config);

- *Arguments*
    - *config*
    ```typescript
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
    ```

### wxSocket.on([type:string], callback): () => any[]

- *Arguments*
    - *type?string*，服务器返回的消息类型。当传入type时，指定监听某一类的消息，不传则接收所有消息
    - *callback:Function*，接收到消息后的回调函数
- *Return*
    - {Function} 返回一个函数，用于取消监听

### wxSocket.send(msg: any, [config]) : Promise<any>

发送消息至服务器，type指定类型，如果不指定，则type默认是message

- *Arguments*
    - *msg?any*，发送的消息
    - *config:Object*，配置
    ```typescript
    interface SendMessageConfig {
      noResponse?: boolean,          // 无需等待服务器响应，只要数据发送成功，则resolve
      timeout?: number               // 超时，数据发出之后，xx毫秒没有相应则算超时，reject
    }
    ```
- *Return*
    - {Promise} 返回一个promise
- *Example*

```javascript
  wxSocket.send('hello world');
  /*
    实际发送
    {
      "type": "MESSAGE",
      "payload": "hello world",
      "id": "1484540236270908"    // 每一条信息都产生不同的id
    }
  */
  wxSocket.send({type:'LOGIN',payload:{name:"axe",age:100}});
  /*
    实际发送
    {
      "type": "LOGIN",
      "payload": {
        name: "axe",
        age: 100
      },
      "id": "1484540236270908"
    }
  */
```

### wxSocket.socketOpen:boolean

当前socket是否正在链接

### wxSocket.messageQueue:array

当前的消息队列，只要在socket未连接，然后又使用wxSocket.send方法的情况下，会把消息放入队列

当socket重新连上之后，会重新发送消息

## License

The MIT License (MIT)

Copyright (c) 2017 axetroy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
