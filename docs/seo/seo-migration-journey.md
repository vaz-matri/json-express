---
title: How I fixed duplicate content SEO drops when migrating to a www subdomain
description: A deep dive into fixing VitePress canonical tags, 301 redirects, and Google Search Console indexing errors after moving to a www subdomain.
author: vaz
date: 2026-05-26
category: SEO
---

# How I fixed duplicate content SEO drops when migrating to a www subdomain

When building a developer tool like JSONExpress, your documentation is your most important asset. A few weeks ago, we decided to migrate our main domain from the root domain (`jsonexpress.com`) to a `www` subdomain (`www.jsonexpress.com`). At the same time, we completely restructured our docs folder hierarchy.

Within days, Google Search Console (GSC) lit up with warnings: **"Duplicate without user-selected canonical"**, **"Not found (404)"**, and a huge spike in pages stuck as **"Discovered — currently not indexed"**. 

Here is exactly how I diagnosed the drops and fixed the indexing pipeline for our VitePress-powered site.

## The Duplicate Content Problem

The scariest error in GSC was the "Duplicate without user-selected canonical" warning on nearly every important page.

Google was crawling both `jsonexpress.com/guide/architecture` and `www.jsonexpress.com/guide/architecture`. Because it found identical HTML at both destinations, and with no signal to tell it which was the "real" one, it flagged every page as a duplicate.

### The Fix: VitePress Canonical Tags

The root cause was simple: VitePress does not inject `<link rel="canonical">` tags by default. I had assumed the 301 redirect from the root domain to the `www` subdomain was enough. But while a 301 redirect fixes the user experience, Google still crawls both if it discovered them before the redirect was in place. The canonical tag is what closes the loop at the indexing layer.

To fix this, I used VitePress's `transformHead` hook in `.vitepress/config.mts` to automatically inject the correct canonical URL into every page at build time:

```ts
import { defineConfig } from 'vitepress'

const SITE = 'https://www.jsonexpress.com'

export default defineConfig({
  // Automatically inject <link rel="canonical"> on every page
  transformHead({ pageData }) {
    const slug = pageData.relativePath
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')
    
    // Ensure the root path doesn't have a trailing slash if empty
    const canonical = slug ? `${SITE}/${slug}` : SITE
    
    return [['link', { rel: 'canonical', href: canonical }]]
  },
  // ... rest of your config
})
```

Now, every built page has `<link rel="canonical" href="...">` pointing explicitly to the `www` version. I also ensured that our structured data (JSON-LD) consistently used `www.jsonexpress.com`.

## URL Restructure and the 404 Spike

During the migration, I reorganized the docs from a flat structure (e.g. `/schemas`) into categorized pillars (e.g. `/guide/schemas` and `/packages/core`). 

Google still had the old flat URLs indexed, which were suddenly returning 404s. A 404 tells Google the page is gone, which causes it to drop the URL from the index entirely, losing any link equity you've built up.

### The Fix: Framework-Level 301 Redirects

I immediately mapped out the 34 moved pages and set up 301 redirect rules. We host on AWS Amplify, so this was as simple as adding JSON rules to the console:

```json
[
  { "source": "/schemas", "target": "/guide/schemas", "status": "301", "condition": null },
  { "source": "/core", "target": "/packages/core", "status": "301", "condition": null }
  // ... and so on
]
```

A 301 redirect is crucial because it tells Google that the page moved permanently. When Google hits the old URL, it follows the 301 and queues the new destination for crawling, successfully transferring the ranking signals.

## Demystifying "Discovered — Currently Not Indexed"

After putting the 301s in place, GSC showed a massive spike in "Discovered — currently not indexed" for the new `/guide/*` and `/packages/*` paths.

Beginners often panic at this report, assuming they've been penalized. **It's not an error.** It purely means Google knows the URLs exist (likely from following the 301s and checking our new sitemap), but hasn't had the crawl budget to actually read and index them yet. They are just sitting in the queue.

To speed this up, I did two things:
1. **Resubmitted the sitemap:** Our VitePress config generates a `sitemap.xml` automatically. Resubmitting it with the new `www` hostname was the fastest way to signal the new structure.
2. **Manual Indexing Requests:** I requested indexing on our top 5 most important pages (like the homepage, `/guide/getting-started`, and our comparison pages). Google limits this to ~10 per day, so you have to prioritize.

## "Crawled — Currently Not Indexed"

We also had one URL (`/docs/example`) flagged as "Crawled — currently not indexed". Unlike "Discovered", this means Google actually read the page but decided against putting it in the search results.

This URL came from JSONExpress's `docs-light` plugin, which auto-generates live API docs. Google had found an exposed demo server of ours, crawled the auto-generated API route, and correctly determined it was thin content. This is the algorithm working as intended! The lesson here: keep your staging and demo servers behind auth, or use a `robots.txt` to block Googlebot if you don't want auto-generated framework endpoints cluttering your GSC reports.

## The Takeaway

Migrating a domain or restructuring URLs will almost always cause a temporary shakeup in Google Search Console. 

The most important takeaway for developers building documentation sites: **don't rely on 301 redirects alone.** Set your `<link rel="canonical">` at the framework level from day one. It's a five-minute fix in VitePress that saves weeks of duplicate content headaches down the line.
