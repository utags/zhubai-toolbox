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
  console.log(url, page)
  const response = await fetch(url, {})

  console.log("Fetched page", page)

  if (response.status !== 200) {
    console.warn(response)
    return
  }

  const data = (await response.json()) as Promise<Record<string, unknown>>
  console.log(data)

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

export async function getPostListFromCache(page = 1) {
  const limit = 20
  const posts = (await getValue(storageKey)) || []
  console.log(posts)
  return posts.slice((page - 1) * limit, page * limit - 1)
}

export async function getAllPostListFromCache() {
  const posts = (await getValue(storageKey)) || []
  console.log(posts)
  return posts
}

export async function init(token: string, valueChangeListener) {
  nextUrl = `https://${token}.zhubai.love/api/publications/${token}/posts?publication_id_type=token`
  page = 0
  const now = Date.now()
  const lastPageUpdatedAt = await getValue("last_page_updated_at")
  const firstPageUpdatedAt = await getValue("first_page_updated_at")
  console.log("lastPageUpdatedAt", lastPageUpdatedAt)
  console.log("firstPageUpdatedAt", firstPageUpdatedAt)
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
  const section =
    $("#left_section") ||
    addElement(document.body, "section", {
      id: "left_section",
    })

  const container =
    $("#left_section .container") ||
    addElement(section, "div", {
      class: "container",
    })

  container.innerHTML = ""

  const postList = await getAllPostListFromCache()
  for (const post of postList) {
    const a = addElement(container, "a", {
      class: "item",
      href: "/posts/" + post.id,
    })
    addElement(a, "h2", {
      class: "title",
      textContent: post.title,
    })
  }
}
