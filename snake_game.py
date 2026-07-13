import pygame
import random
import sys

# Initialize
pygame.init()

# Screen
WIDTH, HEIGHT = 800, 600
BLOCK = 20

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Modern Snake Game")

# FPS
clock = pygame.time.Clock()
FPS = 12

# Colors
BG = (20, 20, 20)
GREEN = (0, 255, 100)
RED = (255, 80, 80)
WHITE = (255, 255, 255)
YELLOW = (255, 220, 0)

# Font
font = pygame.font.SysFont("Arial", 30)

# Snake
snake = [(100, 100), (80, 100), (60, 100)]
direction = (BLOCK, 0)

# Food
food = (
    random.randrange(0, WIDTH, BLOCK),
    random.randrange(0, HEIGHT, BLOCK)
)

score = 0


def draw_text(text, color, x, y):
    label = font.render(text, True, color)
    screen.blit(label, (x, y))


def draw_snake():
    for segment in snake:
        pygame.draw.rect(
            screen,
            GREEN,
            (segment[0], segment[1], BLOCK, BLOCK),
            border_radius=5
        )


def draw_food():
    pygame.draw.rect(
        screen,
        RED,
        (food[0], food[1], BLOCK, BLOCK),
        border_radius=10
    )


def reset_game():
    global snake, direction, food, score

    snake = [(100, 100), (80, 100), (60, 100)]
    direction = (BLOCK, 0)

    food = (
        random.randrange(0, WIDTH, BLOCK),
        random.randrange(0, HEIGHT, BLOCK)
    )

    score = 0


running = True

while running:
    clock.tick(FPS)

    # Events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        if event.type == pygame.KEYDOWN:

            if event.key == pygame.K_UP and direction != (0, BLOCK):
                direction = (0, -BLOCK)

            if event.key == pygame.K_DOWN and direction != (0, -BLOCK):
                direction = (0, BLOCK)

            if event.key == pygame.K_LEFT and direction != (BLOCK, 0):
                direction = (-BLOCK, 0)

            if event.key == pygame.K_RIGHT and direction != (-BLOCK, 0):
                direction = (BLOCK, 0)

            if event.key == pygame.K_r:
                reset_game()

    # Move snake
    head_x, head_y = snake[0]

    new_head = (
        head_x + direction[0],
        head_y + direction[1]
    )

    # Collision with wall
    if (
        new_head[0] < 0 or
        new_head[0] >= WIDTH or
        new_head[1] < 0 or
        new_head[1] >= HEIGHT
    ):
        reset_game()

    # Collision with self
    elif new_head in snake:
        reset_game()

    else:
        snake.insert(0, new_head)

        # Eat food
        if new_head == food:
            score += 1

            food = (
                random.randrange(0, WIDTH, BLOCK),
                random.randrange(0, HEIGHT, BLOCK)
            )
        else:
            snake.pop()

    # Draw
    screen.fill(BG)

    draw_snake()
    draw_food()

    draw_text(f"Score: {score}", WHITE, 10, 10)
    draw_text("Press R to Restart", YELLOW, 10, 45)

    pygame.display.flip()

pygame.quit()
sys.exit()