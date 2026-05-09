---
title: Engineering — Design Notes from the JSONExpress Team
description: Long-form posts on the architecture, trade-offs, and engineering decisions behind JSONExpress — microkernel design, plugin contracts, and adapter compliance.
---

# Engineering

Design notes, architectural deep-dives, and trade-off analyses from the people building JSONExpress. Less "how to use the framework" and more "why the framework is shaped this way."

## Posts

- [Why I Built JSONExpress: The Problem with json-server in 2026](/blog/why-i-built-jsonexpress) — the gap between day-one prototyping and day-thirty production, and the design choices that closed it.

## Coming Soon

More long-form pieces are in the queue, including:

- The microkernel + IoC container split — and why core ships zero HTTP code
- Designing a plugin contract that fails loud when peers are missing
- The Adapter Compliance Suite — getting Postgres and in-memory adapters to behave identically
- Recursive plugin auto-discovery: walking `package.json` instead of writing a manifest

---

[← Back to the Learn hub](/blog/)
