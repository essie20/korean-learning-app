I am developing a Bachelor’s thesis project at Metropolia University of Applied Sciences.

PROJECT
A Sentence-Based Korean Language Learning Application for Finnish-Speaking Beginners.

Please use the following specification as the source of truth for this project.
Do not add major features that are not listed here.
Keep the application manageable for a Bachelor’s thesis.

TARGET USERS
- Finnish-speaking beginners learning Korean.
- Users may have little or no previous experience learning Korean.
- There is no age restriction.

MAIN PURPOSE
- Teach useful beginner Korean through complete everyday sentences rather than isolated words.
- The application will contain 50 sentences divided into 10 everyday topics, 5 sentences per topic.
- I will provide the exact sentence content separately. Do not invent or replace the Korean learning content.

TECHNOLOGY
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Context and/or custom hooks where appropriate
- browser localStorage
- Lucide icons if needed
- VS Code
- Node.js / npm
- Git and GitHub

The application is browser-based only.

DO NOT ADD
- backend
- database
- login/account system
- cloud synchronization
- native mobile app
- PWA/offline mode
- quiz or scoring system
- AI chatbot
- social features
- CMS
- complex gamification

MAIN NAVIGATION
Desktop navigation:
Etusivu | Aiheet | Edistyminen

No mobile bottom navigation is needed.

PAGES / VIEWS

1. Home / Etusivu
- short introduction
- Aloita opiskelu or Jatka opiskelua
- overall progress indicator
- Continue should take the user to Topics, not directly to the last sentence

2. Topics / Aiheet
- 10 topic cards
- each topic shows progress/status
- users can freely select any topic

3. Study
- one sentence at a time
- related image
- Korean sentence
- Finnish-oriented pronunciation support
- pronunciation audio
- Finnish translation
- Previous and Next buttons
- topic progress

4. Topic Complete
- shown after the user finishes a topic
- 5/5 completion
- option to repeat the same topic
- option to choose another topic
- option to return home

5. Progress / Edistyminen
- overall progress
- progress for each topic
- completed status
- repetition/completion count where applicable
- reset progress at the bottom
- reset must require confirmation before deleting progress

TOPICS
1. Tervehdykset
2. Esittäytyminen
3. Kahvilassa
4. Ravintolassa
5. Ostoksilla
6. Tien kysyminen
7. Julkinen liikenne
8. Arjessa
9. Aika ja tapaamiset
10. Apu ja ymmärtäminen

PROGRESS LOGIC

Overall progress:
unique sentences viewed at least once / 50

Topic progress:
unique sentences viewed in that topic / 5

A sentence is marked as studied when it is displayed.

A topic is considered completed only when the user finishes the topic and selects the completion action (Valmis).

After completion:
- coverage remains 100%
- the user can repeat the topic
- repetition must not reduce the original completion progress
- the application counts how many times the topic has been completed
- current repetition progress may also be shown

Example topic states:
- Never started: 0/5 · 0% → Aloita
- In progress: 2/5 · 40% → Jatka
- Completed: 5/5 · 100% → Suoritettu → Kertaa
- Repeating: original coverage remains 100%, while current repetition progress is tracked separately

Progress means content coverage, NOT language mastery or proficiency.

LOCAL STORAGE

Use browser localStorage.

The basic stored information should include:
- studiedSentenceIds
- currentCardByTopic
- completionCountByTopic

Do not unnecessarily store values that can be calculated from these values.

LEARNING DATA STRUCTURE

Topic:
- id
- title
- description
- order
- optional slug

Sentence:
- id
- topicId
- order
- korean
- pronunciation
- finnish
- image
- imageAlt
- audio
- pronunciationRuleIds if needed

Static learning content can be stored in TypeScript data files.

ACCESSIBILITY / USABILITY REQUIREMENTS
- clear navigation
- clear button labels
- consistent interface
- visible current location/status
- sufficient text/background contrast
- alt text for images
- keyboard navigation
- visible keyboard focus
- support browser text zoom up to 200%
- responsive layout/reflow
- avoid unnecessary horizontal scrolling
- confirmation before resetting progress

DESIGN
Keep the interface simple, clean, professional, and visually balanced.
The Study view should focus on the learning content and should not contain unnecessary functions.

PROJECT EVALUATION
There will be NO user testing and NO participants.
No personal data will be collected.

The finished application will later be evaluated against predefined:
- functional requirements
- usability requirements
- accessibility requirements

IMPORTANT WORKING RULES
- Keep the project simple and understandable.
- Do not over-engineer.
- Before adding a library or architecture that is not necessary, explain why it is needed.
- I am a student and need to understand the code well enough to explain it in my thesis.
- Make changes step by step.
- Do not invent learning content.
- Tell me clearly which files you create or change.

For now, DO NOT start coding.

First:
1. Read this specification carefully.
2. Summarize your understanding of the application.
3. Propose a simple folder structure.
4. Give me a short step-by-step implementation plan.
5. Point out only genuine technical problems or contradictions in the specification.

Wait for my approval before implementing anything.

IMPLEMENTATION PLAN

1. [COMPLETED] Project setup: React + TypeScript + Vite, latest stable Tailwind CSS, React Router, ESLint, and Prettier.
2. [COMPLETED] Define the basic project folder structure and TypeScript types for topics, sentences, and progress data.
3. [COMPLETED] Add the 10 topics and the final 50 Korean sentences as static data.
4. [COMPLETED] Create the routing shell and basic pages: Home, Topics, Study, Topic Complete, and Progress.
5. Build the basic navigation and shared UI components.
6. Implement the Study view with image, Korean sentence, pronunciation support, Finnish translation, audio, Previous, Next, and Valmis.
7. Implement progress tracking and localStorage.
8. Implement topic completion, repetition, completion counts, and reset confirmation.
9. Add the final images, audio files, and pronunciation content.
10. Improve responsive design, keyboard navigation, focus visibility, contrast, alt text, text zoom, and reflow.
11. Run functional, usability, accessibility, build, lint, and manual tests and fix issues.
12. Deploy the finished application.
13. Evaluate the finished application against the predefined requirements and record the results for the thesis.
