# axios-nested-launcher
这是一个嵌套 `axios` 请求的启动器，主要处理的情景是嵌套的请求，重复请求需要取消的情形。简单例子描述：

假设需要请求一个列表中的数据，通过`fetchList`获取；而`fetchDetail`的相关，需要根据`fetchList`的内容，发出对应的请求。伪代码如下：

```js
import axios from 'axios'

const fetchList = () => axios(/* ... */)
const fetchDetail1 = () => axios(/* ... */)
const fetchDetail2 = () => axios(/* ... */)

async function fetch() {
  const data = await fetchList()

  // 假设需要列表中每个项的id
  const idArray = data.map(item => item.id)

  const nameArray = await fetchDetail1(idArray)
  fetchDetail2(nameArray)
}

fetch()
```

当上面那个的`fetchList`发出的时候，正常是没问题的；但有时候因为用户交互的情况，有可能其中一个请求还没有请求完毕，就重新开始下一个请求，例如：

```js
fetch()
// 用户交互后，因为触发回调，再次发出请求
fetch()
```

通常我们也可以使用函数节流的方法去处理一些频繁交互的需要；但有可能节流之后，还是有部分请求没有完成；那样子就造成了，`request`这个函数必定执行完所有逻辑；这样子有可能因为请求返回的顺序导致页面数据有不可预测的问题。

这种情况，我们可以在重复调用`request`的时候，遇到部分请求还没有结束的时候，把该部分请求取消了；那么`request`整个进程就提前结束。`axios-nested-launcher`的工具就是处理这种情况。

## 使用例子

```js
import axios from 'axios'
import axiosNestedLauncher from 'axios-nested-launcher'

const CancelToken = axios.CancelToken
const listCancel = CancelToken.source()
const detail1Cancel = CancelToken.source()
const detail2Cancel = CancelToken.source()

const fetchList = () => axios.get('/list', { cancelToken: listCancel.token })
const fetchDetail1 = () => axios('/detail1', { cancelToken: detail1Cancel.token })
const fetchDetail2 = () => axios('/detail2', { cancelToken: detail2Cancel.token })
const start = axiosNestedLauncher()

async function fetch() {
  start(
    {
      request: fetchList,
      cancel: listCancel,
      children: [
        {
          request: fetchDetail1,
          cancel: detail1Cancel,
          children: [
            {
              request: fetch2Detail,
              cancel: detail2Cancel
            }
          ]
        }
      ]
    },
    /* some arguments */
  )
}

fetch()
```

主要处理是，把请求的嵌套关系配置成对象；调用的顺序也是只有当`request`完成之后，再执行`children`数组的函数；而`children`数组的`request`的方法接收的参数，即为上一级的`request`返回的内容；当部分请求没有完成，马上有开始下一次请求`fetch`的时候，会调用还没完成请求的`cancel`方法进行终止。后续未开始执行的方法也不会执行。若部分`request`请求出错了，后续的请求也不会执行。
