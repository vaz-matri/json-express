---
title: "From IDE Wars to CLI Agents: How I Built JSONExpress with Antigravity and Claude"
description: "A very personal journey through token anxiety, IDE loyalties, and hybrid workflows while building JSONExpress using AI agents."
author: vaz
category: AI
---

# From IDE Wars to CLI Agents: How I Built JSONExpress with Antigravity and Claude

When I first started building JSONExpress, I did everything manually. It was the traditional way, but as the vision for an infrastructure-agnostic Node.js framework grew, so did the complexity. 

This is the story of how I transitioned from manual coding to adopting AI agents, the struggles I faced with IDEs and token limits, and how CLI tools finally gave me the developer experience I had been searching for.

## The Early Days: Google AI Studio & The Context Wall

My first foray into AI-assisted development for JSONExpress was with Google AI Studio. I loved it. It was completely free, and I was able to discuss massive architectural ideas and get a ton of valuable information back.

But after building the basic version, I hit a wall. As my codebase grew, it became incredibly hard to explain all the moving parts of my tools to the AI in a standard chat window. 

To solve this communication barrier, I built and open-sourced a tool called **[context-builder](https://www.npmjs.com/package/@json-express/context-builder)** (`@json-express/context-builder`). Its entire purpose is to parse your codebase and bundle it into a Markdown format, making it incredibly easy to upload to any AI and give it instant context. This bought me some time, but I still needed a proper agentic workflow.

## The IDE Wars: Antigravity vs. WebStorm

Eventually, I got attracted to the **Antigravity IDE**. Chatting with Antigravity was a breeze. It was lovely to talk about the grand vision of JSONExpress, and once I was satisfied, I would ask it to implement the plan. And it did it well!

But to be very honest, I had mixed feelings. The problem? Antigravity is built on VSCode.

VSCode is a great code editor, but my allegiance has always lied with WebStorm, an IntelliJ product. I don't know why, but I just *love* that IDE. When it came time to actually review the code Antigravity wrote, I felt like I was in a foreign land. I tried installing IntelliJ keymaps, themes, and plugins into the VSCode-based IDE, but it still felt like something was missing. 

I relied heavily on a handful of WebStorm features: the "show diff" window, the way files and folders are colored when edited, the revert key to easily track my changes, and the side-by-side Markdown edit/preview mode. It’s a small handful of features, but I was so bound to them that working in another IDE felt paralyzing.

I kept wondering: *Why can't Google just take the WebStorm Community Edition and build a proper AI IDE out of it, just like they did with Android Studio?* (The day I started using Android Studio, I fell in love).

But I couldn't leave Antigravity. I loved how it shared my vision. So, I devised a workaround: I used Antigravity as a local client to chat and generate code, but I kept WebStorm open to actually review the changes and do my manual work. 

## Bugs, Knowledge Items, and Token Anxiety

This hybrid workflow was okay, but the Antigravity IDE was buggy at the time. It would occasionally lose all my chats. Through chatting with the AI itself, I found out it had a feature called **Knowledge Items (KI)** to keep track of context. All I had to do was give a name to the chat and ask it to store it as a KI. When I opened it again, I could retrieve it, or simply ask it to "continue from where I left off." 

Life was good. I was using it for free, making progress. But as I got more serious, I kept hitting the rate limit. 

I decided to try the Pro plan (a free trial before the $20/month kicked in), hoping for higher limits so I could finally finish the product. But strangely, I kept getting the exact same limits. I tried logging out, logging in, clearing temp files, uninstalling, reinstalling—nothing made a permanent difference.

I checked my tokens constantly. Once a week, I'd have a full 4 or 5 bars. When I got into a deep, interesting chat, the bars would plummet. I’d hit the limit, and then I'd have to wait. It said it had a 5 to 6-hour reset, but often I'd come back to server overload issues. 

Eventually, my day-to-day job became: **Chat -> Check the token bar -> Chat again -> Check the token bar.** 

Little by little, my progress slowed. I got burnt out. I forgot about JSONExpress and started focusing on a TV show called *Evil*. (Spoiler: I had high hopes for this series, but I really didn't like the ending). 

One day, after finishing the show, I realized I had totally abandoned Antigravity, and worse, I had abandoned my product.

## The Claude Code Era

I decided to try something new. I went and bought Claude. 

Of course, I immediately faced the same IDE barrier. So, I went back to my old trick: VSCode for chatting, WebStorm for reviewing. 

Then I realized, why shouldn't I give **Claude Code** (their CLI tool) a shot? That changed *everything*. 

The moment I started using it, I loved it. The official WebStorm Claude plugin had poor ratings, but someone mentioned they loved it, so I tried it. It simply opened a terminal and started Claude Code right inside my beloved IDE. It had basic support for selected files and text. Sometimes clicking a file would open it in a different editor, but I was able to live with that.

I was finally using Claude and WebStorm together, sometimes in the built-in terminal, sometimes in my own. Claude (Opus 4.6 and 4.7) was incredibly good at building things. 

But for some reason, it felt like it wasn't sharing my *vision* the way Antigravity did.

## The "Token-Dance" Workflow

This led to the most chaotic workflow of my life. 
1. I would go to Antigravity.
2. Check tokens.
3. Chat about the vision and write a plan.
4. Check tokens.
5. Take the plan and pass it to Claude Code to execute. Claude would do a wonderful job.
6. Go back to Antigravity to review it.
7. Check tokens.

I did this dance for a long time. 

## Antigravity 2.0: The CLI Savior

Then, Antigravity 2.0 was released. Everything changed. They finally gave us a CLI (`agy`). 

I immediately installed it. When I ran it, it tried to open my old Antigravity IDE. I swiftly uninstalled the IDE and ran `agy` again in my terminal. 

It said "Hi." I knew right then and there I was going to cheat on Claude Code. (Spoiler: I did).

I opened JSONExpress in WebStorm and started discussing the vision with `agy` in the terminal—why people aren't using the framework, what we should do, how we should do it. I was so engaged I even forgot I had limits. I didn't go too overboard, but I kept talking. 

When I finally remembered to check my tokens, I still had 60% left. I tried it the next day, and the next. It kept refreshing properly, exactly as promised. 

## Conclusion

Thank you to the teams building these tools. Now, my two biggest issues are solved: I have a powerful CLI tool that is completely IDE-independent, and my tokens are properly refreshing so I can actually get work done.

If Google could just partner with IntelliJ and build the ultimate AI tool directly into WebStorm, my developer experience would be absolutely complete. But until then, you'll find me building JSONExpress right from my terminal. 

*(If you are building Node backends and want to skip the boilerplate, check out what I built with these agents: [JSONExpress](https://www.jsonexpress.com)).*
