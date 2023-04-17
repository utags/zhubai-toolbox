// ==UserScript==
// @name                 Zhubai Toolbox 🧰
// @name:zh-CN           竹白工具箱 🧰
// @namespace            https://github.com/utags/zhubai-toolbox
// @homepageURL          https://github.com/utags/zhubai-toolbox#readme
// @supportURL           https://github.com/utags/zhubai-toolbox/issues
// @version              0.0.3
// @description          Tools for Zhubai creators.
// @description:zh-CN    为竹白创作者的工具箱，包括订阅者信息导出，Markdown 编辑器等功能。更多功能欢迎交流。
// @icon                 https://zhubai.love/favicon.png
// @author               Pipecraft
// @license              MIT
// @match                https://zhubai.love/*
// @connect              zhubai.love
// @grant                GM_addElement
// @grant                GM_addStyle
// ==/UserScript==
//
;(() => {
  "use strict"
  var doc = document
  var createElement = (tagName, attributes) =>
    setAttributes(doc.createElement(tagName), attributes)
  var addElement = (parentNode, tagName, attributes) => {
    if (!parentNode) {
      return
    }
    if (typeof parentNode === "string") {
      attributes = tagName
      tagName = parentNode
      parentNode = doc.head
    }
    if (typeof tagName === "string") {
      const element = createElement(tagName, attributes)
      parentNode.append(element)
      return element
    }
    setAttributes(tagName, attributes)
    parentNode.append(tagName)
    return tagName
  }
  var addStyle = (styleText) => {
    const element = createElement("style", { textContent: styleText })
    doc.head.append(element)
    return element
  }
  var addEventListener = (element, type, listener, options) => {
    if (!element) {
      return
    }
    if (typeof type === "object") {
      for (const type1 in type) {
        if (Object.hasOwn(type, type1)) {
          element.addEventListener(type1, type[type1])
        }
      }
    } else if (typeof type === "string" && typeof listener === "function") {
      element.addEventListener(type, listener, options)
    }
  }
  var setAttribute = (element, name, value) =>
    element ? element.setAttribute(name, value) : void 0
  var setAttributes = (element, attributes) => {
    if (element && attributes) {
      for (const name in attributes) {
        if (Object.hasOwn(attributes, name)) {
          const value = attributes[name]
          if (value === void 0) {
            continue
          }
          if (/^(value|textContent|innerText|innerHTML)$/.test(name)) {
            element[name] = value
          } else if (name === "style") {
            setStyle(element, value, true)
          } else if (/on\w+/.test(name)) {
            const type = name.slice(2)
            addEventListener(element, type, value)
          } else {
            setAttribute(element, name, value)
          }
        }
      }
    }
    return element
  }
  var setStyle = (element, values, overwrite) => {
    if (!element) {
      return
    }
    const style = element.style
    if (typeof values === "string") {
      style.cssText = overwrite ? values : style.cssText + ";" + values
      return
    }
    if (overwrite) {
      style.cssText = ""
    }
    for (const key in values) {
      if (Object.hasOwn(values, key)) {
        style[key] = values[key].replace("!important", "")
      }
    }
  }
  if (typeof Object.hasOwn !== "function") {
    Object.hasOwn = (instance, prop) =>
      Object.prototype.hasOwnProperty.call(instance, prop)
  }
  var addElement2 =
    typeof GM_addElement === "function"
      ? (parentNode, tagName, attributes) => {
          if (!parentNode) {
            return
          }
          if (typeof parentNode === "string") {
            attributes = tagName
            tagName = parentNode
            parentNode = doc.head
          }
          if (typeof tagName === "string") {
            const element = GM_addElement(tagName)
            setAttributes(element, attributes)
            parentNode.append(element)
            return element
          }
          setAttributes(tagName, attributes)
          parentNode.append(tagName)
          return tagName
        }
      : addElement
  var addStyle2 =
    typeof GM_addStyle === "function"
      ? (styleText) => GM_addStyle(styleText)
      : addStyle
  var content_default =
    ".zbtb{width:100%;height:100%;position:fixed;top:72px;left:30px;padding:10px;background-color:#fff;font-weight:600;font-size:16px;color:#060e4b}.zbtb button{font-weight:600;font-size:16px;color:#060e4b}.zbtb button:disabled{opacity:40%}.zbtb textarea{width:90%;height:40%;padding:5px}"
  async function fetchZhubaiSubscriptions(
    page,
    subscriberEmailSet,
    subscribers
  ) {
    page = page || 1
    const url = `https://zhubai.love/api/dashboard/subscriptions?limit=20&page=${page}`
    const response = await fetch(url, {})
    console.log("Fetched page", page)
    if (response.status !== 200) {
      console.warn(response)
      return
    }
    const data = await response.json()
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
    addStyle2(content_default)
    const subscriberEmailSet = /* @__PURE__ */ new Set()
    const subscribers = []
    let page = 1
    let isRunning = false
    let paused = false
    const modal = addElement2(document.body, "div", {
      class: "zbtb",
    })
    const toolbar = addElement2(modal, "div", {
      style: "display: flex;",
    })
    const pauseButton = addElement2(toolbar, "button", {
      textContent: "\u6682\u505C \u23F8\uFE0F",
      async onclick(event) {
        paused = !paused
        event.target.textContent = paused
          ? "\u7EE7\u7EED \u25B6\uFE0F"
          : "\u6682\u505C \u23F8\uFE0F"
        if (!paused) {
          await run()
        }
      },
    })
    const message = addElement2(modal, "p", {
      textContent: "\u{1F680} \u6B63\u5728\u5BFC\u51FA\u6570\u636E ...",
    })
    addElement2(modal, "p", {
      textContent: "\u{1F4EE} \u90AE\u7BB1\u8BA2\u9605\u5217\u8868",
    })
    const textarea = addElement2(modal, "textarea")
    addElement2(modal, "p", {
      textContent:
        "\u{1F4D6} \u8BE6\u7EC6\u8BA2\u9605\u7528\u6237\u6570\u636E\uFF0C\u5305\u542B\u90AE\u7BB1\u8BA2\u9605\u548C\u5FAE\u4FE1\u8BA2\u9605",
    })
    const textarea2 = addElement2(modal, "textarea")
    const run = async () => {
      if (isRunning) {
        return
      }
      try {
        isRunning = true
        while (isRunning) {
          const result = await fetchZhubaiSubscriptions(
            page,
            subscriberEmailSet,
            subscribers
          )
          const total = result.total
          const limit = result.limit
          message.textContent = `\u{1F697} \u6B63\u5728\u83B7\u53D6\u6570\u636E: ${page} / ${Math.round(
            total / 20
          )}`
          if (subscribers.length > 0) {
            textarea.value = JSON.stringify([...subscriberEmailSet], null, 2)
            textarea2.value = JSON.stringify(subscribers, null, 2)
          }
          if (limit * page < total) {
            page++
            if (paused) {
              message.textContent = `\u23F8\uFE0F \u6682\u505C\u4E2D\u3002\u5DF2\u83B7\u53D6\u6570\u636E: ${
                page - 1
              } / ${Math.round(total / 20)}`
              isRunning = false
            }
          } else {
            message.textContent = `\u{1F389} \u6570\u636E\u5BFC\u51FA\u5B8C\u6BD5\u3002\u8BF7\u590D\u5236\u4E0B\u9762\u7684\u6570\u636E\uFF0C\u505A\u597D\u5907\u4EFD\u3002`
            isRunning = false
            pauseButton.disabled = true
          }
        }
      } catch (error) {
        console.error(error)
        message.innerHTML = `\u6570\u636E\u5BFC\u51FA\u5931\u8D25\uFF0C\u6709\u95EE\u9898\u8BF7\u5728 <a href="https://github.com/utags/zhubai-toolbox/issues" target="_blank">GitHub</a> \u6216 <a href="https://greasyfork.org/scripts/463934" target="_blank">Greasy Fork</a> \u53CD\u9988\u3002`
      }
    }
    await run()
  }
  var intervalId = setInterval(() => {
    const button = document.querySelector("th:nth-of-type(6) button")
    if (button && button.textContent === "\u5BFC\u5165/\u5BFC\u51FA") {
      const newButton = createElement("button", {
        textContent: "\u5BFC\u5165/\u5BFC\u51FA",
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
  }, 1e3)
})()
