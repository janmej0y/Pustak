# MyPustak Full Stack Developer - 1 Hour Coding Challenge

A clean full-stack posts app built with FastAPI, Next.js App Router, TypeScript, and Tailwind CSS.

## Tech Stack

- Backend: FastAPI, Pydantic, Uvicorn
- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Storage: Explicit in-memory Python list

## Challenge Coverage

- Displays all posts from `GET /posts`
- Creates posts with `POST /posts`
- Deletes posts with `DELETE /posts/{post_id}`
- Uses in-memory backend storage
- Returns JSON responses with proper HTTP status codes
- Shows frontend loading state
- Handles API errors with a toast-style message
- Includes client-side and server-side validation
- Uses TypeScript and Tailwind CSS as bonus additions

## Folder Layout

```text
MyPustak/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       │   ├── PostCard.tsx
│   │       │   ├── PostForm.tsx
│   │       │   └── SkeletonLoader.tsx
│   │       ├── globals.css
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── types.ts
│   ├── next.config.mjs
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── README.md
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at:

```text
http://localhost:8000
```

FastAPI docs are available at:

```text
http://localhost:8000/docs
```

## Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Optional: copy the example environment file if you want to customize the API URL.

```bash
copy .env.example .env.local
```

The frontend runs at:

```text
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/posts` | Returns all posts |
| POST | `/posts` | Creates a post and returns it with `201 Created` |
| DELETE | `/posts/{post_id}` | Deletes a post or returns `404 Not Found` |

## Validation

- Backend validation is handled by Pydantic models.
- `title` and `body` are required and cannot be empty or only spaces.
- Frontend validation prevents blank submissions before calling the API.

## Notes

The backend uses an in-memory list, so data resets whenever the API server restarts.

## Submission Checklist

Before sharing the repository link:

- Push the `backend/`, `frontend/`, `.gitignore`, and `README.md` files to GitHub.
- Do not commit `frontend/node_modules/`, `frontend/.next/`, or Python cache files.
- Verify both commands work from a fresh terminal:

```bash
cd backend
uvicorn main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

Use the GitHub repository URL as the submission link. A live deployment URL is optional unless the company specifically asks for one.
