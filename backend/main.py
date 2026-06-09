from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


app = FastAPI(
    title="MyPustak Full Stack Developer Challenge API",
    description="A small in-memory posts API built with FastAPI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    body: str = Field(..., min_length=1, max_length=1000)

    @field_validator("title", "body")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        cleaned_value = value.strip()
        if not cleaned_value:
            raise ValueError("Field cannot be empty or only spaces")
        return cleaned_value


class Post(PostCreate):
    id: int
    created_at: datetime
    updated_at: datetime


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


seeded_at = utc_now()


posts_db: List[Post] = [
    Post(
        id=1,
        title="Welcome to MyPustak",
        body="Share useful book notes, reading reflections, and community updates.",
        created_at=seeded_at,
        updated_at=seeded_at,
    ),
    Post(
        id=2,
        title="Why FastAPI feels great",
        body="Typed models, automatic docs, and clear status codes make API work quick and pleasant.",
        created_at=seeded_at,
        updated_at=seeded_at,
    ),
    Post(
        id=3,
        title="Next.js App Router",
        body="A clean client experience can still be simple, focused, and easy to reason about.",
        created_at=seeded_at,
        updated_at=seeded_at,
    ),
]


def get_next_post_id() -> int:
    if not posts_db:
        return 1
    return max(post.id for post in posts_db) + 1


@app.get("/posts", response_model=List[Post], status_code=status.HTTP_200_OK)
def get_posts() -> List[Post]:
    return posts_db


@app.post("/posts", response_model=Post, status_code=status.HTTP_201_CREATED)
def create_post(post_data: PostCreate) -> Post:
    created_at = utc_now()
    new_post = Post(
        id=get_next_post_id(),
        created_at=created_at,
        updated_at=created_at,
        **post_data.model_dump(),
    )
    posts_db.append(new_post)
    return new_post


@app.put("/posts/{post_id}", response_model=Post, status_code=status.HTTP_200_OK)
def update_post(post_id: int, post_data: PostCreate) -> Post:
    post_index = next(
        (index for index, post in enumerate(posts_db) if post.id == post_id),
        None,
    )

    if post_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} was not found.",
        )

    existing_post = posts_db[post_index]
    updated_post = Post(
        id=post_id,
        created_at=existing_post.created_at,
        updated_at=utc_now(),
        **post_data.model_dump(),
    )
    posts_db[post_index] = updated_post
    return updated_post


@app.delete("/posts/{post_id}", status_code=status.HTTP_200_OK)
def delete_post(post_id: int) -> dict[str, str]:
    post_index = next(
        (index for index, post in enumerate(posts_db) if post.id == post_id),
        None,
    )

    if post_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post with id {post_id} was not found.",
        )

    deleted_post = posts_db.pop(post_index)
    return {"message": f"Post '{deleted_post.title}' deleted successfully."}
