
# Firebase Studio - Tennis Momentum Tracker

This is a NextJS starter in Firebase Studio, adapted to be a Tennis Momentum Tracker.

To get started, take a look at src/app/page.tsx.

## Deploying to GitHub Pages

This project is configured to be deployed to GitHub Pages.

**Prerequisites:**

1.  **Update Repository Name:**
    *   In `next.config.ts`, change the `repoName` variable from `'your-repo-name'` to your actual GitHub repository name. For example, if your repository URL is `https://github.com/username/my-tennis-app`, then `repoName` should be `'my-tennis-app'`.
    *   The GitHub Actions workflow (`.github/workflows/deploy.yml`) uses `NEXT_PUBLIC_REPO_NAME: ${{ github.event.repository.name }}` which should automatically pick up your repository name.

**Deployment Steps:**

1.  **Push to GitHub:** Commit and push your changes to the `main` branch (or your default branch) of your GitHub repository.
2.  **Workflow Runs:** The GitHub Actions workflow defined in `.github/workflows/deploy.yml` will automatically trigger. It will build your Next.js application for static export and deploy the output to a branch named `gh-pages`.
3.  **Configure GitHub Pages Settings:**
    *   Once the workflow has completed successfully for the first time (check the "Actions" tab in your GitHub repository), go to your repository's **Settings** tab.
    *   In the left sidebar, navigate to **Pages**.
    *   Under "Build and deployment", for the "Source", select **Deploy from a branch**.
    *   Under "Branch", select the `gh-pages` branch and the `/ (root)` folder.
    *   Click **Save**.
4.  **Access Your Site:** After a few moments, your site should be live at `https://<your-username>.github.io/<your-repo-name>/`.

**Important Notes for GitHub Pages Deployment:**

*   **Static Export:** This deployment uses Next.js's static export feature (`output: 'export'`). This means server-side features like true API routes or Next.js Server Actions will not function. The current application's "server action" for emailing is a mock and will execute its client-side logic.
*   **Client-Side Rendering:** The application relies heavily on client-side JavaScript.
*   **Base Path:** The `basePath` and `assetPrefix` in `next.config.ts` are configured to handle deployment to a subdirectory (e.g., `/<your-repo-name>/`).
