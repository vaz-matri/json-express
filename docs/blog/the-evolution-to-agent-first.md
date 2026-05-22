---
title: "The Evolution of JSONExpress: From Mock Server to Agent-First Framework"
description: JSONExpress evolved from a simple mock server to a robust MVP, and now into an Agent-First framework designed to be orchestrated by AI.
---

# The Evolution of JSONExpress: From Mock Server to Agent-First Framework

*May 2026*

When I first started building JSONExpress, I had a very simple goal: to create a mock server that could quickly unblock frontend teams. I wanted something that went slightly beyond the basics—multi-file JSON support, HTTPS, and basic authentication out of the box. 

But as the project grew, I realized that "just another mock server" wasn't serving the ultimate purpose well. Frontend engineers didn't just want to prototype; they wanted to take those prototypes to production without rewriting the entire backend from scratch.

This realization led to a massive architectural pivot. The project evolved in three distinct stages, culminating in what I believe is the natural future of software development: **Agentic Frameworks**.

Here is how we got here.

## Phase 1: The Prototype Era
In the beginning, JSONExpress was built for speed. Drop a few JSON files into a `data/` folder, and you had a full CRUD REST API running instantly. 

It was perfect for hacking together a UI or validating an idea over a weekend. But the moment you needed real relationships, strict data validation, or a scalable database, you had to throw the prototype away and start a new repository with Express or NestJS.

## Phase 2: The Robust MVP (Version 2)
To solve the "throwaway prototype" problem, we rebuilt JSONExpress from the ground up in TypeScript (Version 2). 

We introduced a **contract-based layer** and an **Inversion of Control (IoC) kernel**. This meant that every layer of the framework—from the database to the HTTP server to the logging mechanism—became seamlessly swappable.
* Start with `adapter-json` to write to the file system.
* When you launch, swap it out for a Postgres adapter with a single line of config.
* Outgrow Express? Swap it for `transport-fastify` to triple your throughput.

The codebase didn't change; only the configuration did. We went from a simple mock server to a **Robust MVP**. 

## Phase 3: The Natural Evolution (Agent-First)
While the V2 architecture gave human developers incredible flexibility, something unexpected happened. AI models started getting *really* good at writing code. 

The seed for AI support was there from the beginning (thanks to our highly declarative, JSON-driven design), but it has now fully emerged. In the near future, AI will write the majority of the code, and humans will simply orchestrate and verify it. 

To enable this, the framework itself must provide rock-solid, perfectly understood building blocks. If a developer asks an AI like Cursor or Copilot to "add Authentication to my JSONExpress API," the AI needs strict boundaries to avoid hallucinating vulnerable code.

**This is why JSONExpress is now an Agent-First framework.**

We are optimizing the Developer Experience not just for humans, but for the AIs that serve them. 
* Every package we publish now includes an `llms.txt` file in its root. 
* When you install `@json-express/plugin-identity`, your AI immediately reads the instructions, understands the `defineModel` contract, and outputs perfect, declarative configuration.
* We provide abstract test suites so that when an AI writes a new database adapter, it can run the tests and fix its own errors in a ReAct loop.

JSONExpress is no longer just a framework for humans to write less code. It is a set of modular, verifiable building blocks designed specifically to be orchestrated by AI. 

The era of Agent-First architecture has arrived.
