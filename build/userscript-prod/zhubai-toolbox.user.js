// ==UserScript==
// @name                 Zhubai Toolbox 🧰
// @name:zh-CN           竹白工具箱 🧰
// @namespace            https://github.com/utags/zhubai-toolbox
// @homepageURL          https://github.com/utags/zhubai-toolbox#readme
// @supportURL           https://github.com/utags/zhubai-toolbox/issues
// @version              0.1.0
// @description          Tools for Zhubai creators and readers. 为竹白（zhubai.love）创作者与阅读者的浏览器扩展、油猴脚本，包括详情页显示文章目录，详情页显示网站目录大纲（TOC），订阅者信息导出，Markdown 编辑器等功能。更多功能欢迎交流。
// @description:zh-CN    为竹白（zhubai.love）创作者与阅读者的浏览器扩展、油猴脚本，包括详情页显示文章目录，详情页显示网站目录大纲（TOC），订阅者信息导出，Markdown 编辑器等功能。更多功能欢迎交流。
// @icon                 https://zhubai.love/favicon.png
// @author               Pipecraft
// @license              MIT
// @match                https://*.zhubai.love/*
// @connect              zhubai.love
// @grant                GM_addElement
// ==/UserScript==
//
//// Recent Updates
//// - 0.1.0 2023.04.27
////    - 详情页左侧栏显示文章目录功能
////
;(() => {
  "use strict"
  var doc = document
  var $ = (selectors, element) => (element || doc).querySelector(selectors)
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
  var content_default =
    ".zbtb{width:100%;height:100%;position:fixed;top:72px;left:30px;padding:10px;background-color:#fff;font-weight:600;font-size:16px;color:#060e4b}.zbtb button{font-weight:600;font-size:16px;color:#060e4b}.zbtb button:disabled{opacity:40%}.zbtb textarea{width:90%;height:40%;padding:5px}#left_section{display:none}html[data-zbtb=posts-entry]{--section-width: 300px;margin-left:var(--section-width);margin-right:var(--section-width)}html[data-zbtb=posts-entry] nav{left:0}html[data-zbtb=posts-entry] #left_section{display:block;position:fixed;top:72px;left:0;padding:0 0 72px;height:100%;max-width:var(--section-width);overflow:hidden;box-sizing:border-box}html[data-zbtb=posts-entry] #left_section .container{padding:20px;height:100%;overflow:auto;box-sizing:border-box}html[data-zbtb=posts-entry] #left_section .item{display:block;text-decoration:none;margin-bottom:20px}html[data-zbtb=posts-entry] #left_section .title{margin:0;font-weight:600;font-size:14px;line-height:20px;color:#1a1a1a;word-wrap:break-word;overflow-wrap:break-word}@media(max-width: 1000px){html[data-zbtb=posts-entry]{--section-width: 200px}}"
  var listeners = {}
  var prefix = "extension."
  var getNamespacedKey = (key) => prefix + key
  var getUnnamespacedKey = (key) => key.slice(prefix.length)
  var _getValue = (key) => localStorage.getItem(key)
  var _setValue = (key, value) => {
    const oldValue = localStorage.getItem(key)
    if (oldValue === value) return
    localStorage.setItem(key, value)
    if (listeners[key]) {
      for (const func of listeners[key]) {
        func(getUnnamespacedKey(key), oldValue, value)
      }
    }
  }
  var _addValueChangeListener = (key, func) => {
    listeners[key] = listeners[key] || []
    listeners[key].push(func)
    return () => {
      if (listeners[key] && listeners[key].length > 0) {
        for (let i = listeners[key].length - 1; i >= 0; i--) {
          if (listeners[key][i] === func) {
            listeners[key].splice(i, 1)
          }
        }
      }
    }
  }
  var getValue = (key) => {
    const value = _getValue(getNamespacedKey(key))
    return value && value !== "undefined" ? JSON.parse(value) : void 0
  }
  var setValue = (key, value) => {
    if (value !== void 0)
      _setValue(getNamespacedKey(key), JSON.stringify(value))
  }
  var addValueChangeListener = (key, func) =>
    _addValueChangeListener(getNamespacedKey(key), func)
  var storageKey = "zhubai.posts"
  var nextUrl = ""
  var page = 0
  async function fetchPostList(url) {
    if (!url) {
      return
    }
    page++
    console.log(url, page)
    const response = await fetch(url, {})
    console.log("Fetched page", page)
    if (response.status !== 200) {
      console.warn(response)
      return
    }
    const data = await response.json()
    console.log(data)
    return data
  }
  async function updatePostList(url, updateAll = false) {
    var _a, _b, _c
    const data = await fetchPostList(url)
    if (!data) {
      return
    }
    const newList =
      (_a = data.data) == null
        ? void 0
        : _a.map((post) => ({
            id: post.id,
            title: post.title,
          }))
    nextUrl = (_b = data.pagination) == null ? void 0 : _b.next
    const hasNext = (_c = data.pagination) == null ? void 0 : _c.has_next
    console.log("nextUrl", nextUrl)
    if (newList) {
      const ids = new Set(newList.map((post) => post.id))
      const oldList = (await getValue(storageKey)) || []
      for (const post of oldList) {
        if (!ids.has(post.id)) {
          newList.push(post)
        }
      }
      newList.sort((a, b) => {
        return b.id - a.id
      })
      await setValue(storageKey, newList)
      if (page === 1) {
        await setValue("first_page_updated_at", Date.now())
      }
      if (hasNext === false) {
        await setValue("last_page_updated_at", Date.now())
      }
    }
    if (updateAll && nextUrl) {
      await updatePostList(nextUrl, updateAll)
    }
  }
  async function getAllPostListFromCache() {
    const posts = (await getValue(storageKey)) || []
    console.log(posts)
    return posts
  }
  async function init(token, valueChangeListener) {
    nextUrl = `https://${token}.zhubai.love/api/publications/${token}/posts?publication_id_type=token`
    page = 0
    const now = Date.now()
    const lastPageUpdatedAt = await getValue("last_page_updated_at")
    const firstPageUpdatedAt = await getValue("first_page_updated_at")
    console.log("lastPageUpdatedAt", lastPageUpdatedAt)
    console.log("firstPageUpdatedAt", firstPageUpdatedAt)
    if (
      !lastPageUpdatedAt ||
      now - lastPageUpdatedAt > 10 * 24 * 60 * 60 * 1e3
    ) {
      setTimeout(async () => updatePostList(nextUrl, true), 100)
    } else if (now - firstPageUpdatedAt > 10 * 60 * 1e3) {
      setTimeout(async () => updatePostList(nextUrl, false), 100)
    }
    addValueChangeListener(storageKey, valueChangeListener)
  }
  async function showPostList() {
    const section =
      $("#left_section") ||
      addElement2(document.body, "section", {
        id: "left_section",
      })
    const container =
      $("#left_section .container") ||
      addElement2(section, "div", {
        class: "container",
      })
    container.innerHTML = ""
    const postList = await getAllPostListFromCache()
    for (const post of postList) {
      const a = addElement2(container, "a", {
        class: "item",
        href: "/posts/" + post.id,
      })
      addElement2(a, "h2", {
        class: "title",
        textContent: post.title,
      })
    }
  }
  var config = {
    matches: ["https://*.zhubai.love/*"],
    world: "MAIN",
  }
  async function fetchZhubaiSubscriptions(
    page2,
    subscriberEmailSet,
    subscribers
  ) {
    page2 = page2 || 1
    const url = `https://zhubai.love/api/dashboard/subscriptions?limit=20&page=${page2}`
    const response = await fetch(url, {})
    console.log("Fetched page", page2)
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
    const subscriberEmailSet = /* @__PURE__ */ new Set()
    const subscribers = []
    let page2 = 1
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
            page2,
            subscriberEmailSet,
            subscribers
          )
          const total = result.total
          const limit = result.limit
          message.textContent = `\u{1F697} \u6B63\u5728\u83B7\u53D6\u6570\u636E: ${page2} / ${Math.round(
            total / 20
          )}`
          if (subscribers.length > 0) {
            textarea.value = JSON.stringify([...subscriberEmailSet], null, 2)
            textarea2.value = JSON.stringify(subscribers, null, 2)
          }
          if (limit * page2 < total) {
            page2++
            if (paused) {
              message.textContent = `\u23F8\uFE0F \u6682\u505C\u4E2D\u3002\u5DF2\u83B7\u53D6\u6570\u636E: ${
                page2 - 1
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
  async function main2() {
    if (!$("#zbtb_style")) {
      addElement2(document.head, "style", {
        id: "zbtb_style",
        textContent: content_default,
      })
    }
    const url = location.href
    if (/^https:\/\/\w+\.zhubai\.love\/posts\//.test(url)) {
      document.documentElement.dataset.zbtb = "posts-entry"
      ;(async () => {
        const token = location.hostname.split(".")[0]
        await init(token, showPostList)
        await showPostList()
      })()
    } else if (url.includes("https://zhubai.love/creator/subscribers")) {
      const intervalId = setInterval(() => {
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
    } else {
      document.documentElement.dataset.zbtb = "0"
    }
  }
  main2()
  addEventListener(window, "popstate", main2)
  var _pushState = history.pushState
  history.pushState = function (o, a, u) {
    _pushState.call(history, o, a, u)
    main2()
  }
})()
