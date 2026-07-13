import pygame
import random
import sys

pygame.init()

# Screen
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Space Shooter")

clock = pygame.time.Clock()

# Colors
BLACK = (10, 10, 20)
WHITE = (255, 255, 255)
RED = (255, 60, 60)
GREEN = (0, 255, 120)

# Fonts
font = pygame.font.SysFont("Arial", 30)

# Player
player_width = 50
player_height = 50
player_x = WIDTH // 2
player_y = HEIGHT - 80
player_speed = 7

# Bullets
bullets = []

# Enemies
enemies = []

# Score
score = 0

# Create enemies
for _ in range(6):
    enemies.append([
        random.randint(0, WIDTH - 40),
        random.randint(20, 200),
        random.randint(2, 5)
    ])


def draw_player(x, y):
    pygame.draw.rect(screen, GREEN, (x, y, player_width, player_height), border_radius=10)


def draw_bullet(x, y):
    pygame.draw.rect(screen, WHITE, (x, y, 5, 15))


def draw_enemy(x, y):
    pygame.draw.circle(screen, RED, (x + 20, y + 20), 20)


running = True

while running:
    clock.tick(60)

    screen.fill(BLACK)

    # Events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        # Shoot
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                bullets.append([player_x + 22, player_y])

    # Movement
    keys = pygame.key.get_pressed()

    if keys[pygame.K_LEFT] and player_x > 0:
        player_x -= player_speed

    if keys[pygame.K_RIGHT] and player_x < WIDTH - player_width:
        player_x += player_speed

    # Update bullets
    for bullet in bullets[:]:
        bullet[1] -= 10

        if bullet[1] < 0:
            bullets.remove(bullet)

    # Update enemies
    for enemy in enemies:
        enemy[1] += enemy[2]

        if enemy[1] > HEIGHT:
            enemy[0] = random.randint(0, WIDTH - 40)
            enemy[1] = random.randint(-100, -40)

        # Collision
        for bullet in bullets[:]:
            if (
                bullet[0] > enemy[0]
                and bullet[0] < enemy[0] + 40
                and bullet[1] > enemy[1]
                and bullet[1] < enemy[1] + 40
            ):
                score += 1

                enemy[0] = random.randint(0, WIDTH - 40)
                enemy[1] = random.randint(-100, -40)

                if bullet in bullets:
                    bullets.remove(bullet)

    # Draw player
    draw_player(player_x, player_y)

    # Draw bullets
    for bullet in bullets:
        draw_bullet(bullet[0], bullet[1])

    # Draw enemies
    for enemy in enemies:
        draw_enemy(enemy[0], enemy[1])

    # Score
    score_text = font.render(f"Score: {score}", True, WHITE)
    screen.blit(score_text, (10, 10))

    pygame.display.flip()

pygame.quit()
sys.exit()