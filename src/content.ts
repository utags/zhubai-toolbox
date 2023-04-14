import {
  $,
  $$,
  addElement,
  addEventListener,
  createElement,
  registerMenuCommand,
} from "browser-extension-utils"

async function fetchZhubaiSubscriptions(page, subscriberEmailSet, subscribers) {
  page = page || 1
  const url = `https://zhubai.love/api/dashboard/subscriptions?limit=20&page=${page}`

  const response = await fetch(url, {})

  console.log("Fetched page", page)

  if (response.status !== 200) {
    console.warn(response)
    return
  }

  const data = await response.json()
  // console.log(data)

  for (const subscriber of data.data) {
    subscribers.push(subscriber)
    if (subscriber.subscriber_email) {
      subscriberEmailSet.add(subscriber.subscriber_email)
    }
  }

  const limit = data.pagination.limit
  const total = data.pagination.total_count

  return { limit, total }
}

async function main() {
  const modal = addElement(document.body, "div", {
    style:
      "width: 100%; height: 100%; position: fixed; top: 72px; left: 30px; padding: 10px; background-color: #fff;",
  })

  const message = addElement(modal, "p", {
    style: "font-weight: 600; font-size: 16px; color: #060e4b;",
    textContent: "🚀 正在导出数据 ...",
  })

  addElement(modal, "p", {
    style: "font-weight: 600; font-size: 16px; color: #060e4b;",
    textContent: "📮 邮箱订阅列表",
  })

  const textarea = addElement(modal, "textarea", {
    style: "width: 90%; height: 40%; padding: 5px;",
  })

  addElement(modal, "p", {
    style: "font-weight: 600; font-size: 16px; color: #060e4b;",
    textContent: "📖 详细订阅用户数据，包含邮箱订阅和微信订阅",
  })

  const textarea2 = addElement(modal, "textarea", {
    style: "width: 90%; height: 40%; padding: 5px;",
  })

  const subscriberEmailSet = new Set()
  const subscribers = []
  let page = 1
  try {
    while (true) {
      const result = await fetchZhubaiSubscriptions(
        page,
        subscriberEmailSet,
        subscribers
      )
      const total = result.total
      const limit = result.limit
      message.textContent = `🚗 正在获取数据: ${page} / ${Math.round(
        total / 20
      )}`
      if (subscribers.length > 0) {
        textarea.value = JSON.stringify([...subscriberEmailSet], null, 2)
        textarea2.value = JSON.stringify(subscribers, null, 2)
      }

      if (limit * page < total) {
        page++
      } else {
        break
      }
    }

    message.textContent = `🎉 数据导出完毕。请复制下面的数据，做好备份。`
  } catch (error) {
    console.error(error)
    message.innerHTML = `数据导出失败，有问题请在 <a href="https://github.com/utags/zhubai-toolbox/issues" target="_blank">GitHub</a> 或 <a href="https://greasyfork.org/scripts/463934" target="_blank">Greasy Fork</a> 反馈。`
  }
}

const intervalId = setInterval(() => {
  const button = document.querySelector("th:nth-of-type(6) button")
  if (button && button.textContent === "导入/导出") {
    const newButton = createElement("button", {
      textContent: "导入/导出",
      class: "Button_button__2Ce79 Button_defaultButton__1bbUl",
    })
    button.after(newButton)
    button.remove()
    newButton.addEventListener("click", (event) => {
      main()
      event.preventDefault()
    })
    clearInterval(intervalId)
  }
}, 1000)
