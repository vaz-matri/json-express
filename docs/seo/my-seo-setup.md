---
title: My SEO Setup Journey for JSONExpress
description: A look into the choices, tools, and technical details behind the SEO foundation of the JSONExpress documentation and landing pages.
author: vaz
category: SEO
---

# My SEO Setup Journey for JSONExpress

Building an open-source framework like JSONExpress requires more than just good code—it needs discoverability. Early on, I realized that if developers couldn't find the documentation via Google, the project wouldn't grow. 

The goal was clear: I needed a fast, documentation-driven site that ranked well natively, without sacrificing developer experience. Here is exactly how I set up the SEO foundation for JSONExpress, what I chose, and the alternatives I considered.

## The Stack: Why VitePress?

For the site framework, I chose **VitePress**. 

VitePress is a Static Site Generator (SSG) built on top of Vite and Vue. It is aggressively optimized for speed and specifically tailored for technical documentation.

The winning factors for me were:
- **Out-of-the-box performance:** It loads incredibly fast, scoring 100s across the board on Lighthouse.
- **Clean Markdown rendering:** It supports complex documentation features with minimal configuration.
- **Simple configuration:** The SEO defaults are sensible, and overriding them is straightforward.

## The Alternatives I've Considered

My journey to VitePress wasn't direct. I iterated through a few tools before finding the perfect fit.

### Version 1: Nextra / Next.js (A Year Ago)
About a year ago, when I first started exploring how to build the site, I naturally gravitated toward **Next.js** and **Nextra** (a docs framework for Next.js). I am very familiar with React, Angular, and Vite, so exploring Next.js static builds and server-side rendering seemed like the right move.

However, I quickly felt like I had to build *everything*. It was incredibly heavy, and bending Nextra to look the way I wanted defeated the purpose of using a docs template. I didn't like the default UI, making simple layout changes felt like pulling teeth, and honestly, I just wanted to write simple Markdown. Next.js was overkill and simply not the tool for me. *(Note: This was all before I started using AI).*

### The v2 Rewrite: Docusaurus
When it came time for a v2 rewrite, I looked at **Docusaurus**. It was a massive improvement over my Nextra experience. It's stable, battle-tested, and built for docs. But deep down, it still felt overly complex and rigid when I needed custom behavior.

### The Final Choice: VitePress
Then I tried **VitePress**, and the experience was immediately pleasant. I loved it. The fact that I could easily drop it into any project and get a beautiful, fast site made me stick with it. Once I did the initial local setup and played around with it, everything just clicked. 

The timing was right, too. This was around the time I started heavily using AI tools like **Claude Code** and **Antigravity**. Even though I have 10 years of development experience, combining VitePress with these AI agents made the entire setup process exponentially easier and faster.

| Framework | Experience | Verdict |
| :--- | :--- | :--- |
| **Nextra / Next.js** | Heavy, too much manual configuration, rigid UI. | Overkill for pure docs. |
| **Docusaurus** | Much better, but still felt rigid and heavy. | Good, but not perfect. |
| **VitePress** | Fast, pleasant developer experience, highly customizable. | **The Winner.** |

## The Setup: Key SEO Implementations

Once I settled on VitePress, I focused on hardcoding the essential SEO features into `.vitepress/config.mts`.

### 1. Canonical URLs
Duplicate content is an SEO killer. To ensure Google always indexes the correct version of a page (especially considering the `www` subdomain), I implemented a `transformHead` hook in VitePress.

This script automatically injects a `<link rel="canonical">` tag into every page, pointing to the authoritative `https://www.jsonexpress.com` version.

### 2. Automated Sitemap Generation
VitePress includes built-in sitemap generation. By simply adding the `hostname` to the config, VitePress generates an `xml` sitemap during the build process, which is submitted to Google Search Console.

### 3. Meta Tags & Open Graph
Social sharing drives early traction. I hardcoded a suite of Open Graph (`og:`) and Twitter card meta tags into the global `<head>`:
- `og:title` and `twitter:title`
- `og:image` pointing to an optimized banner
- `theme-color` for mobile browser integration

This ensures that whenever JSONExpress is shared on Discord, Twitter, or Reddit, it generates a beautiful, informative preview card.

### 4. JSON-LD Structured Data
To make it abundantly clear to Google *what* JSONExpress is, I injected a custom JSON-LD `SoftwareApplication` schema script into the global head. This structured data explicitly defines JSONExpress as a "DeveloperApplication" and an "Open-source Node.js meta-framework."

## Achieving a Custom Landing Page

Documentation sites often struggle to create high-converting homepages because the frameworks force you into a "docs-first" sidebar layout.

With VitePress, achieving a custom landing page was remarkably simple. I used the frontmatter `layout: home` in `docs/index.md`. This strips away the traditional documentation sidebar and header, giving me a blank canvas. 

From there, I could use VitePress's built-in home components (like `Hero` and `Features`) while injecting my own custom CSS classes directly into the Markdown to achieve the dynamic, branded look I wanted—all without actually writing Vue components from scratch.

## Conclusion

By choosing VitePress, configuring canonicals, injecting structured data, and leveraging AI tools to accelerate the process, I was able to build a blazingly fast, SEO-optimized documentation site. The foundation is set. The next steps will involve programmatic SEO and building out more dedicated comparison pages to capture high-intent search traffic.
