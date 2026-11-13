This conversation belongs to a Grok project. The project's files are mounted at `/workspace/artifacts` — look there for user-provided sources before concluding the workspace has no project files. Files written there persist to the project across conversations.

## Vercel

After every user request that changes this app, commit the app files and push `main` to `origin` (https://github.com/smkronstedt/sk-ise.git) so Vercel deploys https://sk-ise.vercel.app automatically. Do this before telling the user the work is done. Do not wait to be asked. Skip only when nothing in the app changed. Confirm the push succeeded. If the push is rejected, rebase and push again. Do not commit `.grok` preview junk.
