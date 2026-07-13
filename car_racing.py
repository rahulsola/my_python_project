import pygame
import random
import sys

pygame.init()

# Screen
WIDTH = 500
HEIGHT = 700

screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Car Racing Game")

clock = pygame.time.Clock()

# Colors
WHITE = (255, 255, 255)
BLACK = (20, 20, 20)
RED = (255, 50, 50)
BLUE = (50, 150, 255)
YELLOW = (255, 220, 0)
GRAY = (80, 80, 80)

# Font
font = pygame.font.SysFont("Arial", 35)

# Player Car
player_width = 50
player_height = 90

player_x = WIDTH // 2 - player_width // 2
player_y = HEIGHT - 120

player_speed = 7

# Enemy Cars
enemy_width = 50
enemy_height = 90

enemies = []

for i in range(3):
    enemies.append([
        random.randint(60, WIDTH - 110),
        random.randint(-700, -100),
        random.randint(5, 10)
    ])

score = 0


def draw_road():
    screen.fill(GRAY)

    # Road lines
    for y in range(0, HEIGHT, 40):
        pygame.draw.rect(screen, WHITE, (240, y, 20, 25))

    # Road borders
    pygame.draw.rect(screen, YELLOW, (40, 0, 10, HEIGHT))
    pygame.draw.rect(screen, YELLOW, (450, 0, 10, HEIGHT))


def draw_player():
    pygame.draw.rect(
        screen,
        BLUE,
        (player_x, player_y, player_width, player_height),
        border_radius=10
    )


def draw_enemy(x, y):
    pygame.draw.rect(
        screen,
        RED,
        (x, y, enemy_width, enemy_height),
        border_radius=10
    )


def game_over():
    over_text = font.render("GAME OVER", True, RED)
    restart_text = font.render("Press R to Restart", True, WHITE)

    screen.blit(over_text, (140, 300))
    screen.blit(restart_text, (100, 360))

    pygame.display.update()

    waiting = True

    while waiting:
        for event in pygame.event.get():

            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:
                    return


running = True

while running:

    clock.tick(60)

    # Events
    for event in pygame.event.get():

        if event.type == pygame.QUIT:
            running = False

    # Keys
    keys = pygame.key.get_pressed()

    if keys[pygame.K_LEFT] and player_x > 60:
        player_x -= player_speed

    if keys[pygame.K_RIGHT] and player_x < WIDTH - 110:
        player_x += player_speed

    # Draw road
    draw_road()

    # Move enemies
    for enemy in enemies:

        enemy[1] += enemy[2]

        # Reset enemy
        if enemy[1] > HEIGHT:
            enemy[0] = random.randint(60, WIDTH - 110)
            enemy[1] = random.randint(-300, -100)

            score += 1

        # Collision
        if (
            player_x < enemy[0] + enemy_width
            and player_x + player_width > enemy[0]
            and player_y < enemy[1] + enemy_height
            and player_y + player_height > enemy[1]
        ):
            game_over()

            # Reset game
            score = 0

            player_x = WIDTH // 2 - player_width // 2

            for e in enemies:
                e[0] = random.randint(60, WIDTH - 110)
                e[1] = random.randint(-700, -100)

        draw_enemy(enemy[0], enemy[1])

    # Draw player
    draw_player()

    # Score
    score_text = font.render(f"Score: {score}", True, WHITE)
    screen.blit(score_text, (20, 20))

    pygame.display.flip()

pygame.quit()
sys.exit()