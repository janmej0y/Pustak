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


posts_db: List[Post] = [
    Post(
        id=1,
        title="Welcome to MyPustak",
        body="Share useful book notes, reading reflections, and community updates.",
    ),
    Post(
        id=2,
        title="Why FastAPI feels great",
        body="Typed models, automatic docs, and clear status codes make API work quick and pleasant.",
    ),
    Post(
        id=3,
        title="Next.js App Router",
        body="A clean client experience can still be simple, focused, and easy to reason about.",
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
    new_post = Post(id=get_next_post_id(), **post_data.model_dump())
    posts_db.append(new_post)
    return new_post


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
