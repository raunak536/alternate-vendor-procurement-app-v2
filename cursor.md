CONTEXT: This workspace is for a biopharma procurement application designed to help procurement teams quickly discover alternate vendors for products—think of it as an "Amazon for procurement." Our aim is to demonstrate rapid progress and working features for clients on a weekly basis.

Architecture & Product Vision:
- The core of the app will be a unified vendor database, bringing together both internal and external vendors. This database will store detailed information about each vendor, such as their available SKUs, certifications, pricing, and other key attributes.
- When a user submits a query, the system will search (and possibly re-rank or recommend from) this database, presenting the best-matching vendor/product options.
- Building and maintaining the external vendor database is central to the project. This will require integrating a pipeline involving agents, scraping tools, LLMs, and regular (e.g., weekly) updates.
- A matching algorithm must also be developed to take varied user queries and accurately map them to the available SKUs in our database.
- While much of the innovation lies in the data and matching/recommendation pipeline, the broader goal is to make vendor search and comparison seamless for procurement teams.

Development Guidelines:
- Favor readable, human-friendly code—clarity over defensive programming or production overhead.
- Keep frontends minimal, elegant, and cohesive—inspired by Apple (light, subtle, premium-feel; avoid heavy animation or bright colors).
- Structure backends to be simple and easy to adjust—maintain clear separation between data, backend, and frontend concerns, but don’t over-engineer.
- Prioritize light, easily updatable code and workflows to support rapid iteration.
- Always focus on clarity, alignment with architectural goals, and the ability to quickly showcase functional prototypes.
- Keep in mind the long-term vision of supporting extensible, evolving vendor data and robust query-to-SKU matching as foundational aspects of this project.