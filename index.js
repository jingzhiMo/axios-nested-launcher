/**
 * @description 对 promise 返回值进行调整
 * @param {Promise} request
 */
function wrapRequest(request) {
  return request.then(data => {
    return [data, null]
  })
    .catch(error => {
      return [null, error]
    })
}

/**
 * @description 创建一个 launcher 用于处理嵌套异步
 */
export default function () {
  let queue = []

  async function launcher(config, ...arg) {
    queue.push({
      request: config.request,
      cancel: config.cancel
    })
    const [result, error] = await wrapRequest(config.request(...arg))

    // 清空当前队列所在的任务
    queue = queue.filter(({ request }) => request !== config.request)

    // 出错后，不往下执行
    if (error) return

    const { children } = config
    if (children && children.length) {
      children.forEach(childConfig => {
        launcher(childConfig, result)
      })
    }
  }

  function start(config, ...arg) {
    // 有请求在进行中，需要把请求逐个取消
    if (queue.length !== 0) {
      queue.forEach(({ cancel }) => (cancel()))
    }
    launcher(config, ...arg)
  }

  return start
}
