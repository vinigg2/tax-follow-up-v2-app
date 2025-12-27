# Tax Follow Up - Laravel + React
# Makefile for Docker development

.PHONY: help build up down restart logs shell composer artisan npm test fresh migrate seed

# Colors
GREEN=\033[0;32m
NC=\033[0m

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Docker commands
build: ## Build Docker containers
	docker-compose build

up: ## Start Docker containers
	docker-compose up -d

down: ## Stop Docker containers
	docker-compose down

restart: ## Restart Docker containers
	docker-compose restart

logs: ## Show container logs
	docker-compose logs -f

logs-php: ## Show PHP container logs
	docker-compose logs -f php

logs-nginx: ## Show Nginx container logs
	docker-compose logs -f nginx

# Shell access
shell: ## Access PHP container shell
	docker-compose exec php bash

shell-mysql: ## Access MySQL container shell
	docker-compose exec mysql mysql -u root -proot tax_follow_up

# PHP/Laravel commands
composer: ## Run composer command (usage: make composer c="install")
	docker-compose exec php composer $(c)

artisan: ## Run artisan command (usage: make artisan c="migrate")
	docker-compose exec php php artisan $(c)

# Common artisan shortcuts
migrate: ## Run migrations
	docker-compose exec php php artisan migrate

migrate-fresh: ## Fresh migrations with seed
	docker-compose exec php php artisan migrate:fresh --seed

seed: ## Run database seeders
	docker-compose exec php php artisan db:seed

cache-clear: ## Clear all caches
	docker-compose exec php php artisan cache:clear
	docker-compose exec php php artisan config:clear
	docker-compose exec php php artisan route:clear
	docker-compose exec php php artisan view:clear

optimize: ## Optimize application
	docker-compose exec php php artisan optimize

# Testing
test: ## Run PHPUnit tests
	docker-compose exec php php artisan test

test-coverage: ## Run tests with coverage
	docker-compose exec php php artisan test --coverage

# Node/NPM commands
npm: ## Run npm command (usage: make npm c="install")
	docker-compose exec php npm $(c)

dev: ## Start Vite dev server
	docker-compose --profile dev up -d node

build-assets: ## Build frontend assets for production
	docker-compose exec php npm run build

# Setup commands
install: ## First time setup
	@echo "$(GREEN)Building containers...$(NC)"
	docker-compose build
	@echo "$(GREEN)Starting containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Installing Composer dependencies...$(NC)"
	docker-compose exec php composer install
	@echo "$(GREEN)Copying .env file...$(NC)"
	docker-compose exec php cp .env.example .env
	@echo "$(GREEN)Generating app key...$(NC)"
	docker-compose exec php php artisan key:generate
	@echo "$(GREEN)Running migrations...$(NC)"
	docker-compose exec php php artisan migrate
	@echo "$(GREEN)Installing NPM dependencies...$(NC)"
	docker-compose exec php npm install
	@echo "$(GREEN)Setup complete! Access http://localhost:8080$(NC)"

fresh: ## Reset everything and start fresh
	docker-compose down -v
	docker-compose build --no-cache
	docker-compose up -d
	docker-compose exec php composer install
	docker-compose exec php php artisan migrate:fresh --seed
	docker-compose exec php npm install
