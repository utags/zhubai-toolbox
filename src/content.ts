import {
  $,
  $$,
  addElement,
  addEventListener,
  addStyle,
  createElement,
  registerMenuCommand,
} from "browser-extension-utils"
import styleText from "data-text:./content.scss"

async function fetchZhubaiSubscriptions(
  page: number,
  subscriberEmailSet: Set<string>,
  subscribers: Array<Record<string, unknown>>
) {
  page = page || 1
  const url = `https://zhubai.love/api/dashboard/subscriptions?limit=20&page=${page}`

  const response = await fetch(url, {})

  console.log("Fetched page", page)

  if (response.status !== 200) {
    console.warn(response)
    return
  }

  const data = (await response.json()) as Promise<Record<string, unknown>>
  // console.log(data)

  for (const subscriber of data.data) {
    subscribers.push(subscriber)
    if (subscriber.subscriber_email) {
      subscriberEmailSet.add(subscriber.subscriber_email)
    }
  }

  const limit = data.pagination.limit as number
  const total = data.pagination.total_count as number

  return { limit, total }
}

async function main() {
  addStyle(styleText)

  const subscriberEmailSet = new Set<string>()
  const subscribers = []
  let page = 1
  let isRunning = false
  let paused = false

  const modal = addElement(document.body, "div", {
    class: "zbtb",
  })

  const toolbar = addElement(modal, "div", {
    style: "display: flex;",
  })

  const pauseButton = addElement(toolbar, "button", {
    textContent: "暂停 ⏸️",
    async onclick(event) {
      paused = !paused
      event.target.textContent = paused ? "继续 ▶️" : "暂停 ⏸️"
      if (!paused) {
        await run()
      }
    },
  })

  const message = addElement(modal, "p", {
    textContent: "🚀 正在导出数据 ...",
  })

  addElement(modal, "p", {
    textContent: "📮 邮箱订阅列表",
  })

  const textarea = addElement(modal, "textarea")

  addElement(modal, "p", {
    textContent: "📖 详细订阅用户数据，包含邮箱订阅和微信订阅",
  })

  const textarea2 = addElement(modal, "textarea")

  const run = async () => {
    if (isRunning) {
      return
    }

    try {
      isRunning = true
      while (isRunning) {
        // eslint-disable-next-line no-await-in-loop
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
          if (paused) {
            message.textContent = `⏸️ 暂停中。已获取数据: ${
              page - 1
            } / ${Math.round(total / 20)}`
            isRunning = false
          }
        } else {
          message.textContent = `🎉 数据导出完毕。请复制下面的数据，做好备份。`
          isRunning = false
          pauseButton.disabled = true
        }
      }
    } catch (error) {
      console.error(error)
      message.innerHTML = `数据导出失败，有问题请在 <a href="https://github.com/utags/zhubai-toolbox/issues" target="_blank">GitHub</a> 或 <a href="https://greasyfork.org/scripts/463934" target="_blank">Greasy Fork</a> 反馈。`
    }
  }

  await run()
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
    newButton.addEventListener("click", async (event) => {
      await main()
      event.preventDefault()
    })
    clearInterval(intervalId)
  }
}, 1000)
