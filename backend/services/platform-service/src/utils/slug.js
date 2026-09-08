export function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'item'
}

export async function uniqueSlug(base, existsFn) {
  let slug = slugify(base)
  let candidate = slug
  let n = 2
  while (await existsFn(candidate)) {
    candidate = `${slug}-${n}`
    n += 1
  }
  return candidate
}
