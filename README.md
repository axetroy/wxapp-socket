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