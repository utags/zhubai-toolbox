import {
  addValueChangeListener,
  getValue,
  setValue,
} from "browser-extension-storage/lib/local-storage"
import {
  $,
  addElement,
  addEventListener,
  addStyle,
  createElement,
} from "browser-extension-utils"

const storageKey = "zhubai.posts"
let nextUrl = ""
let page = 0

async function fetchPostList(url: string) {
  if (!url) {
    return
  }

  page++
  const response = await fetch(url, {})

  console.log("Fetched page", page)

  if (response.status !== 200) {
    console.warn(response)
    return
  }

  const data = (await response.json()) as Promise<Record<string, unknown>>

  return data
}

async function updatePostList(url, updateAll = false) {
  const data = await fetchPostList(url)
  if (!data) {
    return
  }

  const newList = data.data?.map((post) => ({
    id: post.id,
    title: post.title,
  }))
  nextUrl = data.pagination?.next
  const hasNext = data.pagination?.has_next

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

export async function getPostListFromCache(page = 1) {
  const limit = 20
  const posts = (await getValue(storageKey)) || []
  return posts.slice((page - 1) * limit, page * limit - 1)
}

export async function getAllPostListFromCache() {
  const posts = (await getValue(storageKey)) || []
  return posts
}

export async function init(token: string, valueChangeListener) {
  nextUrl = `https://${token}.zhubai.love/api/publications/${token}/posts?publication_id_type=token`
  page = 0
  const now = Date.now()
  const lastPageUpdatedAt = await getValue("last_page_updated_at")
  const firstPageUpdatedAt = await getValue("first_page_updated_at")

  if (
    !lastPageUpdatedAt ||
    now - lastPageUpdatedAt > 10 * 24 * 60 * 60 * 1000 /* 10 days */
  ) {
    setTimeout(async () => updatePostList(nextUrl, true), 100)
  } else if (now - firstPageUpdatedAt > 10 * 60 * 1000 /* 10 minutes */) {
    setTimeout(async () => updatePostList(nextUrl, false), 100)
  }

  addValueChangeListener(storageKey, valueChangeListener)
}

export async function showPostList() {
  const aside =
    $("#left_aside") ||
    addElement(document.body, "aside", {
      id: "left_aside",
    })

  const container =
    $("#left_aside .container") ||
    addElement(aside, "div", {
      class: "container",
    })

  container.innerHTML = ""

  const currentId = (/posts\/(\d+)/.exec(location.pathname) || [])[1]

  const postList = await getAllPostListFromCache()
  for (const post of postList) {
    const a = addElement(container, "a", {
      class: currentId === post.id ? "item current" : "item",
      href: "/posts/" + post.id,
    })
    if (currentId === post.id) {
      setTimeout(() => {
        a.scrollIntoView({ block: "nearest" })
      }, 1)
    }

    addElement(a, "h2", {
      class: "title",
      textContent: post.title,
    })
  }
}
